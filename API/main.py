import cv2
import tempfile
import requests
import uuid
import os
import threading
import time
from datetime import datetime, timedelta
from difflib import get_close_matches
from fastapi import FastAPI, HTTPException, Body, WebSocket, WebSocketDisconnect, UploadFile, File
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client
from fastapi.responses import StreamingResponse
from ultralytics import YOLO
import re
import numpy as np
from paddleocr import PaddleOCR
import firebase_admin
from firebase_admin import credentials, firestore
from threading import Lock

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BUCKET = os.getenv("SUPABASE_BUCKET")

app = FastAPI()
# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow Next.js origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Firebase Admin SDK
cred = credentials.Certificate("firebase_key.json")
firebase_admin.initialize_app(cred)

# Create Firestore client
db = firestore.client()


ocr = PaddleOCR(use_angle_cls=True, use_gpu=False)

# Load the YOLOv8 model
yolo_model = YOLO("weights/license_plate_detector.pt")


live_feed_active = False
live_feed_logs = []
live_feed_thread = None

class VideoRequest(BaseModel):
    video_url: str = None
    video_path: str = None

class LiveFeedRequest(BaseModel):
    duration: int = 15

global_cap = None
cap_lock = Lock()

def get_webcam():
    global global_cap
    with cap_lock:
        if global_cap is None or not global_cap.isOpened():
            global_cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
            if not global_cap.isOpened():
                print("Failed to open webcam")
                return None
        return global_cap

def release_webcam():
    global global_cap
    with cap_lock:
        if global_cap is not None and global_cap.isOpened():
            global_cap.release()
            global_cap = None
            cv2.destroyAllWindows()
            print("Webcam released")

def download_video(video_url):
    response = requests.get(video_url, stream=True)
    if response.status_code != 200:
        raise Exception("Failed to download video")
    tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
    with open(tmp_file.name, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    return tmp_file.name

def sanitize_filename(name):
    # Replace non-ASCII characters
    return re.sub(r'[^\x00-\x7F]+', '_', name)

def upload_snapshot_to_supabase(local_path: str, snapshot_name: str) -> str:
    sanitized_name = sanitize_filename(snapshot_name)
    with open(local_path, "rb") as f:
        supabase.storage.from_(BUCKET).upload(
            f"snapshots/{sanitized_name}", f,
            file_options={"content-type": "image/jpeg", "x-upsert": "true"}
        )
    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/snapshots/{sanitized_name}"

def clean_plate_text(text):
    pattern = re.compile(r'\W')
    text = pattern.sub('', text)
    text = text.replace("???", "")
    text = text.replace("O", "0")
    text = text.replace("粤", "")
    return text.upper()

def paddle_ocr_on_plate(plate_img):
    result = ocr.ocr(plate_img, det=False, rec=True, cls=False)
    for r in result:
        text, score = r[0]
        if np.isnan(score):
            score = 0
        else:
            score = int(score * 100)
        if score > 60:
            return clean_plate_text(text)
    return None

def process_frame(frame, seen_vehicles, logs):
    try:
        current_time = datetime.utcnow()
        results = yolo_model(frame)[0]
        print(f"YOLO results: {len(results.boxes)} detections")  # Debug log

        for box in results.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cropped = frame[y1:y2, x1:x2]

            # Run PaddleOCR on cropped plate
            try:
                plate_text = paddle_ocr_on_plate(cropped)
                print(f"Plate text: {plate_text}")  # Debug log
            except Exception as e:
                print(f"PaddleOCR error: {e}")
                continue

            if plate_text and 4 <= len(plate_text) <= 10 and any(char.isdigit() for char in plate_text):
                
                # Helper function to get visitor status with time-based validation
                def get_visitor_status(plate):
                    visitor_status = "unauthorized"
                    try:
                        visitor_ref = db.collection("visitors").where("plate", "==", plate).limit(1).stream()
                        visitor_docs = list(visitor_ref)
                        if visitor_docs:
                            visitor = visitor_docs[0].to_dict()
                            visitor_type = visitor.get("visitorType", "").lower()
                            is_approved = visitor.get("isApproved", True)
                            
                            if visitor_type == "authorized":
                                # Authorized vehicles are always allowed (no time restrictions)
                                visitor_status = "authorized"
                                print(f"Vehicle {plate}: AUTHORIZED (permanent access)")
                                
                            elif visitor_type == "visitor" and is_approved:
                                # Visitor vehicles need time-based validation
                                current_time = datetime.utcnow()
                                
                                # Get the authorization period from authorizationTill object
                                authorization_till = visitor.get("authorizationTill", {})
                                auth_from = authorization_till.get("from")
                                auth_to = authorization_till.get("to")
                                
                                print(f"Vehicle {plate}: Checking visitor time restrictions...")
                                print(f"  Current time (UTC): {current_time}")
                                print(f"  Authorization from: {auth_from}")
                                print(f"  Authorization to: {auth_to}")
                                
                                # Check if we're within the allowed time period
                                within_time_period = True
                                
                                if auth_from or auth_to:
                                    try:
                                        if auth_from:
                                            # Handle different types of timestamp objects from Firestore
                                            if hasattr(auth_from, 'timestamp'):
                                                # Firestore Timestamp object
                                                from_datetime = datetime.fromtimestamp(auth_from.timestamp())
                                            elif isinstance(auth_from, dict) and '_seconds' in auth_from:
                                                # Firestore Timestamp as dict
                                                from_datetime = datetime.fromtimestamp(auth_from['_seconds'])
                                            elif isinstance(auth_from, str):
                                                # String timestamp
                                                from_datetime = datetime.fromisoformat(auth_from.replace('Z', '+00:00'))
                                            else:
                                                # Try direct conversion
                                                from_datetime = datetime.fromisoformat(str(auth_from).replace('Z', '+00:00'))
                                            
                                            # Convert to UTC for comparison
                                            if from_datetime.tzinfo is None:
                                                from_datetime = from_datetime.replace(tzinfo=None)
                                                current_time_compare = current_time.replace(tzinfo=None)
                                            else:
                                                from_datetime = from_datetime.astimezone(None).replace(tzinfo=None)
                                                current_time_compare = current_time.replace(tzinfo=None)
                                            
                                            if current_time_compare < from_datetime:
                                                within_time_period = False
                                                print(f"  ❌ Current time {current_time_compare} is before authorized time {from_datetime}")
                                        
                                        if auth_to and within_time_period:
                                            # Handle different types of timestamp objects from Firestore
                                            if hasattr(auth_to, 'timestamp'):
                                                # Firestore Timestamp object
                                                to_datetime = datetime.fromtimestamp(auth_to.timestamp())
                                            elif isinstance(auth_to, dict) and '_seconds' in auth_to:
                                                # Firestore Timestamp as dict
                                                to_datetime = datetime.fromtimestamp(auth_to['_seconds'])
                                            elif isinstance(auth_to, str):
                                                # String timestamp
                                                to_datetime = datetime.fromisoformat(auth_to.replace('Z', '+00:00'))
                                            else:
                                                # Try direct conversion
                                                to_datetime = datetime.fromisoformat(str(auth_to).replace('Z', '+00:00'))
                                            
                                            # Convert to UTC for comparison
                                            if to_datetime.tzinfo is None:
                                                to_datetime = to_datetime.replace(tzinfo=None)
                                                current_time_compare = current_time.replace(tzinfo=None)
                                            else:
                                                to_datetime = to_datetime.astimezone(None).replace(tzinfo=None)
                                                current_time_compare = current_time.replace(tzinfo=None)
                                            
                                            if current_time_compare > to_datetime:
                                                within_time_period = False
                                                print(f"  ❌ Current time {current_time_compare} is after authorized time {to_datetime}")
                                        
                                        if within_time_period:
                                            print(f"  ✅ Within authorized time period")
                                            
                                    except Exception as time_error:
                                        print(f"  ❌ Error parsing authorization times: {time_error}")
                                        within_time_period = False
                                else:
                                    # No time restrictions specified - treat as unauthorized for safety
                                    within_time_period = False
                                    print(f"  ❌ No authorization time period specified")
                                
                                # Final decision for visitor
                                if within_time_period:
                                    visitor_status = "visitor"
                                    print(f"Vehicle {plate}: VISITOR (authorized within time period)")
                                else:
                                    visitor_status = "unauthorized"
                                    print(f"Vehicle {plate}: UNAUTHORIZED (visitor outside allowed time period)")
                            else:
                                visitor_status = "unauthorized"
                                print(f"Vehicle {plate}: UNAUTHORIZED (visitor not approved or wrong visitor type)")
                        else:
                            print(f"Vehicle {plate}: UNAUTHORIZED (not found in visitor database)")
                            
                    except Exception as e:
                        print(f"Firestore visitor query error for plate {plate}: {e}")
                        visitor_status = "unauthorized"
                        
                    return visitor_status

                # Get the last log entry for this specific plate from database
                def get_last_log_entry(plate):
                    try:
                        # Option 1: Query without ordering (simpler, no index required)
                        # Get all logs for this plate and find the latest one manually
                        logs_ref = db.collection("logs").where("plate", "==", plate).stream()
                        logs_list = list(logs_ref)
                        
                        if logs_list:
                            # Sort by timestamp manually to find the latest
                            logs_data = []
                            for log_doc in logs_list:
                                log_data = log_doc.to_dict()
                                log_data['doc_id'] = log_doc.id
                                logs_data.append(log_data)
                            
                            # Sort by timestamp (newest first)
                            try:
                                logs_data.sort(key=lambda x: datetime.fromisoformat(x.get('timestamp', '').replace('Z', '+00:00')), reverse=True)
                                last_log = logs_data[0]
                                print(f"Last log for plate {plate}: Status={last_log.get('status')}, Time={last_log.get('timestamp')}")
                                return last_log
                            except Exception as sort_error:
                                print(f"Error sorting logs for plate {plate}: {sort_error}")
                                # If sorting fails, just return the first log
                                return logs_data[0] if logs_data else None
                        else:
                            print(f"No previous logs found for plate {plate} - this is a NEW vehicle")
                            return None
                            
                    except Exception as e:
                        print(f"Error getting last log entry for plate {plate}: {e}")
                        return None

                # Alternative approach using Firestore ordering (requires composite index)
                def get_last_log_entry_with_index(plate):
                    try:
                        # This query requires a composite index: (plate, timestamp)
                        # You need to create this index in Firebase Console
                        logs_ref = db.collection("logs").where("plate", "==", plate).order_by("timestamp", direction=firestore.Query.DESCENDING).limit(1).stream()
                        logs_list = list(logs_ref)
                        if logs_list:
                            last_log = logs_list[0].to_dict()
                            print(f"Last log for plate {plate}: Status={last_log.get('status')}, Time={last_log.get('timestamp')}")
                            return last_log
                        else:
                            print(f"No previous logs found for plate {plate} - this is a NEW vehicle")
                            return None
                    except Exception as e:
                        print(f"Error getting last log entry for plate {plate}: {e}")
                        # Fallback to the simpler method
                        return get_last_log_entry(plate)

                # Check if we should skip logging for this specific plate (avoid duplicate logs within short time)
                def should_skip_logging(plate, current_time_iso):
                    if plate in seen_vehicles:
                        last_logged_time_str = seen_vehicles[plate].get("last_logged_time")
                        if last_logged_time_str:
                            try:
                                last_logged_time = datetime.fromisoformat(last_logged_time_str.replace('Z', '+00:00'))
                                time_diff = current_time - last_logged_time
                                # Skip if less than 30 seconds since last log for THIS PLATE to avoid spam
                                if time_diff < timedelta(seconds=30):
                                    print(f"Skipping log for plate {plate} - too recent ({time_diff.total_seconds()} seconds)")
                                    return True
                            except Exception as e:
                                print(f"Error parsing last logged time for plate {plate}: {e}")
                    return False

                # Skip if too recent for THIS SPECIFIC PLATE
                if should_skip_logging(plate_text, current_time.isoformat()):
                    continue

                # Get last log entry from database for THIS SPECIFIC PLATE
                # Use the simpler method first (no index required)
                last_log = get_last_log_entry(plate_text)
                
                # Determine what status to log based on THIS VEHICLE'S database history ONLY
                if last_log is None:
                    # NEW VEHICLE (no previous logs for this plate) - LOG ENTRY OR BLOCKED
                    visitor_status = get_visitor_status(plate_text)
                    
                    if visitor_status == "unauthorized":
                        log_status = "blocked"
                        action_type = f"NEW_VEHICLE_BLOCKED ({plate_text})"
                    else:
                        log_status = "entry"
                        action_type = f"NEW_VEHICLE_ENTRY ({plate_text})"
                        
                else:
                    # THIS VEHICLE HAS PREVIOUS LOGS - CHECK ITS LAST STATUS
                    last_status = last_log.get("status", "")
                    last_timestamp_str = last_log.get("timestamp", "")
                    
                    try:
                        # Parse last timestamp for THIS VEHICLE
                        last_timestamp = datetime.fromisoformat(last_timestamp_str.replace('Z', '+00:00'))
                        time_since_last_log = current_time - last_timestamp
                        print(f"Vehicle {plate_text}: Time since its last log = {time_since_last_log}")  # Debug log
                        
                        # Only proceed if enough time has passed since THIS VEHICLE's last log (2 minutes)
                        if time_since_last_log < timedelta(minutes=2):
                            print(f"Skipping vehicle {plate_text} - not enough time passed since its last log ({time_since_last_log})")
                            continue
                            
                    except Exception as e:
                        print(f"Error parsing timestamp for vehicle {plate_text}: {e}")
                        # If timestamp parsing fails, treat as first detection
                        last_status = ""
                    
                    visitor_status = get_visitor_status(plate_text)
                    
                    if last_status == "entry":
                        # THIS VEHICLE'S LAST STATUS WAS ENTRY → LOG EXIT
                        log_status = "exit"
                        action_type = f"EXIT_AFTER_ENTRY ({plate_text})"
                        
                    elif last_status == "exit":
                        # THIS VEHICLE'S LAST STATUS WAS EXIT → LOG ENTRY OR BLOCKED (based on current authorization)
                        if visitor_status == "unauthorized":
                            log_status = "blocked"
                            action_type = f"BLOCKED_AFTER_EXIT ({plate_text})"
                        else:
                            log_status = "entry"
                            action_type = f"REENTRY_AFTER_EXIT ({plate_text})"
                            
                    elif last_status == "blocked":
                        # THIS VEHICLE'S LAST STATUS WAS BLOCKED → CHECK CURRENT AUTHORIZATION
                        if visitor_status == "unauthorized":
                            log_status = "blocked"
                            action_type = f"STILL_BLOCKED ({plate_text})"
                        else:
                            # Now authorized → allow entry
                            log_status = "entry"
                            action_type = f"ENTRY_AFTER_AUTHORIZATION ({plate_text})"
                            
                    else:
                        # UNKNOWN LAST STATUS FOR THIS VEHICLE → TREAT AS FIRST DETECTION
                        if visitor_status == "unauthorized":
                            log_status = "blocked"
                            action_type = f"UNKNOWN_STATUS_BLOCKED ({plate_text})"
                        else:
                            log_status = "entry"
                            action_type = f"UNKNOWN_STATUS_ENTRY ({plate_text})"

                # Create snapshot
                snapshot_name = f"{plate_text}_{uuid.uuid4().hex[:6]}_{log_status}.jpg"
                temp_dir = tempfile.gettempdir()
                snapshot_path = os.path.join(temp_dir, snapshot_name)
                
                try:
                    cv2.imwrite(snapshot_path, frame)
                    snapshot_url = upload_snapshot_to_supabase(snapshot_path, snapshot_name)
                except Exception as e:
                    print(f"Snapshot error: {e}")
                    snapshot_url = "upload_failed"

                # Create log entry
                log_entry = {
                    "plate": plate_text,
                    "type": "unknown",
                    "status": log_status,
                    "timestamp": current_time.isoformat(),
                    "snapshot_url": snapshot_url,
                    "visitorStatus": visitor_status
                }

                # Add log to Firestore
                try:
                    db.collection("logs").add(log_entry)
                    print(f"Successfully added to Firestore: {action_type} - {log_entry}")
                except Exception as e:
                    print(f"Firestore log write error: {e}")

                # Update seen_vehicles to track last logged time for THIS SPECIFIC PLATE (prevent spam)
                seen_vehicles[plate_text] = {
                    "last_logged_time": current_time.isoformat(),
                    "last_status": log_status
                }
                
                logs.append(log_entry)
                print(f"✅ Vehicle {plate_text} - {action_type}: {log_entry}")  # Debug log
                        
    except Exception as e:
        print(f"Error in process_frame: {e}")

def safe_unlink(file_path: str, max_attempts: int = 3, delay: float = 0.5) -> None:
    """Attempt to delete a file with retries to handle file locking issues."""
    for attempt in range(max_attempts):
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
            return
        except PermissionError as e:
            if attempt == max_attempts - 1:
                print(f"Warning: Failed to delete {file_path} after {max_attempts} attempts: {e}")
                return
            time.sleep(delay)  # Wait before retrying

async def cleanup_later(file_path: str, max_attempts: int = 5, delay: float = 1.0):
    """Deferred cleanup to handle file locking issues."""
    for attempt in range(max_attempts):
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
                print(f"Successfully deleted {file_path}")
            return
        except PermissionError as e:
            if attempt == max_attempts - 1:
                print(f"Warning: Failed to delete {file_path} after {max_attempts} attempts: {e}")
                return
            await asyncio.sleep(delay)

async def cleanup_later(file_path: str, max_attempts: int = 5, delay: float = 1.0):
    """Deferred cleanup to handle file locking issues."""
    for attempt in range(max_attempts):
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
                print(f"Successfully deleted {file_path}")
            return
        except PermissionError as e:
            if attempt == max_attempts - 1:
                print(f"Warning: Failed to delete {file_path} after {max_attempts} attempts: {e}")
                return
            await asyncio.sleep(delay)

def get_webcam():
    global global_cap
    with cap_lock:
        if global_cap is None or not global_cap.isOpened():
            print("Attempting to open webcam")
            global_cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
            if not global_cap.isOpened():
                print("Failed to open webcam")
                return None
            print("Webcam opened successfully")
        return global_cap

def release_webcam():
    global global_cap
    with cap_lock:
        if global_cap is not None and global_cap.isOpened():
            global_cap.release()
            global_cap = None
            cv2.destroyAllWindows()
            print("Webcam released successfully")
        else:
            print("No webcam to release or already released")

@app.post("/process-video")
async def process_video(file: UploadFile = File(None), req: Optional[VideoRequest] = Body(None)):
    video_path = None
    cap = None
    try:
        if file:
            # Save uploaded file temporarily
            tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
            with open(tmp_file.name, "wb") as f:
                content = await file.read()
                f.write(content)
            video_path = tmp_file.name
        elif req and req.video_path:
            video_path = req.video_path
        elif req and req.video_url:
            video_path = download_video(req.video_url)
        else:
            raise HTTPException(status_code=400, detail="No video provided (file, video_path, or video_url required)")

        print(f"Starting video processing for: {video_path}")  # Debug log

        # Process video
        try:
            cap = cv2.VideoCapture(video_path, cv2.CAP_FFMPEG)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Cannot open video: {str(e)}")

        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Cannot open video: VideoCapture failed")

        seen_vehicles, logs = {}, []
        frame_count = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                print(f"End of video or read error at frame {frame_count}")  # Debug log
                break
            frame_count += 1
            if frame_count % 25 != 0:
                continue
            print(f"Processing frame {frame_count}")  # Debug log
            try:
                process_frame(frame, seen_vehicles, logs)
            except Exception as e:
                print(f"Error processing frame {frame_count}: {e}")  # Debug log
                continue

        print(f"Processed {frame_count} frames, generated {len(logs)} logs")  # Debug log
        return logs
    except Exception as e:
        print(f"Error in process_video: {str(e)}")  # Debug log
        raise HTTPException(status_code=500, detail=f"Failed to process video: {str(e)}")
    finally:
        # Release VideoCapture
        if cap is not None:
            try:
                cap.release()
                cv2.destroyAllWindows()
                print("VideoCapture released")  # Debug log
            except Exception as e:
                print(f"Error releasing VideoCapture: {e}")
        # Defer temporary file cleanup
        if file and video_path:
            asyncio.create_task(cleanup_later(video_path))

def live_feed_worker():
    global live_feed_active, live_feed_logs
    cap = get_webcam()
    if not cap:
        live_feed_active = False
        return

    try:
        seen_vehicles = {}
        frame_count = 0
        while live_feed_active:
            with cap_lock:
                if not cap.isOpened():
                    print("Webcam not accessible in live_feed_worker")
                    break
                ret, frame = cap.read()
            if not ret:
                print("Failed to read frame")
                break
            frame_count += 1
            if frame_count % 25 != 0:
                continue
            process_frame(frame, seen_vehicles, live_feed_logs)
            time.sleep(0.1)
    except Exception as e:
        print(f"Error in live_feed_worker: {e}")
        live_feed_active = False
    finally:
        release_webcam()

@app.get("/live-video")
async def video_feed():
    def gen_frames():
        cap = get_webcam()  # Use centralized webcam access from previous response
        if not cap:
            print("Error: Webcam not accessible in live-video")
            return

        try:
            while True:
                with cap_lock:
                    if not cap.isOpened():
                        print("Error: Webcam not accessible in live-video")
                        break
                    success, frame = cap.read()
                if not success:
                    print("Error: Failed to read frame in live-video")
                    break
                ret, buffer = cv2.imencode('.jpg', frame)
                if not ret:
                    print("Error: Failed to encode frame in live-video")
                    continue
                frame = buffer.tobytes()
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
                )
        except Exception as e:
            print(f"Error in gen_frames: {e}")
        finally:
            release_webcam()  # Ensure webcam is released

    return StreamingResponse(
        gen_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.websocket("/ws/plates")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        previous_log_len = 0
        while True:
            await asyncio.sleep(0.5)  # Reduced throttle for faster updates
            new_logs = live_feed_logs[previous_log_len:]
            for log in new_logs:
                # Send all logs for debugging (remove filter temporarily)
                await websocket.send_json(log)
                print(f"Sent log via WebSocket: {log}")  # Debug log
            previous_log_len = len(live_feed_logs)
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")

@app.post("/start-feed")
def start_feed():
    global live_feed_active, live_feed_thread, live_feed_logs
    if live_feed_active:
        return {"message": "Already running"}
    live_feed_logs = []
    live_feed_active = True
    release_webcam()  # Ensure any existing webcam instance is released
    live_feed_thread = threading.Thread(target=live_feed_worker)
    live_feed_thread.start()
    return {"message": "Started live feed"}

@app.post("/stop-feed")
def stop_feed():
    global live_feed_active
    live_feed_active = False
    if live_feed_thread:
        live_feed_thread.join()  # Wait for the thread to finish
    release_webcam()
    return {"message": "Stopped live feed"}

@app.get("/get-logs")
def get_logs():
    logs_ref = db.collection("logs").where("visitorStatus", "in", ["authorized", "visitor"]).stream()
    logs = [log.to_dict() for log in logs_ref]
    return {"logs": logs}

def gen_frames():
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    while True:
        success, frame = cap.read()
        if not success:
            break
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
        )
    cap.release()

@app.get("/live-video")
async def video_feed():
    def gen_frames():
        try:
            cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
            if not cap.isOpened():
                print("Webcam not accessible in live-video")
                return
            
            while True:
                success, frame = cap.read()
                if not success:
                    print("Failed to read frame in live-video")
                    break
                ret, buffer = cv2.imencode('.jpg', frame)
                if not ret:
                    print("Failed to encode frame")
                    continue
                frame = buffer.tobytes()
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
                )
        except Exception as e:
            print(f"Error in gen_frames: {e}")
        finally:
            cap.release()
            cv2.destroyAllWindows()
    
    return StreamingResponse(gen_frames(), media_type="multipart/x-mixed-replace; boundary=frame")
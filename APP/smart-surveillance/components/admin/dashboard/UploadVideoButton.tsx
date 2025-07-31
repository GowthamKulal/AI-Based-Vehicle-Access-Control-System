"use client";

import { Button } from "@/components/ui/Button";
import { connectToALPR, fetchFromALPR } from "@/lib/socket";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import CameraPreview from "./CameraPreview";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Log } from "@/lib/typings";

const UploadVideoButton = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [liveFeedActive, setLiveFeedActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const logBoxRef = useRef<HTMLDivElement>(null);

  // Debug state changes
  useEffect(() => {
    console.log(
      "State update - liveFeedActive:",
      liveFeedActive,
      "isUploading:",
      isUploading,
      "videoUrl:",
      videoUrl
    );
  }, [liveFeedActive, isUploading, videoUrl]);

  const getStatusColor = (status: string) => {
    if (!status) return "text-gray-500";
    switch (status.toLowerCase()) {
      case "authorized":
        return "text-emerald-500";
      case "visitor":
        return "text-amber-500";
      case "unauthorized":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getAccessText = (status: string, visitorStatus: string) => {
    return (status.toLowerCase() === "entry" &&
      visitorStatus.toLowerCase() === "visitor") ||
      (status.toLowerCase() === "entry" &&
        visitorStatus.toLowerCase() === "authorized")
      ? "Can Enter"
      : (status.toLowerCase() === "exit" &&
          visitorStatus.toLowerCase() === "visitor") ||
        (status.toLowerCase() === "exit" &&
          visitorStatus.toLowerCase() === "authorized")
      ? "Can Leave"
      : "You are not authorized.";
  };

  const fetchHistoricalLogs = async () => {
    try {
      const data = await fetchFromALPR("/get-logs");
      if (data.logs && data.logs.length > 0) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error("Error loading historical logs:", error);
      toast.error("Failed to load historical logs");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) {
        throw new Error("No file selected");
      }

      setIsUploading(true);
      setLiveFeedActive(false); // Explicitly disable live feed
      setVideoUrl(null);
      setLogs([]);

      // Close existing WebSocket
      if (socket) {
        socket.close();
        setSocket(null);
        console.log("Closed existing WebSocket");
      }

      // Set video preview
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      console.log("Set videoUrl:", url);

      // Upload file to backend
      const formData = new FormData();
      formData.append("file", file);

      console.log("Uploading video file:", file.name);
      const response = await fetch("http://localhost:8000/process-video", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Process video error response:", errorText);
        throw new Error(
          `Failed to process video: ${response.status} - ${errorText}`
        );
      }

      const logs = await response.json();
      setLogs(logs);

      toast.success("Video uploaded and processed successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(`Failed to upload video file: ${error}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLiveCamera = async () => {
    try {
      // Close any existing session
      await handleCloseFeed();

      setIsUploading(false);
      setVideoUrl(null);
      setLiveFeedActive(true);
      setLogs([]);

      const response = await fetchFromALPR("/start-feed", "POST");
      console.log("Start feed response:", response);
      toast.success(response.message);

      const ws = connectToALPR((log) => {
        console.log("Received WebSocket log:", log);
        setLogs((prev) => [log, ...prev]);
        const accessText = getAccessText(log.status, log.visitorStatus);
        toast.success(
          `${log.plate} [${log.visitorStatus?.toUpperCase()}] [${accessText}]`
        );
      });

      setSocket(ws);
    } catch (error) {
      console.error("Error starting live camera:", error);
      toast.error(`Failed to start live camera: ${error}`);
      setLiveFeedActive(false);
    }
  };

  const handleCloseFeed = async () => {
    try {
      setLiveFeedActive(false);
      setVideoUrl(null);
      setLogs([]);

      if (socket) {
        socket.close();
        setSocket(null);
        fetchHistoricalLogs();
      }

      await fetchFromALPR("/stop-feed", "POST");
      toast.success("Feed closed");
    } catch (error) {
      console.error("Error closing feed:", error);
      toast.error("Failed to close feed");
    }
  };

  const handleStartFeed = async () => {
    try {
      if (!liveFeedActive) {
        throw new Error("Live feed must be active to start processing");
      }
      setIsProcessing(true);
      const data = await fetchFromALPR("/start-feed", "POST");
      toast.success(data.message);
    } catch (error) {
      console.error("Error starting feed:", error);
      toast.error(`Error starting feed: ${error}`);
    }
  };

  const handleStopFeed = async () => {
    try {
      const data = await fetchFromALPR("/stop-feed", "POST");
      setIsProcessing(false);
      toast.success(data.message);
    } catch (error) {
      console.error("Error stopping feed:", error);
      toast.error(`Error stopping feed: ${error}`);
    }
  };

  useEffect(() => {
    fetchHistoricalLogs();
  }, []);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-5">
      <div className="flex flex-col">
        <div className="mb-4 flex flex-wrap gap-3">
          <Button
            onClick={handleLiveCamera}
            disabled={liveFeedActive || isUploading}
            className="px-4 py-2 bg-darkgreen hover:bg-green-700 text-white rounded border border-green-600 transition-colors font-mono disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Use Live Camera
          </Button>

          <Label
            className={`px-4 py-2 bg-darkblue hover:bg-blue-700 text-white rounded border border-blue-600 transition-colors cursor-pointer font-mono ${
              videoUrl || isUploading || liveFeedActive
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            Upload Video
            <Input
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={!!videoUrl || isUploading || liveFeedActive}
            />
          </Label>

          {(liveFeedActive || videoUrl) && (
            <Button
              onClick={handleCloseFeed}
              disabled={isUploading}
              className="px-4 py-2 bg-red-800 hover:bg-red-700 text-red-300 rounded border border-red-600 transition-colors font-mono disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Close Feed
            </Button>
          )}
        </div>

        <div className="border-2 border-darkgreen rounded-lg overflow-hidden bg-black">
          {isUploading ? (
            <div className="flex items-center justify-center h-[300px] text-gray-500 font-mono">
              Processing video...
            </div>
          ) : videoUrl ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full aspect-video"
            />
          ) : liveFeedActive ? (
            <CameraPreview />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500 font-mono">
              No video or live feed selected.
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            onClick={handleStartFeed}
            disabled={
              isProcessing || (!liveFeedActive && !videoUrl) || isUploading
            }
            className="px-4 py-2 bg-green-800 hover:bg-green-700 text-green-300 rounded border border-green-600 transition-colors font-mono disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Feed Processing
          </Button>

          <Button
            onClick={handleStopFeed}
            disabled={!isProcessing || isUploading}
            className="px-4 py-2 bg-red-800 hover:bg-red-700 text-red-300 rounded border border-red-600 transition-colors font-mono disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Stop Feed Processing
          </Button>
        </div>
      </div>

      <div className="flex flex-col">
        <h2 className="text-xl font-mono mb-4">Detected Plates:</h2>
        <div
          ref={logBoxRef}
          className="h-[500px] font-mono text-sm overflow-y-auto bg-offblack/80 rounded-lg p-4 whitespace-pre-wrap scrollbar"
        >
          {logs.length > 0 ? (
            logs.map((log, i) => {
              const timestamp =
                log.formattedTime ||
                new Date(log.timestamp).toLocaleTimeString();
              const statusClass = getStatusColor(log.visitorStatus ?? "");
              const accessText = getAccessText(
                log.status,
                log.visitorStatus ?? ""
              );

              return (
                <div key={i} className="mb-8">
                  <div className="flex space-x-2 items-center">
                    <span>
                      [{timestamp}] {log.status?.toUpperCase()} -{" "}
                      <span className="text-lg">{log.plate}</span>
                    </span>
                    <span className={statusClass}>
                      [{log.visitorStatus?.toUpperCase() || "UNKNOWN"}]
                    </span>
                    <span className="text-blue-400">{accessText}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-gray-500">Waiting for plates...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadVideoButton;

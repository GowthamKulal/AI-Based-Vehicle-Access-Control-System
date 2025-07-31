import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import auth from "@/app/utils/fireAuth";
import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDocs,
  orderBy,
  Query,
  query,
  where,
} from "firebase/firestore";
import { Log } from "../typings";
import db from "@/app/utils/firestore";

export async function login(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return {
      uid: userCredential.user.uid,
    };
  } catch (error: any) {
    throw new Error(error.message || "Login failed");
  }
}

export async function logout() {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message || "Logout failed");
  }
}

export async function getLogs(
  filter: boolean = false,
  visitorStatus: string = "all"
): Promise<{
  success: boolean;
  logs: Log[];
}> {
  try {
    let q: Query<DocumentData, DocumentData>;

    if (filter && visitorStatus !== "all") {
      // Filter by both status and visitorStatus
      q = query(
        collection(db, "logs"),
        where("visitorStatus", "==", visitorStatus),
        orderBy("timestamp", "desc")
      );
    } else if (filter) {
      // Filter only by status
      q = query(collection(db, "logs"), orderBy("timestamp", "desc"));
    } else if (visitorStatus !== "all") {
      // Filter only by visitorStatus
      q = query(
        collection(db, "logs"),
        where("visitorStatus", "==", visitorStatus),
        orderBy("timestamp", "desc")
      );
    } else {
      // No filtering
      q = query(collection(db, "logs"), orderBy("timestamp", "desc"));
    }

    const querySnapshot = await getDocs(q);

    const logs: Log[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        logId: doc.id,
        plate: data.plate,
        type: data.type,
        status: data.status,
        timestamp: data.timestamp,
        snapshot_url: data.snapshot_url,
        visitorStatus: data.visitorStatus,
        formattedTime: data.formattedTime,
      };
    });

    return { success: true, logs };
  } catch (error) {
    console.error("Error getting logs:", error);
    return { success: false, logs: [] };
  }
}

export async function getLogsCount(): Promise<{
  success: boolean;
  total: number;
  unauthorized: number;
  authorized: number;
  visitor: number;
}> {
  try {
    const logsCollection = collection(db, "logs");

    // Total logs
    const totalSnapshot = await getDocs(query(logsCollection));

    // Unauthorized logs
    const unauthorizedSnapshot = await getDocs(
      query(logsCollection, where("visitorStatus", "==", "unauthorized"))
    );

    // Authorized logs
    const authorizedSnapshot = await getDocs(
      query(logsCollection, where("visitorStatus", "==", "authorized"))
    );

    // visitor logs
    const visitorSnapshot = await getDocs(
      query(logsCollection, where("visitorStatus", "==", "visitor"))
    );

    return {
      success: true,
      total: totalSnapshot.size,
      unauthorized: unauthorizedSnapshot.size,
      authorized: authorizedSnapshot.size,
      visitor: visitorSnapshot.size,
    };
  } catch (error) {
    console.error("Error getting logs count:", error);
    return {
      success: false,
      total: 0,
      unauthorized: 0,
      authorized: 0,
      visitor: 0,
    };
  }
}

export async function deleteLog(logId: string) {
  try {
    await deleteDoc(doc(db, "logs", logId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting logId:", error);
    return { success: false, error: error };
  }
}

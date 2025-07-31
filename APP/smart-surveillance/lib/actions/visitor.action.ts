"use server";

import {
  addDoc,
  collection,
  deleteDoc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { Visitor } from "../typings";
import db from "@/app/utils/firestore";

export async function addVisitorRequest(visitor: Visitor) {
  try {
    const docRef = await addDoc(collection(db, "visitors"), visitor);
    console.log("Document written with ID: ", docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.log("Error sending request: ", error);
    return { success: false, error: error };
  }
}

export async function getVisitors(): Promise<{
  success: boolean;
  visitors: Visitor[];
}> {
  try {
    const q = query(
      collection(db, "visitors"),
      where("isApproved", "==", true),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);

    const visitors: Visitor[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        visitorId: data.visitorId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        plate: data.plate,
        vehicleType: data.vehicleType,
        reason: data.reason,
        authorizationTill: {
          from: data.authorizationTill?.from?.toDate?.() ?? undefined,
          to: data.authorizationTill?.to?.toDate?.() ?? undefined,
        },
        isApproved: data.isApproved ?? false,
        visitorType: data.visitorType ?? "visitor",
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
      };
    });

    return { success: true, visitors };
  } catch (error) {
    console.error("Error getting visitors:", error);
    return { success: false, visitors: [] };
  }
}

export async function getNewVisitors(): Promise<{
  success: boolean;
  visitors: Visitor[];
}> {
  try {
    const q = query(
      collection(db, "visitors"),
      where("isApproved", "==", false),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);

    const visitors: Visitor[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        visitorId: data.visitorId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        plate: data.plate,
        vehicleType: data.vehicleType,
        reason: data.reason,
        authorizationTill: {
          from: data.authorizationTill?.from?.toDate?.() ?? undefined,
          to: data.authorizationTill?.to?.toDate?.() ?? undefined,
        },
        isApproved: data.isApproved ?? false,
        visitorType: data.visitorType ?? "visitor",
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
      };
    });

    return { success: true, visitors };
  } catch (error) {
    console.error("Error getting new visitors:", error);
    return { success: false, visitors: [] };
  }
}

export async function getAuthorizedVisitors(): Promise<{
  success: boolean;
  visitors: Visitor[];
}> {
  try {
    const q = query(
      collection(db, "visitors"),
      where("visitorType", "==", "authorized"),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);

    const visitors: Visitor[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        visitorId: data.visitorId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        plate: data.plate,
        vehicleType: data.vehicleType,
        reason: data.reason,
        authorizationTill: {
          from: data.authorizationTill?.from?.toDate?.() ?? undefined,
          to: data.authorizationTill?.to?.toDate?.() ?? undefined,
        },
        isApproved: data.isApproved ?? false,
        visitorType: data.visitorType ?? "visitor",
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
      };
    });

    return { success: true, visitors };
  } catch (error) {
    console.error("Error getting authorized visitors:", error);
    return { success: false, visitors: [] };
  }
}

export async function deleteVisitor(visitorId: string) {
  try {
    // Create a query to find the document with matching visitorId
    const q = query(
      collection(db, "visitors"),
      where("visitorId", "==", visitorId)
    );

    // Execute the query to get the document reference
    const querySnapshot = await getDocs(q);

    // Check if any document was found
    if (querySnapshot.empty) {
      throw new Error("Visitor not found");
    }

    // Get the document reference and delete it
    const docRef = querySnapshot.docs[0].ref;
    await deleteDoc(docRef);

    return { success: true };
  } catch (error) {
    console.error("Error deleting visitor:", error);
    return { success: false, error: String(error) };
  }
}

export async function updateVisitor(
  visitor: Partial<Visitor> & { visitorId: string }
) {
  try {
    const q = query(
      collection(db, "visitors"),
      where("visitorId", "==", visitor.visitorId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) throw new Error("Visitor not found");

    const docRef = querySnapshot.docs[0].ref;
    const { ...fieldsToUpdate } = visitor;

    await updateDoc(docRef, fieldsToUpdate);

    const updatedDoc = await getDoc(docRef);
    const data = updatedDoc.data();

    if (!data) throw new Error("Visitor not found after update");

    const updatedVisitor: Visitor = {
      visitorId: data.visitorId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      plate: data.plate,
      vehicleType: data.vehicleType,
      reason: data.reason,
      authorizationTill: {
        from: data.authorizationTill?.from?.toDate?.() ?? undefined,
        to: data.authorizationTill?.to?.toDate?.() ?? undefined,
      },
      isApproved: data.isApproved ?? false,
      visitorType: data.visitorType ?? "visitor",
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    };

    return { success: true, visitor: updatedVisitor };
  } catch (error) {
    console.error("Error updating visitor by visitorId field:", error);
    return { success: false, error: String(error) };
  }
}

export async function getVisitorsCount(): Promise<{
  success: boolean;
  total: number;
  requests: number;
  authorized: number;
}> {
  try {
    const visitorsCollection = collection(db, "visitors");

    // Total visitors
    const totalSnapshot = await getDocs(query(visitorsCollection));

    // Pending visitor requests (not approved yet)
    const requestSnapshot = await getDocs(
      query(visitorsCollection, where("isApproved", "==", false))
    );

    // Authorized visitors
    const authorizedSnapshot = await getDocs(
      query(visitorsCollection, where("visitorType", "==", "authorized"))
    );

    return {
      success: true,
      total: totalSnapshot.size,
      requests: requestSnapshot.size,
      authorized: authorizedSnapshot.size,
    };
  } catch (error) {
    console.error("Error getting visitors count:", error);
    return {
      success: false,
      total: 0,
      requests: 0,
      authorized: 0,
    };
  }
}

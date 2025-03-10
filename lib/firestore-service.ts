"use server"

import { db, applicationsCollection } from "./firebase-admin"

export type Application = {
  id: string
  name: string
  email: string
  phone: string
  cvUrl: string
  fileName: string
  fileType: string
  fileSize: number
  submittedAt: string
  status: string
}

export async function saveApplicationToFirestore(application: Application): Promise<void> {
  try {
    const applicationData = {
      ...application,
    };
    await db.collection(applicationsCollection).doc(application.id).set(applicationData);
  } catch (error) {
    console.error("Error saving application to Firestore:", error);
    throw new Error("Failed to save application data");
  }
}

export async function getApplicationsFromFirestore(): Promise<Application[]> {
  try {
    const snapshot = await db.collection(applicationsCollection).get()
    return snapshot.docs.map((doc) => doc.data() as Application)
  } catch (error) {
    console.error("Error getting applications from Firestore:", error)
    throw new Error("Failed to retrieve applications")
  }
}

export async function getApplicationByIdFromFirestore(id: string): Promise<Application | null> {
  try {
    const doc = await db.collection(applicationsCollection).doc(id).get()
    if (!doc.exists) {
      return null
    }
    return doc.data() as Application
  } catch (error) {
    console.error("Error getting application from Firestore:", error)
    throw new Error("Failed to retrieve application")
  }
}

export async function updateApplicationStatusInFirestore(id: string, status: string): Promise<void> {
  try {
    await db.collection(applicationsCollection).doc(id).update({ status })
  } catch (error) {
    console.error("Error updating application status in Firestore:", error)
    throw new Error("Failed to update application status")
  }
}


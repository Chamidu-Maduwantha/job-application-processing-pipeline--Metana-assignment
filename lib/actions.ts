"use server"

import { revalidatePath } from "next/cache"
import { uploadFileToGCS } from "./storage-service"
import {
  saveApplicationToFirestore,
  getApplicationsFromFirestore,
  updateApplicationStatusInFirestore,
  type Application,
} from "./firestore-service"
import { saveToGoogleSheets } from "./google-sheets-service"
import { sendWebhookNotification } from "./webhook-service"
import { scheduleFollowUpEmail } from "./email-service"

// Define the structure for extracted CV data
export type ExtractedCVData = {
  education: string[]
  qualifications: string[]
  projects: string[]
  personalInfo: {
    name?: string
    email?: string
    phone?: string
    linkedin?: string
    otherLinks?: string[]
  }
  rawText: string
}

// Update the submitApplication function to better handle the extracted data
export async function submitApplication(formData: FormData): Promise<{ success: boolean; id: string; cvUrl: string }> {
  try {
    console.log("Starting application submission process")

    // Extract form data
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const cvFile = formData.get("cv") as File
    const extractedDataJson = formData.get("extractedData") as string
    const isProduction = formData.get("isProduction") === "true"

    console.log("Form data extracted:", { name, email, phone, isProduction })

    if (!name || !email || !phone || !cvFile) {
      throw new Error("Missing required fields")
    }

    console.log("Processing CV file:", cvFile.name, cvFile.type, `${(cvFile.size / 1024).toFixed(2)} KB`)

    // Upload the CV to Google Cloud Storage
    console.log("Uploading CV to Google Cloud Storage")
    const cvUrl = await uploadFileToGCS(cvFile)
    console.log("CV uploaded to GCS:", cvUrl)

    // Create a basic extracted data structure with the form information
    // This ensures we always have valid data even if parsing fails
    const basicData = {
      education: ["Education details will be processed"],
      qualifications: ["Skills and qualifications will be processed"],
      projects: ["Projects will be processed"],
      personalInfo: {
        name: name,
        email: email,
        phone: phone,
      },
      rawText: `Application from ${name} (${email}, ${phone}). File: ${cvFile.name} (${cvFile.type}, ${(cvFile.size / 1024).toFixed(1)} KB)`,
    }

    // Try to parse the extracted data from the client
    let extractedData = basicData
    if (extractedDataJson) {
      try {
        const parsedData = JSON.parse(extractedDataJson)
        console.log("Using client-side extracted data")

        // Merge the parsed data with the basic data to ensure we have valid values
        extractedData = {
          education:
            Array.isArray(parsedData.education) && parsedData.education.length > 0
              ? parsedData.education
              : basicData.education,
          qualifications:
            Array.isArray(parsedData.qualifications) && parsedData.qualifications.length > 0
              ? parsedData.qualifications
              : basicData.qualifications,
          projects:
            Array.isArray(parsedData.projects) && parsedData.projects.length > 0
              ? parsedData.projects
              : basicData.projects,
          personalInfo: {
            ...basicData.personalInfo,
            ...(parsedData.personalInfo || {}),
          },
          rawText: parsedData.rawText || basicData.rawText,
        }

        // Ensure the raw text is not too large
        if (extractedData.rawText && extractedData.rawText.length > 10000) {
          console.log(`Truncating raw text from ${extractedData.rawText.length} to 10000 characters`)
          extractedData.rawText = extractedData.rawText.substring(0, 10000) + "... (truncated)"
        }
      } catch (error) {
        console.error("Error parsing extracted data JSON:", error)
        // Fall back to the basic data
      }
    } else {
      console.log("No client-side extracted data, using fallback")
    }

    // Generate a unique ID for the application
    const id = Date.now().toString()

    // Create application object
    const application = {
      id,
      name,
      email,
      phone,
      cvUrl,
      fileName: cvFile.name,
      fileType: cvFile.type,
      fileSize: cvFile.size,
      submittedAt: new Date().toISOString(),
      status: "new",
      extractedData,
    }

    // Save the application to Firestore
    console.log("Saving application to Firestore...")
    await saveApplicationToFirestore(application)
    console.log("Application saved to Firestore")

    // Save the application data and extracted CV information to Google Sheets
    console.log("Saving application data to Google Sheets...")
    await saveToGoogleSheets(
      {
        id,
        name,
        email,
        phone,
        cvUrl,
        submittedAt: application.submittedAt,
      },
      extractedData,
    )
    console.log("Application data saved to Google Sheets")

    // Send webhook notification
    console.log("Sending webhook notification...")
    await sendWebhookNotification(extractedData, cvUrl, name, email, isProduction)

    // Schedule follow-up email for tomorrow
    console.log("Scheduling follow-up email...")
    await scheduleFollowUpEmail({
      to: email,
      name: name,
      cvUrl: cvUrl,
      applicationId: id,
    })

    // Revalidate any pages that display applications
    revalidatePath("/")

    console.log("Application submission process completed successfully")
    return { success: true, id, cvUrl }
  } catch (error) {
    console.error("Error submitting application:", error)
    throw new Error(`Failed to submit application: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function getAllApplications(): Promise<Application[]> {
  return getApplicationsFromFirestore()
}

export async function updateApplicationStatus(id: string, status: string): Promise<void> {
  await updateApplicationStatusInFirestore(id, status)
  revalidatePath("/applications")
}


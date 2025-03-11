import { type NextRequest, NextResponse } from "next/server"
import { sendFollowUpEmail } from "@/lib/email-service"
import { getFirestore } from "firebase-admin/firestore"
import { initializeApp, getApps, cert } from "firebase-admin/app"


const db = getFirestore()

export async function GET(request: NextRequest) {
  try {
    // Check for a secret key to secure the endpoint
    
    console.log("Processing scheduled emails...")

    // Get current time
    const now = new Date()

    // Get all emails scheduled to be sent before now
    const emailsSnapshot = await db
      .collection("scheduledEmails")
      .where("scheduledFor", "<=", now.toISOString())
      .where("sent", "==", false)
      .limit(50)
      .get()

    if (emailsSnapshot.empty) {
      console.log("No emails to send at this time")
      return NextResponse.json({ message: "No emails to send" })
    }

    // Process each email
    const results = []
    for (const doc of emailsSnapshot.docs) {
      const emailData = doc.data()
      console.log(`Sending email to ${emailData.to}...`)

      try {
        // Send the email
        await sendFollowUpEmail({
          to: emailData.to,
          name: emailData.name,
          cvUrl: emailData.cvUrl,
          applicationId: emailData.applicationId,
        })

        results.push({
          id: doc.id,
          status: "sent",
          to: emailData.to,
        })
      } catch (error) {
        console.error(`Error sending email to ${emailData.to}:`, error)
        results.push({
          id: doc.id,
          status: "error",
          to: emailData.to,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error("Error processing scheduled emails:", error)
    return NextResponse.json({ error: "Failed to process scheduled emails" }, { status: 500 })
  }
}


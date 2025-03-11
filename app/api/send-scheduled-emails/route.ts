import { type NextRequest, NextResponse } from "next/server"
import { sendFollowUpEmail } from "@/lib/email-service"
import { getFirestore } from "firebase-admin/firestore"


const db = getFirestore()

export async function GET(request: NextRequest) {
  try {
    
    console.log("Processing scheduled emails...")

    const now = new Date()

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

    const results = []
    for (const doc of emailsSnapshot.docs) {
      const emailData = doc.data()
      console.log(`Sending email to ${emailData.to}...`)

      try {
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


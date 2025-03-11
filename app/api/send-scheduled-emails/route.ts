import { type NextRequest, NextResponse } from "next/server"
import { sendFollowUpEmail, getScheduledEmails, removeScheduledEmail } from "@/lib/email-service"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Processing scheduled emails...")

    const scheduledEmails = getScheduledEmails()

    if (scheduledEmails.length === 0) {
      console.log("No emails to send at this time")
      return NextResponse.json({ message: "No emails to send" })
    }

    const results = []
    for (const emailData of scheduledEmails) {
      console.log(`Sending email to ${emailData.to}...`)

      try {
        // Send the email
        const sent = await sendFollowUpEmail(emailData)

        if (sent) {
          removeScheduledEmail(emailData.applicationId)
          results.push({
            id: emailData.applicationId,
            status: "sent",
            to: emailData.to,
          })
        } else {
          results.push({
            id: emailData.applicationId,
            status: "failed",
            to: emailData.to,
          })
        }
      } catch (error) {
        console.error(`Error sending email to ${emailData.to}:`, error)
        results.push({
          id: emailData.applicationId,
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


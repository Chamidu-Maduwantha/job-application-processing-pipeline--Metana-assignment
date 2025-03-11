import { Resend } from "resend"
import { getFirestore } from "firebase-admin/firestore"
import { initializeApp, getApps, cert } from "firebase-admin/app"

// Initialize Firebase Admin if it hasn't been initialized yet
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}")),
  })
}

const db = getFirestore()
const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailData {
  to: string
  name: string
  cvUrl: string
  applicationId: string
}

export async function scheduleFollowUpEmail(emailData: EmailData): Promise<boolean> {
  try {
    // Calculate the send time for tomorrow at 10:00 AM
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)

    // Store the email data in Firestore
    await db.collection("scheduledEmails").add({
      to: emailData.to,
      name: emailData.name,
      cvUrl: emailData.cvUrl,
      applicationId: emailData.applicationId,
      scheduledFor: tomorrow.toISOString(),
      sent: false,
      createdAt: new Date().toISOString(),
    })

    console.log("Follow-up email scheduled for tomorrow")
    return true
  } catch (error) {
    console.error("Error scheduling follow-up email:", error)
    return false
  }
}

export async function sendFollowUpEmail(emailData: EmailData): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: "Your Company <onboarding@resend.dev>",
      to: emailData.to,
      subject: "Your Job Application - CV Under Review",
      html: `
        <p>Dear ${emailData.name},</p>
        <p>Thank you for submitting your application. We wanted to let you know that your CV is currently under review by our team.</p>
        <p>We appreciate your interest in joining our company and will be in touch soon with updates on your application status.</p>
        <p>If you have any questions in the meantime, please don't hesitate to contact us.</p>
        <p>Best regards,<br>The Recruitment Team</p>
      `,
    })

    if (error) {
      console.error("Error sending email:", error)
      return false
    }

    console.log("Email sent successfully:", data)

    // Update the email status in Firestore
    const emailsRef = db.collection("scheduledEmails")
    const query = emailsRef.where("to", "==", emailData.to).where("sent", "==", false)
    const snapshot = await query.get()

    if (!snapshot.empty) {
      const doc = snapshot.docs[0]
      await doc.ref.update({ sent: true, sentAt: new Date().toISOString() })
    }

    return true
  } catch (error) {
    console.error("Error sending follow-up email:", error)
    return false
  }
}


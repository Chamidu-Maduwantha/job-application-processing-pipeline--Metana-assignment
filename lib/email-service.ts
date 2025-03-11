import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailData {
  to: string
  name: string
  cvUrl: string
  applicationId: string
}

// Simple in-memory storage for scheduled emails
let scheduledEmails: EmailData[] = []

export async function scheduleFollowUpEmail(emailData: EmailData): Promise<boolean> {
  try {
    // Store the email data in memory
    scheduledEmails.push(emailData)
    console.log("Follow-up email scheduled")
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
    return true
  } catch (error) {
    console.error("Error sending follow-up email:", error)
    return false
  }
}

// Function to get all scheduled emails
export function getScheduledEmails(): EmailData[] {
  return scheduledEmails
}

// Function to remove sent emails from the schedule
export function removeScheduledEmail(applicationId: string): void {
  scheduledEmails = scheduledEmails.filter((email) => email.applicationId !== applicationId)
}


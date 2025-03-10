import { Resend } from 'resend';


interface EmailData {
    to: string
    name: string
    cvUrl: string
    applicationId: string
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  
export async function scheduleFollowUpEmail(emailData: EmailData): Promise<boolean> {
    try {
      await storeEmailForScheduling(emailData)
      console.log("Follow-up email scheduled for tomorrow")
      return true
    } catch (error) {
      console.error("Error scheduling follow-up email:", error)
      return false
    }
  }
  
  async function storeEmailForScheduling(emailData: EmailData): Promise<void> {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
  
    const db = getFirestore()
    await db.collection("scheduledEmails").add({
      to: emailData.to,
      name: emailData.name,
      cvUrl: emailData.cvUrl,
      applicationId: emailData.applicationId,
      scheduledFor: tomorrow.toISOString(),
      sent: false,
      createdAt: new Date().toISOString(),
    })
  }

  export async function sendFollowUpEmail(emailData: EmailData): Promise<boolean> {
    try {
        const response = await resend.emails.send({
            from: 'chamidumaduwntha2001@gmail.com', 
            to: emailData.to,
            subject: 'Your Job Application - CV Under Review',
            html: `
                <p>Dear ${emailData.name},</p>
                <p>Thank you for submitting your application. We wanted to let you know that your CV is currently under review by our team.</p>
                <p>We appreciate your interest in joining our company and will be in touch soon with updates on your application status.</p>
                <p>If you have any questions in the meantime, please don't hesitate to contact us.</p>
                <p>Best regards,</p>
                <p><strong>The Recruitment Team</strong></p>
            `,
        });

        console.log('Email sent successfully:', response);
        return true;
    } catch (error) {
      console.error("Error sending follow-up email:", error)
      return false
    }
  }
  
  function getFirestore() {
    return {
      collection: (name: string) => ({
        add: async (data: any) => {
          console.log(`Adding to ${name} collection:`, data)
          return { id: "mock-id-" + Date.now() }
        },
      }),
    }
  }
  
  
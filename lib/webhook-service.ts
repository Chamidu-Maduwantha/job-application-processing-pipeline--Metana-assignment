import type { ExtractedCVData } from "./actions"

interface WebhookPayload {
  cv_data: {
    personal_info: {
      name?: string
      email?: string
      phone?: string
      address?: string
      linkedin?: string
      website?: string
    }
    education: string[]
    qualifications: string[]
    projects: string[]
    cv_public_link: string
  }
  metadata: {
    applicant_name: string
    email: string
    status: "testing" | "prod"
    cv_processed: boolean
    processed_timestamp: string
  }
}


export async function sendWebhookNotification(
  extractedData: ExtractedCVData,
  cvUrl: string,
  applicantName: string,
  applicantEmail: string,
  isProduction = false,
): Promise<boolean> {
  try {
    const webhookEndpoint = "https://rnd-assignment.automations-3d6.workers.dev/"

    const candidateEmail = "chamidumaduwntha@gmail.com" 

    const payload: WebhookPayload = {
      cv_data: {
        personal_info: extractedData.personalInfo,
        education: extractedData.education,
        qualifications: extractedData.qualifications,
        projects: extractedData.projects,
        cv_public_link: cvUrl,
      },
      metadata: {
        applicant_name: applicantName,
        email: applicantEmail,
        status: isProduction ? "prod" : "testing",
        cv_processed: true,
        processed_timestamp: new Date().toISOString(),
      },
    }

    console.log("Sending webhook notification to:", webhookEndpoint)

    // Send the webhook request
    const response = await fetch(webhookEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Candidate-Email": candidateEmail,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Webhook request failed with status: ${response.status}`)
    }

    console.log("Webhook notification sent successfully")
    return true
  } catch (error) {
    console.error("Error sending webhook notification:", error)
    return false
  }
}


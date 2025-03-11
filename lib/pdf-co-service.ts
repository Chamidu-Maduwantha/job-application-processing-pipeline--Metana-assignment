import type { ExtractedCVData } from "./actions"

export async function extractCVDataWithPdfCo(fileUrl: string, apiKey: string): Promise<ExtractedCVData> {
  console.log("Starting CV extraction with PDF.co")

  try {
    // Attempt PDF.co extraction
    const extractedText = await extractTextFromPdf(fileUrl, apiKey)
    return processExtractedText(extractedText)
  } catch (error) {
    console.error("Error with PDF.co extraction, falling back to simple text extraction:", error)

    // Fallback to simple text extraction
    const response = await fetch(fileUrl)
    const text = await response.text()
    return processExtractedText(text)
  }
}

async function extractTextFromPdf(fileUrl: string, apiKey: string): Promise<string> {
  console.log("Making request to PDF.co API")
  const endpoint = "https://api.pdf.co/v1/pdf/convert/to/text"
  const parameters = {
    url: fileUrl,
    inline: false,
    async: false,
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parameters),
    })

    console.log("PDF.co API response status:", response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("PDF.co API error:", errorData)
      throw new Error(`PDF.co API error: ${errorData.message || response.statusText}`)
    }

    const data = await response.json()
    console.log("PDF.co API response data:", data)

    if (data.error === false) {
      const resultFileUrl = data.url
      console.log("Downloading result from:", resultFileUrl)

      const textResponse = await fetch(resultFileUrl)
      if (!textResponse.ok) {
        throw new Error(`Failed to download result: ${textResponse.statusText}`)
      }

      const extractedText = await textResponse.text()
      console.log("Extracted text length:", extractedText.length)
      return extractedText
    } else {
      throw new Error(data.message)
    }
  } catch (error) {
    console.error("Error in extractTextFromPdf:", error)
    throw error
  }
}

function processExtractedText(text: string): ExtractedCVData {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  const result: ExtractedCVData = {
    education: [],
    qualifications: [],
    projects: [],
    personalInfo: {},
    rawText: text,
  }

  let currentSection = ""
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  const phoneRegex = /\b(\+\d{1,2}\s?)?\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b/
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/

  for (const line of lines) {
    const lowerLine = line.toLowerCase()

    // Check for section headers
    if (lowerLine.includes("education") || lowerLine.includes("academic")) {
      currentSection = "education"
      continue
    } else if (
      lowerLine.includes("skills") ||
      lowerLine.includes("qualifications") ||
      lowerLine.includes("expertise")
    ) {
      currentSection = "qualifications"
      continue
    } else if (
      lowerLine.includes("projects") ||
      lowerLine.includes("experience") ||
      lowerLine.includes("work history")
    ) {
      currentSection = "projects"
      continue
    } else if (lowerLine.includes("personal information") || lowerLine.includes("contact")) {
      currentSection = "personalInfo"
      continue
    }

    // Extract personal information
    const emailMatch = line.match(emailRegex)
    if (emailMatch && !result.personalInfo.email) {
      result.personalInfo.email = emailMatch[0]
    }

    const phoneMatch = line.match(phoneRegex)
    if (phoneMatch && !result.personalInfo.phone) {
      result.personalInfo.phone = phoneMatch[0]
    }

    const urlMatch = line.match(urlRegex)
    if (urlMatch) {
      if (urlMatch[0].toLowerCase().includes("linkedin.com")) {
        result.personalInfo.linkedin = urlMatch[0]
      } else {
        result.personalInfo.otherLinks = result.personalInfo.otherLinks || []
        result.personalInfo.otherLinks.push(urlMatch[0])
      }
    }

    // Attempt to extract name (this is a simple heuristic and might need improvement)
    if (!result.personalInfo.name && line.split(" ").length >= 2 && !emailMatch && !phoneMatch && !urlMatch) {
      result.personalInfo.name = line
    }

    // Add content to the appropriate section
    switch (currentSection) {
      case "education":
        result.education.push(line)
        break
      case "qualifications":
        result.qualifications.push(line)
        break
      case "projects":
        result.projects.push(line)
        break
    }
  }

  return result
}


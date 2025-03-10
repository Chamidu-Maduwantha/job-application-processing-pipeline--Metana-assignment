import type { ExtractedCVData } from "./actions"

export async function extractCVDataWithPdfCo(fileUrl: string, apiKey: string): Promise<ExtractedCVData> {
  try {
    console.log("Extracting CV data with PDF.co from URL:", fileUrl)

    const extractedText = await extractTextFromPdf(fileUrl, apiKey)

    return processExtractedText(extractedText)
  } catch (error) {
    console.error("Error extracting CV data with PDF.co:", error)
    return createEmptyExtractedData()
  }
}


async function extractTextFromPdf(fileUrl: string, apiKey: string): Promise<string> {
  // PDF.co API 
  const endpoint = "https://api.pdf.co/v1/pdf/convert/to/text"

  const parameters = {
    url: fileUrl,
    inline: false,
    async: false,
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(parameters),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`PDF.co API error: ${errorData.message || response.statusText}`)
  }

  const data = await response.json()

  if (data.error === false) {
    const resultFileUrl = data.url

    const textResponse = await fetch(resultFileUrl)
    if (!textResponse.ok) {
      throw new Error(`Failed to download result: ${textResponse.statusText}`)
    }

    return await textResponse.text()
  } else {
    throw new Error(data.message)
  }
}


function processExtractedText(text: string): ExtractedCVData {
  const extractedData: ExtractedCVData = {
    education: [],
    qualifications: [],
    projects: [],
    personalInfo: {},
    rawText: text,
  }

  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)

  let currentSection = ""

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const lowerLine = line.toLowerCase()

    if (
      lowerLine.includes("education") ||
      lowerLine.includes("academic") ||
      lowerLine.includes("degree") ||
      lowerLine.includes("university") ||
      lowerLine.includes("college") ||
      lowerLine.includes("school")
    ) {
      currentSection = "education"
      continue
    } else if (
      lowerLine.includes("skills") ||
      lowerLine.includes("qualifications") ||
      lowerLine.includes("certifications") ||
      lowerLine.includes("expertise") ||
      lowerLine.includes("technologies") ||
      lowerLine.includes("proficiencies")
    ) {
      currentSection = "qualifications"
      continue
    } else if (
      lowerLine.includes("projects") ||
      lowerLine.includes("experience") ||
      lowerLine.includes("work") ||
      lowerLine.includes("employment") ||
      lowerLine.includes("job") ||
      lowerLine.includes("career")
    ) {
      currentSection = "projects"
      continue
    } else if (
      lowerLine.includes("personal") ||
      lowerLine.includes("contact") ||
      lowerLine.includes("info") ||
      lowerLine.includes("about me") ||
      lowerLine.includes("profile")
    ) {
      currentSection = "personalInfo"
      continue
    }

    // Extract email addresses
    const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
    if (emailMatch && !extractedData.personalInfo.email) {
      extractedData.personalInfo.email = emailMatch[0]
    }

    // Extract phone numbers
    const phoneMatch = line.match(/(\+\d{1,3}[\s-]?)?\d{3}[\s-]?\d{3}[\s-]?\d{4}/)
    if (phoneMatch && !extractedData.personalInfo.phone) {
      extractedData.personalInfo.phone = phoneMatch[0]
    }

    // Extract LinkedIn URLs
    if (lowerLine.includes("linkedin.com") && !extractedData.personalInfo.linkedin) {
      extractedData.personalInfo.linkedin = line
    }

    // Extract other websites
    if (
      (lowerLine.includes("http://") || lowerLine.includes("https://")) &&
      !lowerLine.includes("linkedin") &&
      !extractedData.personalInfo.website
    ) {
      extractedData.personalInfo.website = line
    }

    if (currentSection === "education" && line.length > 5) {
      extractedData.education.push(line)
    } else if (currentSection === "qualifications" && line.length > 3) {
      extractedData.qualifications.push(line)
    } else if (currentSection === "projects" && line.length > 5) {
      extractedData.projects.push(line)
    }
  }

  return extractedData
}


function createEmptyExtractedData(): ExtractedCVData {
  return {
    education: [],
    qualifications: [],
    projects: [],
    personalInfo: {},
    rawText: "",
  }
}


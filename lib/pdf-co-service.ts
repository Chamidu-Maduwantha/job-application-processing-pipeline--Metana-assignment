import type { ExtractedCVData } from "./actions"

export async function extractCVDataWithPdfCo(fileUrl: string, apiKey: string): Promise<ExtractedCVData> {
  console.log("Starting CV extraction with PDF.co")
  console.log("File URL:", fileUrl)
  console.log("API Key (first 5 chars):", apiKey.substring(0, 5) + "...")

  try {
    // Step 1: Extract text from PDF using PDF.co Text Extraction API
    console.log("Extracting text from PDF...")
    const extractedText = await extractTextFromPdf(fileUrl, apiKey)
    console.log("Text extracted successfully. Length:", extractedText.length)

    // Step 2: Process the extracted text to identify CV sections
    console.log("Processing extracted text...")
    const result = processExtractedText(extractedText)
    console.log("Text processing complete. Sections found:", Object.keys(result))

    return result
  } catch (error) {
    console.error("Error in extractCVDataWithPdfCo:", error)
    throw error
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
  // Implement your text processing logic here
  // This is a simple example, you should enhance this based on your needs
  const lines = text.split("\n")
  const result: ExtractedCVData = {
    education: [],
    qualifications: [],
    projects: [],
    personalInfo: {},
    rawText: text,
  }

  let currentSection = ""
  for (const line of lines) {
    if (line.toLowerCase().includes("education")) {
      currentSection = "education"
    } else if (line.toLowerCase().includes("skills") || line.toLowerCase().includes("qualifications")) {
      currentSection = "qualifications"
    } else if (line.toLowerCase().includes("projects") || line.toLowerCase().includes("experience")) {
      currentSection = "projects"
    } else if (currentSection === "education") {
      result.education.push(line)
    } else if (currentSection === "qualifications") {
      result.qualifications.push(line)
    } else if (currentSection === "projects") {
      result.projects.push(line)
    }
  }

  return result
}


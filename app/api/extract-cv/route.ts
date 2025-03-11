import { type NextRequest, NextResponse } from "next/server"
import { uploadFileToGCS } from "@/lib/storage-service"
import { extractCVDataWithPdfCo } from "@/lib/pdf-co-service"

export async function POST(request: NextRequest) {
  try {
    console.log("CV extraction API called")

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("No file provided")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log(`Processing file: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)} KB)`)

    console.log("Uploading file to GCS...")
    const fileUrl = await uploadFileToGCS(file)
    console.log("File uploaded to GCS:", fileUrl)

    const pdfCoApiKey = process.env.PDF_CO_API_KEY

    if (!pdfCoApiKey) {
      console.error("PDF.co API key is not configured")
      return NextResponse.json({ error: "PDF.co API key is not configured" }, { status: 500 })
    }

    console.log("Extracting CV data with PDF.co...")
    const extractedData = await extractCVDataWithPdfCo(fileUrl, pdfCoApiKey)
    console.log("CV data extracted successfully")

    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string

    extractedData.personalInfo = {
      ...extractedData.personalInfo,
      name: extractedData.personalInfo.name || name,
      email: extractedData.personalInfo.email || email,
      phone: extractedData.personalInfo.phone || phone,
    }

    console.log("Extracted data:", extractedData)

    return NextResponse.json(extractedData)
  } catch (error) {
    console.error("Error in CV extraction API:", error)
    return NextResponse.json(
      {
        error: "Failed to extract CV data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}


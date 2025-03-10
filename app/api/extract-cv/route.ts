import { type NextRequest, NextResponse } from "next/server"
import { uploadFileToGCS } from "@/lib/storage-service"
import { extractCVDataWithPdfCo } from "@/lib/pdf-co-service"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log(`Processing file: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)} KB)`)

    // Upload the file to Google Cloud Storage 
    const fileUrl = await uploadFileToGCS(file)
    console.log("File uploaded to GCS:", fileUrl)

    const pdfCoApiKey = process.env.PDF_CO_API_KEY

    if (!pdfCoApiKey) {
      return NextResponse.json({ error: "PDF.co API key is not configured" }, { status: 500 })
    }

    // Extract data from the CV using PDF.co
    const extractedData = await extractCVDataWithPdfCo(fileUrl, pdfCoApiKey)

    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string

    if (name || email || phone) {
      extractedData.personalInfo = {
        ...extractedData.personalInfo,
        name: name || extractedData.personalInfo.name,
        email: email || extractedData.personalInfo.email,
        phone: phone || extractedData.personalInfo.phone,
      }
    }

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


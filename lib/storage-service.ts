"use server"

import { Storage } from "@google-cloud/storage"
import { v4 as uuidv4 } from "uuid"

// Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
})

const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || "your-bucket-name"
const bucket = storage.bucket(bucketName)

export async function uploadFileToGCS(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const fileExtension = file.name.split(".").pop()
    const uniqueFilename = `${uuidv4()}.${fileExtension}`

    const filePath = `cvs/${uniqueFilename}`

    const blob = bucket.file(filePath)
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.type,
      },
    })

    return new Promise((resolve, reject) => {
      blobStream.on("error", (error) => {
        console.error("Error uploading to GCS:", error)
        reject(new Error("Failed to upload file to Google Cloud Storage"))
      })

      blobStream.on("finish", async () => {
        await blob.makePublic()

        // Generate a public URL
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`
        resolve(publicUrl)
      })

      blobStream.end(buffer)
    })
  } catch (error) {
    console.error("Error in uploadFileToGCS:", error)
    throw new Error("Failed to upload file to Google Cloud Storage")
  }
}

export async function getFileFromGCS(fileUrl: string): Promise<Buffer> {
  try {
    const urlObj = new URL(fileUrl)
    const filePath = urlObj.pathname.substring(urlObj.pathname.indexOf("/", 1) + 1)

    const [fileContent] = await bucket.file(filePath).download()
    return fileContent
  } catch (error) {
    console.error("Error downloading file from GCS:", error)
    throw new Error("Failed to download file from Google Cloud Storage")
  }
}


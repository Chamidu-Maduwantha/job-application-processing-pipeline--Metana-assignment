"use server"

import { google } from "googleapis"
import { JWT } from "google-auth-library"

export type ExtractedCVData = {
  education: string[]
  qualifications: string[]
  projects: string[]
  personalInfo: {
    name?: string
    email?: string
    phone?: string
    address?: string
    linkedin?: string
    website?: string
  }
  rawText: string
}

function getGoogleSheetsClient() {
  const client = new JWT({
    email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })

  return google.sheets({ version: "v4", auth: client })
}

//structure for application data to be stored in Google Sheets
type ApplicationSheetData = {
  id: string
  name: string
  email: string
  phone: string
  cvUrl: string
  submittedAt: string
  education: string
  qualifications: string
  projects: string
  personalInfo: string
}

export async function saveToGoogleSheets(
  applicationData: {
    id: string
    name: string
    email: string
    phone: string
    cvUrl: string
    submittedAt: string
  },
  extractedData: ExtractedCVData,
): Promise<void> {
  try {
    const sheets = getGoogleSheetsClient()
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

    if (!spreadsheetId) {
      console.log("Google Sheets spreadsheet ID is not configured, skipping sheet update")
      return
    }

    const safeArray = (arr: any[] | undefined | null): string[] => {
      if (!arr || !Array.isArray(arr)) return ["No data available"]
      return arr.filter((item) => typeof item === "string" && item.trim() !== "")
    }

    const safePersonalInfo = (info: any): string => {
      if (!info || typeof info !== "object") return "{}"

      const cleanInfo: Record<string, string> = {}
      Object.entries(info).forEach(([key, value]) => {
        if (typeof value === "string" && value.trim() !== "") {
          cleanInfo[key] = value
        }
      })

      return JSON.stringify(cleanInfo)
    }

    const sheetData = {
      id: applicationData.id || "ID not available",
      name: applicationData.name || "Name not available",
      email: applicationData.email || "Email not available",
      phone: applicationData.phone || "Phone not available",
      cvUrl: applicationData.cvUrl || "CV URL not available",
      submittedAt: applicationData.submittedAt || new Date().toISOString(),
      education: safeArray(extractedData?.education).join("\n").substring(0, 5000) || "No education data",
      qualifications:
        safeArray(extractedData?.qualifications).join("\n").substring(0, 5000) || "No qualifications data",
      projects: safeArray(extractedData?.projects).join("\n").substring(0, 5000) || "No projects data",
      personalInfo: safePersonalInfo(extractedData?.personalInfo) || "{}",
    }

    console.log("Preparing to save data to Google Sheets")

    await ensureSheetExists(sheets, spreadsheetId)

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Applications!A:J", 
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [
            sheetData.id,
            sheetData.name,
            sheetData.email,
            sheetData.phone,
            sheetData.cvUrl,
            sheetData.submittedAt,
            sheetData.education,
            sheetData.qualifications,
            sheetData.projects,
            sheetData.personalInfo,
          ],
        ],
      },
    })

    console.log("Data successfully saved to Google Sheets")
  } catch (error) {
    console.error("Error saving to Google Sheets:", error)
    console.log("Continuing despite Google Sheets error")
  }
}

async function ensureSheetExists(sheets: any, spreadsheetId: string): Promise<void> {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    })

    const sheetExists = response.data.sheets.some((sheet: any) => sheet.properties.title === "Applications")

    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: "Applications",
                },
              },
            },
          ],
        },
      })

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Applications!A1:J1",
        valueInputOption: "RAW",
        requestBody: {
          values: [
            [
              "ID",
              "Name",
              "Email",
              "Phone",
              "CV URL",
              "Submitted At",
              "Education",
              "Qualifications",
              "Projects",
              "Personal Info",
            ],
          ],
        },
      })
    }
  } catch (error) {
    console.error("Error ensuring sheet exists:", error)
    throw new Error("Failed to set up Google Sheets")
  }
}


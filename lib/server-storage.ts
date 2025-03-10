"use server"

import fs from "fs"
import path from "path"

// Define a type for the application data
export type Application = {
  id: string
  name: string
  email: string
  phone: string
  cvUrl: string
  fileName: string
  fileType: string
  fileSize: number
  submittedAt: string
  status: string
}

const DATA_FILE_PATH = path.join(process.cwd(), "data", "applications.json")

const ensureDataDirectoryExists = () => {
  const dataDir = path.join(process.cwd(), "data")
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

export async function getServerApplications(): Promise<Application[]> {
  ensureDataDirectoryExists()

  if (!fs.existsSync(DATA_FILE_PATH)) {
    return []
  }

  const data = fs.readFileSync(DATA_FILE_PATH, "utf8")
  return JSON.parse(data || "[]")
}

export async function saveServerApplication(application: Application): Promise<void> {
  ensureDataDirectoryExists()

  const applications = await getServerApplications()
  applications.push(application)

  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(applications, null, 2))
}

export async function getServerApplicationById(id: string): Promise<Application | undefined> {
  const applications = await getServerApplications()
  return applications.find((app) => app.id === id)
}

export async function updateServerApplicationStatus(id: string, status: string): Promise<void> {
  const applications = await getServerApplications()
  const index = applications.findIndex((app) => app.id === id)

  if (index === -1) {
    throw new Error("Application not found")
  }

  applications[index] = { ...applications[index], status }
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(applications, null, 2))
}


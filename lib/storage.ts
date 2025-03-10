"use client"



export async function saveApplication(application: any) {
  const existingApplications = await getApplications()

  const updatedApplications = [...existingApplications, application]

  if (typeof window !== "undefined") {
    localStorage.setItem("applications", JSON.stringify(updatedApplications))
  }

  return application
}

export async function getApplications() {
  if (typeof window === "undefined") {
    return []
  }

  const applications = localStorage.getItem("applications")
  return applications ? JSON.parse(applications) : []
}

export async function getApplicationById(id: string) {
  const applications = await getApplications()
  return applications.find((app: any) => app.id === id)
}


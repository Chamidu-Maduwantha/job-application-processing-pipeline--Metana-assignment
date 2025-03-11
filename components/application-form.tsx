"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { submitApplication, type ExtractedCVData } from "@/lib/actions"
import { Loader2, CheckCircle2, Upload, User, Mail, Phone, ArrowRight, FileText, ExternalLink } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export default function ApplicationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState("")
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [submittedApplication, setSubmittedApplication] = useState<{ id: string; cvUrl: string } | null>(null)
  const [isProduction, setIsProduction] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })
  const [extractedData, setExtractedData] = useState<ExtractedCVData | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (extractedData) {
      setExtractedData({
        ...extractedData,
        personalInfo: {
          ...extractedData.personalInfo,
          [name]: value,
        },
      })
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    setFileError("")

    if (!selectedFile) {
      setFile(null)
      setExtractedData(null)
      return
    }

    // Check file type
    const fileType = selectedFile.type
    if (
      fileType !== "application/pdf" &&
      fileType !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
      !fileType.startsWith("text/")
    ) {
      setFileError("Please upload a PDF, DOCX, or text file")
      setFile(null)
      setExtractedData(null)
      return
    }

    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFileError("File size should be less than 5MB")
      setFile(null)
      setExtractedData(null)
      return
    }

    console.log(`File selected: ${selectedFile.name}, ${fileType}, ${(selectedFile.size / 1024).toFixed(2)} KB`)
    setFile(selectedFile)

    try {
      setIsExtracting(true)
      console.log("Preparing to extract data from CV")

      const apiFormData = new FormData()
      apiFormData.append("file", selectedFile)
      apiFormData.append("name", formData.name)
      apiFormData.append("email", formData.email)
      apiFormData.append("phone", formData.phone)

      console.log("Sending file to API endpoint for PDF.co extraction")

      const response = await fetch("/api/extract-cv", {
        method: "POST",
        body: apiFormData,
      })

      console.log("API response status:", response.status)

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`)
      }

      const data = await response.json()
      console.log("Extracted data received from PDF.co:", data)

      if (!data) {
        throw new Error("No data returned from API")
      }

      if (data.personalInfo) {
        data.personalInfo = {
          ...data.personalInfo,
          name: formData.name || data.personalInfo.name,
          email: formData.email || data.personalInfo.email,
          phone: formData.phone || data.personalInfo.phone,
        }
      }

      setExtractedData(data)
    } catch (error) {
      console.error("Error extracting data from CV:", error)

      setExtractedData({
        education: ["Education information will be extracted when your application is processed"],
        qualifications: ["Skills and qualifications will be extracted when your application is processed"],
        projects: ["Projects will be extracted when your application is processed"],
        personalInfo: {
          name: formData.name || "",
          email: formData.email || "",
          phone: formData.phone || "",
        },
        rawText: `File: ${selectedFile.name} (${selectedFile.type}, ${(selectedFile.size / 1024).toFixed(2)} KB)`,
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!file) {
      setFileError("Please upload your CV")
      return
    }

    setIsSubmitting(true)

    try {
      const formDataToSubmit = new FormData()
      formDataToSubmit.append("name", formData.name)
      formDataToSubmit.append("email", formData.email)
      formDataToSubmit.append("phone", formData.phone)
      formDataToSubmit.append("cv", file)
      formDataToSubmit.append("isProduction", isProduction.toString())

      if (extractedData) {
        formDataToSubmit.append("extractedData", JSON.stringify(extractedData))
      }

      const result = await submitApplication(formDataToSubmit)

      if (result.success) {
        setSubmittedApplication({
          id: result.id,
          cvUrl: result.cvUrl,
        })
        setIsSuccess(true)
      }
    } catch (error) {
      console.error("Error submitting application:", error)
      setFileError("Failed to submit application. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
    })
    setFile(null)
    setIsSuccess(false)
    setSubmittedApplication(null)
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full backdrop-blur-sm"
      >
        <Card className="w-full overflow-hidden border-none shadow-2xl bg-background/80 dark:bg-background/30">
          <CardContent className="p-0">
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-500/5 z-0" />

              <div className="relative z-10 flex flex-col items-center justify-center py-16 px-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 10,
                    delay: 0.2,
                  }}
                  className="relative"
                >
                  <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl animate-pulse" />
                  <div className="relative bg-green-500 rounded-full p-4">
                    <CheckCircle2 className="h-16 w-16 text-white" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center mt-8"
                >
                  <h3 className="text-3xl font-bold text-foreground mb-2">Application Submitted!</h3>
                  <p className="text-muted-foreground text-lg max-w-sm mx-auto">
                    Thank you for your interest in joining our team. We'll review your application and get back to you
                    soon.
                  </p>

                  {submittedApplication?.cvUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="mt-6 flex flex-col items-center"
                    >
                      <div className="flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Your CV is now stored in the cloud</p>
                      <a
                        href={submittedApplication.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-primary hover:text-primary/80 transition-colors"
                      >
                        <span className="mr-1">View your uploaded CV</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col sm:flex-row gap-4 mt-8 justify-center"
                  >
                    <Button variant="outline" size="lg" onClick={resetForm} className="group">
                      Submit Another Application
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full backdrop-blur-sm"
    >
      <Card className="w-full overflow-hidden border-none shadow-2xl bg-background/80 dark:bg-background/30">
        <CardHeader className="relative overflow-hidden p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 z-0" />
          <div className="relative z-10">
            <CardTitle className="text-2xl font-bold">Job Application</CardTitle>
            <CardDescription className="text-base mt-1">Your next career move starts here</CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className={cn(
                  "text-sm font-medium transition-colors",
                  focusedField === "name" ? "text-primary" : "text-foreground",
                )}
              >
                Full Name
              </Label>
              <div className="relative group">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 flex items-center pl-3 transition-colors",
                    focusedField === "name" ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <User className="h-4 w-4" />
                </div>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  required
                  placeholder="John Doe"
                  className="pl-10 h-12 transition-all bg-muted/40 border-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <AnimatePresence>
                  {focusedField === "name" && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "100%", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="absolute bottom-0 left-0 h-0.5 bg-primary"
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className={cn(
                  "text-sm font-medium transition-colors",
                  focusedField === "email" ? "text-primary" : "text-foreground",
                )}
              >
                Email
              </Label>
              <div className="relative group">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 flex items-center pl-3 transition-colors",
                    focusedField === "email" ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  required
                  placeholder="john.doe@example.com"
                  className="pl-10 h-12 transition-all bg-muted/40 border-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <AnimatePresence>
                  {focusedField === "email" && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "100%", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="absolute bottom-0 left-0 h-0.5 bg-primary"
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className={cn(
                  "text-sm font-medium transition-colors",
                  focusedField === "phone" ? "text-primary" : "text-foreground",
                )}
              >
                Phone Number
              </Label>
              <div className="relative group">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 flex items-center pl-3 transition-colors",
                    focusedField === "phone" ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Phone className="h-4 w-4" />
                </div>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => setFocusedField(null)}
                  required
                  placeholder="+1 (555) 123-4567"
                  className="pl-10 h-12 transition-all bg-muted/40 border-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <AnimatePresence>
                  {focusedField === "phone" && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "100%", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="absolute bottom-0 left-0 h-0.5 bg-primary"
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="cv"
                className={cn(
                  "text-sm font-medium transition-colors",
                  focusedField === "cv" ? "text-primary" : "text-foreground",
                )}
              >
                CV Upload (PDF or DOCX)
              </Label>
              <div
                className={cn(
                  "mt-1 relative group cursor-pointer rounded-xl transition-all duration-300",
                  "border-2 border-dashed border-muted-foreground/20 hover:border-primary/50",
                  focusedField === "cv" ? "border-primary/50 bg-primary/5" : "",
                  file ? "bg-green-500/5 border-green-500/20" : "",
                )}
                onClick={() => document.getElementById("cv")?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setFocusedField("cv")
                }}
                onDragLeave={() => setFocusedField(null)}
                onDrop={(e) => {
                  e.preventDefault()
                  setFocusedField(null)
                  const droppedFile = e.dataTransfer.files[0]
                  if (droppedFile) {
                    const input = document.getElementById("cv") as HTMLInputElement
                    if (input) {
                      const dataTransfer = new DataTransfer()
                      dataTransfer.items.add(droppedFile)
                      input.files = dataTransfer.files
                      const event = {
                        target: { files: dataTransfer.files },
                      } as unknown as React.ChangeEvent<HTMLInputElement>
                      handleFileChange(event)
                    }
                  }
                }}
              >
                <div className="space-y-2 text-center px-6 py-10">
                  <AnimatePresence mode="wait">
                    {file ? (
                      <motion.div
                        key="file-selected"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col items-center"
                      >
                        {isExtracting ? (
                          <>
                            <div className="bg-primary/10 p-3 rounded-full">
                              <Loader2 className="h-8 w-8 text-primary animate-spin" />
                            </div>
                            <p className="mt-2 text-sm font-medium text-foreground">Please wait while we process your CV....</p>
                          </>
                        ) : (
                          <>
                            <div className="bg-green-500/10 p-3 rounded-full">
                              <CheckCircle2 className="h-8 w-8 text-green-500" />
                            </div>
                            <p className="mt-2 text-sm font-medium text-foreground">{file.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            {extractedData && (
                              <p className="text-xs text-green-500 mt-1">"Your CV has been processed successfully</p>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="mt-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFile(null)
                                setExtractedData(null)
                                const input = document.getElementById("cv") as HTMLInputElement
                                if (input) input.value = ""
                              }}
                            >
                              Change File
                            </Button>
                          </>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="upload-prompt"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex flex-col items-center"
                      >
                        <div
                          className={cn(
                            "p-3 rounded-full transition-colors",
                            focusedField === "cv" ? "bg-primary/10" : "bg-muted",
                          )}
                        >
                          <Upload
                            className={cn(
                              "h-8 w-8 transition-colors",
                              focusedField === "cv" ? "text-primary" : "text-muted-foreground",
                            )}
                          />
                        </div>
                        <p className="mt-2 text-sm font-medium text-foreground">Drag and drop your CV here</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF or DOCX up to 5MB</p>
                        <Button type="button" variant="ghost" size="sm" className="mt-2 text-xs">
                          Browse Files
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Input
                    id="cv"
                    name="cv"
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    required
                    onChange={handleFileChange}
                    onFocus={() => setFocusedField("cv")}
                    onBlur={() => setFocusedField(null)}
                    className="sr-only"
                  />
                </div>
              </div>
              {fileError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-sm text-destructive mt-1 flex items-center"
                >
                  {fileError}
                </motion.p>
              )}
            </div>

            {/* Production/Testing Mode Toggle */}
            <div className="flex items-center justify-between space-x-2 pt-2">
              <Label htmlFor="production-mode" className="text-sm font-medium">
                Production Mode
              </Label>
              <div className="flex items-center space-x-2">
                <Switch id="production-mode" checked={isProduction} onCheckedChange={setIsProduction} />
                <span className="text-xs text-muted-foreground">{isProduction ? "Production" : "Testing"}</span>
              </div>
            </div>
            {!isProduction && (
              <p className="text-xs text-muted-foreground">
                Testing mode is for development purposes.
              </p>
            )}
          </CardContent>

          <CardFooter className="relative overflow-hidden p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 z-0" />
            <Button
              type="submit"
              className="w-full relative z-10 h-12 text-base font-medium transition-all group overflow-hidden"
              disabled={isSubmitting || !file || isExtracting}
            >
              <span className="relative z-10 flex items-center justify-center">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    Submit Application
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 dark:from-primary dark:to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  )
}


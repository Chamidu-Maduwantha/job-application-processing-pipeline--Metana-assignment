import { initializeApp } from "firebase/app"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { getFunctions, httpsCallable } from "firebase/functions"

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const storage = getStorage(app)
const db = getFirestore(app)
const functions = getFunctions(app)

export async function uploadCV(file: File, email: string): Promise<string> {
  try {
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const fileName = `${email.replace(/[^a-zA-Z0-9]/g, "_")}_${timestamp}.${fileExtension}`

    const storageRef = ref(storage, `cvs/${fileName}`)

    await uploadBytes(storageRef, file)

    const downloadURL = await getDownloadURL(storageRef)

    return downloadURL
  } catch (error) {
    console.error("Error uploading CV:", error)
    throw new Error("Failed to upload CV. Please try again.")
  }
}

export async function processApplication(data: {
  name: string
  email: string
  phone: string
  cvUrl: string
  fileName: string
  fileType: string
}) {
  try {
    const applicationRef = await addDoc(collection(db, "applications"), {
      ...data,
      status: "pending",
      createdAt: serverTimestamp(),
    })

    const processCV = httpsCallable(functions, "processCV")
    await processCV({
      applicationId: applicationRef.id,
      ...data,
    })

    return applicationRef.id
  } catch (error) {
    console.error("Error processing application:", error)
    throw new Error("Failed to process application. Please try again.")
  }
}


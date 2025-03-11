# CV Extraction Pipeline

This project implements an automated CV (resume) extraction pipeline using Next.js, PDF.co for text extraction, and various other services for data processing and storage.

## How It Works

1. **CV Upload**: Users submit their CV through a web form along with basic information (name, email, phone).

2. **File Storage**: The uploaded CV is stored in Google Cloud Storage, generating a public URL.

3. **Text Extraction**: The CV's text is extracted using PDF.co's API, which converts the PDF or DOCX file to plain text.

4. **Data Parsing**: The extracted text is processed to identify key sections (education, qualifications, projects) and personal information.

5. **Data Storage**: 
   - The parsed CV data is saved to Google Sheets for easy viewing and management.
   - The application details are also stored in Firestore for quick access and querying.

6. **Webhook Notification**: A webhook is triggered to notify an external system about the new application.

7. **Follow-up Email**: A follow-up email is scheduled to be sent to the applicant the next day.


## Data Flow

1. User submits CV through the application form
2. CV is uploaded to Google Cloud Storage
3. PDF.co extracts text from the CV
4. Extracted text is parsed and structured
5. Structured data is saved to Firestore and Google Sheets
6. Webhook notification is sent
7. Follow-up email is scheduled

## Features

- CV upload and data extraction
- Storage of CVs in Google Cloud Storage
- Extracted data saved to Google Sheets and Firestore
- Webhook notifications for processed applications
- Scheduled follow-up emails using Resend

## Prerequisites

- Node.js (v14 or later)
- PDF.co API key
- Google Cloud Storage account and credentials
- Google Sheets API credentials
- Resend API key for email sending

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/cv-extraction-pipeline.git
   cd cv-extraction-pipeline
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add the following variables:
   ```
   PDF_CO_API_KEY=your_pdf_co_api_key
   GOOGLE_CLOUD_STORAGE_BUCKET=your_gcs_bucket_name
   GOOGLE_SHEETS_ID=your_google_sheets_id
   RESEND_API_KEY=your_resend_api_key
   CRON_SECRET_KEY=your_cron_secret_key
   ```

4. Run the development server:
   ```
   npm run dev
   ```



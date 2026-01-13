# Mobile integration for Reading Fluency

This README describes a minimal integration for the Reading Fluency backend API and S3 uploads.

Prerequisites
- Backend API reachable (e.g. https://api.example.com)
- A recording upload flow that can PUT a blob to a presigned URL

Basic flow
1. Create a session (optional)
   - POST /sessions
   - Body: { userId: <number>, title: "Reading session 1" }
   - Returns: session object

2. Create a recording entry and get an upload URL
   - POST /sessions/:id/recordings
   - Body: { filename: "take1.mp3", contentType: "audio/mpeg" }
   - Returns: { recording, uploadUrl }

3. Upload audio to S3 using the provided uploadUrl
   - Use an HTTP PUT request from the mobile client
   - Example (curl):
     curl -X PUT "<uploadUrl>" -H "Content-Type: audio/mpeg" --data-binary @/path/to/take1.mp3

4. Worker processing
   - A backend worker will poll for unprocessed recordings, download them from S3 and
     run analysis. The processing step is currently a placeholder that generates a
     simulated score and stores it in the DB.

5. Fetch session details and scores
   - GET /sessions/:id
   - The returned session object includes recordings and any computed scores.

Notes
- All requests assume authentication/authorization is handled by your backend (not included in
  the minimal example routes). Add tokens/headers as required.
- The upload URL is time-limited and uses the server-side S3 credentials. Do not embed
  long-lived S3 secrets in the mobile app.
- For production, replace the placeholder processing with a proper speech-to-text / analysis
  pipeline (for example: AWS Transcribe, Google Speech-to-Text, or an on-premise model).

Environment variables used by the backend
- DATABASE_URL - Postgres connection string
- S3_BUCKET - S3 bucket name for recordings
- AWS_REGION - AWS region (optional)
- AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY - credentials for S3 access

This document is intentionally short — expand it with platform-specific examples (Android/iOS)
when integrating into your app.

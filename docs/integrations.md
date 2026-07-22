# ICSN Playgroup - External Integrations

This document defines the payload contracts and architecture for external systems connected to the ICSN Playgroup application.

## 1. Google Workspace Sync (Apps Script Webhooks)

The application relies heavily on Google Apps Script (GAS) Webhooks to push data into the school's Google Drive and Google Sheets. This architecture bypasses the limitations of Google Service Accounts (which have 0 bytes of storage quota). See ADR-001 for details.

### 1.1 Google Sheets Smart Merge (`sheets-webhook.js`)
Triggered via Supabase Database Triggers & Edge Functions (`sync-sheets-snapshot`).
- **Endpoint:** `process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_SHEETS`
- **Method:** `POST`
- **Payload Structure:**
  ```json
  {
    "action": "snapshot_sync",
    "bookingData": [ { "id": "uuid", "values": ["..."] } ],
    "parentsData": [ { "id": "uuid", "values": ["..."] } ],
    "balanceData": [ { "id": "uuid", "values": ["..."] } ],
    "usageData": [ { "id": "uuid", "values": ["..."] } ]
  }
  ```
- **Logic:** The GAS script maps incoming data to sheets by matching the UUID in Column Z. It preserves manual notes written by admins in Columns AA onwards.

### 1.2 Google Sheets Append (`sheets-webhook.js`)
Triggered when a new parent registers or a new package is purchased.
- **Endpoint:** `process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_SHEETS`
- **Method:** `POST`
- **Payload Structure:**
  ```json
  {
    "action": "append_row",
    "rowData": ["Timestamp", "Email", "Type", "..."]
  }
  ```

### 1.3 Google Drive File Sync (`drive-webhook.js`)
Triggered via Edge Functions (`sync-files-to-drive`) when slips or profile photos are uploaded.
- **Endpoint:** `process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_DRIVE`
- **Method:** `POST`
- **Payload Structure:**
  ```json
  {
    "action": "sync_file",
    "parentPhone": "0812345678",
    "parentFolderName": "แม่บี (น้องซี)",
    "childFolderName": "น้องซี",
    "fileName": "slip_uuid.jpg",
    "mimeType": "image/jpeg",
    "base64Data": "base64encodedstring...",
    "fileType": "slip"
  }
  ```
- **Response Handling:** The Edge Function receives `{ "fileUrl": "...", "folderUrl": "..." }` and updates the `parents.google_drive_url` column with the `folderUrl`.

## 2. Google Chat Notifications
Used to notify admins about important events (e.g., slip approvals, auto-approvals, class cancellations, manual credit adjustments).
- **Service:** Google Chat Webhooks via Supabase Edge Functions (`google-chat-notify`, `admin-actions`, `auto-approve-slip`).
- **Secrets Required:** `GOOGLE_CHAT_WEBHOOK_URL`

## 3. Email Notifications (Resend)
Used for critical system emails, specifically sending "Reset your password" links to parents.
- **Service:** Resend API (Configured as Custom SMTP in the Supabase Dashboard, not directly in the Next.js codebase).
- **Secrets Required:** Configured in Supabase Production Dashboard (Auth > SMTP).
- **Dashboard Configuration (CRITICAL):** The **Site URL** and **Redirect URLs** in the Supabase Dashboard (Auth -> URL Configuration) MUST be set to the correct production domain (e.g. `https://playgroup.icsn.ac.th`). If left as default (`http://localhost:3000`), the password reset link inside the email will point to localhost, preventing users from resetting their passwords.

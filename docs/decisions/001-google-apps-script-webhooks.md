# ADR-001: Use Google Apps Script (GAS) Webhooks for Google Workspace Sync

## Status
Accepted

## Date
2026-07-21

## Context
The ICSN Playgroup class booking system requires syncing data to Google Workspace:
1. **Google Drive:** Uploading parent profile photos, child profile photos, and bank payment slips.
2. **Google Sheets:** Synchronizing booking histories, parent databases, and credit usages in real-time for administration.

We needed a way to authenticate and push data from Supabase Edge Functions to Google services on behalf of the school administrator's Google account.

## Decision
We use Google Apps Script (GAS) `doPost(e)` webhooks deployed as a Web App (Execute as: "Me", Who has access: "Anyone") to act as a bridge between Supabase and Google Drive/Sheets.

## Alternatives Considered

### Google Service Accounts (Google APIs Node.js Client)
- **Pros:** Official standard for server-to-server communication. Highly secure.
- **Cons:** Service accounts do not have their own Drive storage quota (0 bytes). When a service account uploads a file to a shared folder, it owns the file and consumes its own quota, leading to immediate "Storage Quota Exceeded" errors. Setting up Domain-Wide Delegation is too complex for a standard Gmail account.
- **Rejected:** Due to the 0-byte storage limit on service accounts making file uploads fail.

### OAuth 2.0 User Consent Flow
- **Pros:** Uploads files directly as the admin user.
- **Cons:** Requires the admin to log in and grant OAuth permissions. Access tokens expire and require refresh token management, adding significant complexity to Supabase Edge Functions.
- **Rejected:** Overly complex and fragile for a single-admin use case.

## Consequences
- **Zero Configuration Auth:** By deploying GAS as "Execute as Me", all operations run with the full permissions and storage quota of the admin's Google account without needing OAuth tokens in Supabase.
- **Simple HTTP POST:** Supabase Edge Functions only need to make a standard `fetch()` POST request to the Webhook URL.
- **Maintenance (Trade-off):** Any changes to the Drive/Sheets sync logic require manually updating the code in the Google Apps Script editor and explicitly creating a **New Deployment**. It cannot be automated via Next.js CI/CD.
- **Base64 Overhead:** Files must be converted to Base64 strings in Edge Functions and decoded back into Blobs in GAS, which slightly increases payload sizes but is perfectly acceptable for small images like payment slips.

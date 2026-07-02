# Handoff Document: ICSN Playgroup Class Booking

## Project Overview
This is a Next.js (App Router) + Supabase full-stack application built for a playgroup class booking system (Clean Architecture/Hexagonal).

## Current Status & Recent Work
1. **Production Audit Completed**: The previous agent successfully audited the Booking Rules. Hardcoded cutoff times (`07:00`) in the frontend (`UpcomingBookings.tsx`, `BookingSummary.tsx`, `SettingsTab.tsx`) have been refactored to pull the `cutoff_hour` dynamically from the `SystemSettings` context.
2. **Knowledge Base Updated**: Important architectural and workflow rules have been codified into `.agents/AGENTS.md`. This includes rules for:
   - Dynamic Booking Rules
   - Vercel Environment Variables & Redeployment
   - Cross-Machine Environment Syncing (handling of `.env.local`)

## Next Focus & Pending Issues
Based on the user's recent unprocessed queries, the **next immediate priority** should be investigating a file upload / integration issue:
- **User's reported issue**: *"ฉันลองเทสสมัครสมาชิกและ topup และเซ็นชื่อแล้เวใน drive ไม่มีรูปอะไรเลยเป็นเพราะอะรไ"* (The user tested registration, top-up, and signing, but reported that no images/files appeared in Google Drive).
- **Next steps**: 
  1. Investigate the registration/top-up signature upload flow.
  2. Check if the files are being routed to Supabase Storage or an Edge Function that talks to Google Drive.
  3. Verify API keys, permissions, or logic gaps in the upload pipeline.

## Suggested Skills to Invoke
- `supabase`: Essential for debugging any Storage, Edge Function, or Database issues related to the file uploads.
- `production-code-audit`: If you need to trace the end-to-end data flow of the upload system.

## Important References
- **Rules & Constraints**: Please thoroughly read `d:\icsn-playgroup-class-booking\.agents\AGENTS.md` before writing any code. It contains critical instructions about database migrations, clean architecture, and deployment workflows.
- **Environment**: All secrets are stored in `.env.local` (not committed to Git). Do not overwrite or ask to commit this file.

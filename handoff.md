# ICSN Playgroup — Handoff Document

## Current Status & Achievements

**1. Historical Data Backfill (Completed)**
- We successfully completed the historical data backfill from Supabase to Google Sheets.
- **Problem Resolved:** The previous backfill architecture (NodeJS script -> Supabase Edge Function -> GAS Webhook) was failing, causing missing data, dropped rows due to timeouts, and missing Drive links.
- **Solution Deployed:** We abandoned the Edge Function backfill approach and built a direct Google Apps Script (`google-apps-scripts/backfill-sheets.gs`). This GAS script runs inside the Google Sheet, connects directly to the Supabase REST API, and uses Google Drive API (DriveApp) to resolve missing image URLs from the parent's `google_drive_url` folder dynamically.
- **Form Responses 1 Integration:** We upgraded `backfill-sheets.gs` into an Incremental Sync script and removed the old `append-to-sheets` webhook call from the Next.js frontend (`TopUpModal.tsx` and `apply/page.tsx`) to improve frontend performance. The Form tab is now pulled incrementally via GAS Custom Menu (and can be scheduled via Time-Driven Trigger).

**2. Real-Time Smart Merge Sync for Internal Tabs (Completed)**
- **Problem Resolved:** The old Snapshot Sync cleared the entire sheet and rewrote it, which deleted any manual Notes admins added to the rows. It also caused sluggishness.
- **Solution Deployed:** We upgraded the architecture to **Real-Time Smart Merge**.
  - We modified the Edge Function `sync-sheets-snapshot/index.ts` to output data in a `{ id, values }` format, assigning a unique ID to every row.
  - We created a new GAS Webhook script (`google-apps-scripts/sheets-webhook-smart.js`). This script reads the existing sheet into memory, maps rows by ID (stored in Column Z / Index 25), updates the system columns, and strictly preserves the manual Note columns before rewriting the sheet in a single fast operation.
  - We retained the `pg_net` Database Triggers to keep the sync 100% real-time (Approach 1).

**3. Schema Discoveries (Persisted as Rules)**
- `children` uses `dob`, not `date_of_birth`.
- `slip_uploads.package_id` stores a STRING (e.g. "1 Course (5 Sessions)"), NOT a UUID. Joins must happen via `parent_id`.
- `packages.non_refundable` is always false; actual consent is on `slip_uploads.non_refundable`.
- The `parents` table only contains records from the new web system. Old Google Form records were never migrated here, so date filters are unnecessary.
- These discoveries are persisted in `c:\icsn-playgroup-class-booking\.agents\AGENTS.md` via the `/learn` command.

## Next Steps for the Next Agent
- Proceed with whatever the user requests next. The Sheets Sync and Backfill tasks are complete.

## Suggested Skills
- `supabase`: If making further database modifications.
- `using-agent-skills`: For any further architecture discussion.

## References
- Column Mapping & Schema Spec: [column_mapping.md](file:///C:/Users/thirawut.k/.gemini/antigravity-ide/brain/5be0e5ff-5fa5-41d9-99ea-253fd9c03750/column_mapping.md)
- Global Rules: `c:\icsn-playgroup-class-booking\.agents\AGENTS.md` (Check "Supabase PostgREST Accuracy" and "Google Sheets Sync Architecture")

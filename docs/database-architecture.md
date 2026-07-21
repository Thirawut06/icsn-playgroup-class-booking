# ICSN Playgroup - Database Architecture & Conventions

This document outlines the architecture and conventions for the Supabase database used in the ICSN Playgroup project.

## 1. Environments & Workflow
- **Local First:** All database schema changes MUST be made via Supabase migration files in `supabase/migrations`. 
- **No Manual UI Changes:** NEVER create or edit tables manually via the Supabase Dashboard UI on Production.
- **Project References:**
  - Production: `psusuyesaxuhiondxqie`
  - Staging: `ykyifdoufyadgtemkhdd`
- **Docker Requirement:** Supabase CLI commands like `db pull` and `db push` require Docker Desktop on Windows.

## 2. Table Nuances & Data Dictionary

### `parents` Table
- **Historical Data Warning:** This table only contains records from the new Next.js web system. Old Google Form records were never migrated here. Do not apply `created_at` filters assuming old 2023/2024 form data exists in the database.

### `children` Table
- **Date of Birth Column:** The date of birth column is exactly `dob`. NEVER use `date_of_birth` in queries or TypeScript types.

### `slip_uploads` Table
- **Relationship Quirk:** The `package_id` column in `slip_uploads` stores the package type STRING (e.g. "1 Course (5 Sessions)"), NOT a UUID. To join slips with packages, you MUST join via `parent_id` and match the type or rely on temporal proximity (time of creation).
- **Non-Refundable Status:** The true user consent for the non-refundable policy is captured here as a boolean. The `non_refundable` column on the `packages` table is always false.

### `packages` Table
- **Credits Source of Truth:** `credits_remaining` is the definitive source of truth for a parent's credit balance. See ADR-002 for full details.

## 3. Security & Row Level Security (RLS)
- **Role Verification:** Always use `await supabase.auth.getUser()` when verifying authentication for route protection, RBAC, or sensitive actions. NEVER rely on `supabase.auth.getSession()` for authorization as it only reads local storage and can be spoofed.
- **Explicit Selects:** NEVER use wildcard selects (`select('*')`) in production code. Always explicitly specify the required columns (e.g., `select('id, name, children(id, nickname)')`) to prevent over-fetching and accidental data exposure.
- **Manual Role Assignment (Admin):** If assigning admin rights manually via SQL, wrap strings in single quotes and cast to jsonb:
  ```sql
  UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb WHERE email = 'admin@example.com';
  ```

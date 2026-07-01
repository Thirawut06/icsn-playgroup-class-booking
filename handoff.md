# Handoff Document - ICSN Playgroup Class Booking

This document summarizes the current progress, completed tasks, and context for the next agent session.

## Current Status & Completed Work

### 1. Fixes & Updates
- **Admin Access Issue**: Resolved a bug where logged-in admins couldn't access `/admin` because `src/middleware.ts` was redirecting non-admin user objects to the homepage. Client-side role checking via `AdminLoginGate` and database RLS now securely handle the protection.
- **Trial Registration RLS**: Fixed an RLS violation (`new row violates row-level security policy for table "packages"`) when parents register for a Trial package. A migration `supabase/migrations/20260630060000_fix_trial_packages_rls.sql` was created and successfully pushed to allow authenticated users to insert their own trial package (capped to 1).
- **Admin UI Cleanup (Box-in-Box)**: Removed the duplicate white background wrapper in `src/components/admin/views/AdminSettings.tsx` to align with the Clean UI/UX specs. Subtabs (System Settings, Calendar, Packages) now sit neatly on the gray background.
- **Payment Form Borders**: Fixed solid black borders on the package radio options in `src/components/apply/PaymentSection.tsx` by replacing `border` with `border-border`.
- **Admin User Details Crash**: Fixed a `400 Bad Request` database error when opening the User Detail Drawer in the Admin panel. The query in `src/lib/services/admin-user.service.ts` was requesting the column `reason` on `credit_transactions`, which doesn't exist. It has been corrected to query the actual column `notes`.

### 2. Deployment Architecture Advice
- Advised the user to use a **Subdomain (CNAME) pointing to Vercel** (e.g., `booking.icsn.ac.th`) to integrate the app with their existing school website hosted on Hosting Lotus, avoiding complex subpath reverse-proxying.

### 3. Configured Project Rules & Skills
- Updated `.agents/AGENTS.md` to persist learnings (Middleware protection, Tailwind borders, Box-in-Box UI prevention, PostgREST column matching, Shared hosting integrations).
- Installed the **`handoff`** and **`scrutinize`** skills into `.agents/skills/`.

---

## Suggested Skills for the Next Session
1. **`scrutinize`**: Use `/scrutinize` to audit any new feature plans, pull requests, or major refactoring tasks.
2. **`production-code-audit`**: Scan components to ensure the Box-in-Box anti-pattern or plain `border` classes are not used elsewhere.
3. **`supabase`**: Use for database migrations or additional RLS policy testing.

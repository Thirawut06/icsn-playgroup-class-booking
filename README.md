# ICSN Panda Playgroup - Class Booking System

A modern, highly-available class booking and management system built for the ICSN Panda Playgroup. Designed for preschool operations, the platform handles end-to-end parent registration, package purchasing, daily class bookings, slip verification, and school administration.

## 🌟 Key Features
- **Parent Portal:** Register children, purchase session packages (e.g., 5-passes, 10-passes, free trials), and book daily slots securely.
- **Admin Dashboard:** Full CRM capabilities, daily roster generation, manual adjustments, and payment slip verification.
- **Smart Queueing:** FIFO auto-deselect logic prevents overbooking when capacities are maxed out, providing a fluid user experience.
- **Automated Google Sync:** Zero-overhead integration with Google Workspace. Uploads files to Google Drive and synchronizes data to Google Sheets in real-time via custom Google Apps Script Webhooks.
- **Automated Notifications:** Instant admin notifications via Google Chat Webhooks, and reliable system emails (e.g., password resets) via Resend.

## 🛠️ Tech Stack
- **Framework:** Next.js 15+ (App Router), React 19
- **Styling:** Tailwind CSS v4, shadcn/ui
- **Database & Auth:** Supabase (PostgreSQL, Edge Functions, Row-Level Security, Storage)
- **Integrations:** Google Apps Script (Drive/Sheets), Google Chat, Resend

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js (v18+)
- Docker Desktop (Required for Supabase CLI local database interactions)
- Supabase CLI installed globally (`npm i -g supabase`)

### 2. Environment Variables
To ensure data safety, the project strictly uses a **Staging vs Production** environment model.
Copy the environment template:
```bash
cp .env.example .env.local
```
> ⚠️ **CRITICAL RULE:** Never connect your `.env.local` to the Production database. Always point `.env.local` to your Staging environment to prevent polluting real parent data during development.

### 3. Start the Application
Install dependencies and run the local development server:
```bash
npm install
npm run dev
```
Access the application at [http://localhost:3000](http://localhost:3000).

---

## 🚢 Deployment & CI/CD Workflow

The application is deployed securely, ensuring zero downtime and database integrity.

### 1. Database & Storage Migrations
If you added new tables, columns, or Storage Buckets, you must push schema changes to Production.
```bash
# 1. Link your Supabase CLI to the Production Project
npx supabase link --project-ref <PRODUCTION_PROJECT_REF>

# 2. Push the migrations to Production
npx supabase db push

# 3. IMPORTANT: Link back to Staging immediately to keep local dev safe!
npx supabase link --project-ref <STAGING_PROJECT_REF>
```

### 2. Edge Functions Deployment
If you modified API logic in `supabase/functions/` (e.g., webhooks, email triggers):
```bash
npx supabase functions deploy --project-ref <PRODUCTION_PROJECT_REF>
```

### 3. Frontend Deployment (Vercel)
The Next.js frontend is deployed via Vercel. Pushing to the `main` branch triggers an automatic production build.
```bash
git add .
git commit -m "feat: your new feature"
git push origin main
```

### 4. Supabase Auth (Site URL Configuration)
When deploying to Production, you MUST configure the **Site URL** and **Redirect URLs** manually in the Supabase Dashboard (`Authentication -> URL Configuration`). 
- **Site URL:** `https://playgroup.icsn.ac.th`
- **Redirect URLs:** `https://playgroup.icsn.ac.th/*`
*If you fail to do this, password reset emails sent by Resend will contain `http://localhost:3000` links, causing them to fail in production.*

---

## 🔄 Syncing Environments (Database Baseline)
If the Production database was modified manually and Staging is out of sync, pull a baseline from Production to Staging:
```bash
npx supabase link --project-ref <PRODUCTION_PROJECT_REF>
npx supabase db pull
npx supabase link --project-ref <STAGING_PROJECT_REF>
npx supabase db push
```

---

## 📚 Documentation & Architecture

For a deep dive into the system's architecture, business rules, and design decisions, please refer to the `docs/` directory:

1. **[Business Domain Rules](docs/domain-rules.md):** Core business logic, booking cut-offs, FIFO auto-queue, and trial package limitations.
2. **[Database Architecture](docs/database-architecture.md):** Information about table relationships, data dictionary, and the strict source of truth for credits.
3. **[External Integrations](docs/integrations.md):** How the system pushes payloads to Google Workspace (Sheets/Drive) and handles notifications (Google Chat & Resend).
4. **Architecture Decision Records (ADRs):**
   - [ADR-001: Google Apps Script Webhooks](docs/decisions/001-google-apps-script-webhooks.md)
   - [ADR-002: Credits Source of Truth](docs/decisions/002-credits-source-of-truth.md)

---
*Developed securely for ICSN Panda Playgroup.*

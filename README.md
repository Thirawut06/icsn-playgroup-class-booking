# ICSN Panda Playgroup - Class Booking System

This is the booking and management system for ICSN Panda Playgroup. It is built with Next.js (App Router), Tailwind CSS, and Supabase.

## 🚀 Environments

The project strictly follows a **Staging vs Production** environment model to ensure data safety.

- **Production Database Ref:** `psusuyesaxuhiondxqie` (Used by Vercel for the live site)
- **Staging Database Ref:** `ykyifdoufyadgtemkhdd` (Used for Local Development & Testing)

> ⚠️ **CRITICAL RULE:** Never connect your `.env.local` to the Production database. Always point `.env.local` to Staging (`ykyifdoufyadgtemkhdd`) to prevent polluting real parent data during development.

---

## 💻 Local Development (Staging)

1. Ensure your `.env.local` is set up with **Staging Keys**.
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🚢 Deployment Workflow (Going Live to Production)

When you have thoroughly tested your changes locally and on the Staging environment, follow these 3 steps to deploy to Production:

### 1. Database & Storage Migrations
If you added new tables, columns, or Storage Buckets, you must push these schema changes to the Production database.
```bash
# 1. Link your Supabase CLI to the Production Project
npx supabase link --project-ref psusuyesaxuhiondxqie

# 2. Push the migrations to Production
npx supabase db push

# 3. IMPORTANT: Link back to Staging immediately to keep local dev safe!
npx supabase link --project-ref ykyifdoufyadgtemkhdd
```

### 2. Edge Functions (API)
If you modified any code inside `supabase/functions/` (e.g., Google Drive Webhooks, email notifications), you must deploy the functions to Production.
```bash
# Deploy all edge functions to Production
npx supabase functions deploy --project-ref psusuyesaxuhiondxqie
```

### 3. Frontend Application
The Next.js frontend is deployed via Vercel and is linked to the `main` branch of the GitHub repository.
1. Commit your code changes.
2. Push your code to the `main` branch on GitHub:
   ```bash
   git add .
   git commit -m "Your descriptive commit message"
   git push origin main
   ```
3. **Vercel** will automatically detect the push and deploy the new version of the website.

---

## 🔄 Syncing Staging from Production (Creating a Baseline)

If the Production database was modified manually and Staging is out of sync, you must pull a baseline from Production and push it to Staging:
```bash
npx supabase link --project-ref psusuyesaxuhiondxqie
npx supabase db pull
npx supabase link --project-ref ykyifdoufyadgtemkhdd
npx supabase db push
```

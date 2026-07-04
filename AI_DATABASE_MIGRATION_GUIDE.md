# AI Guide: Supabase Database Migration & Staging Workflow

This guide instructs the AI agent on how to manage database migrations, environment keys, and deployment safety for the **ICSN Playgroup Class Booking** project.

---

## 🔑 Project Environment Details
*   **Production Project Ref:** `psusuyesaxuhiondxqie`
*   **Staging Project Ref:** `ykyifdoufyadgtemkhdd`

---

## 🛠️ Step-by-Step database Modification Workflow

When the user asks to modify the database schema (e.g., adding tables, columns, policies, or RPC functions), the AI must strictly follow this workflow. **NEVER modify the schema manually on the Supabase Dashboard.**

### Step 1: Create a New Migration File Locally
Always generate a new migration file using the CLI:
```bash
npx supabase migration new <descriptive_name>
```
*This will create a new SQL file under `supabase/migrations/`.*

### Step 2: Write the SQL Changes
Write the SQL schema modifications inside the newly created migration file.

### Step 3: Push and Test on Staging
1.  **Link to Staging:**
    ```bash
    npx supabase link --project-ref ykyifdoufyadgtemkhdd
    ```
2.  **Push the Migrations:**
    ```bash
    npx supabase db push
    ```
3.  Instruct the user to test the changes locally (which connects to the Staging DB).

### Step 4: Deploy to Production
Only after Staging is verified and approved by the user, apply the migration to Production:
1.  **Link to Production:**
    ```bash
    npx supabase link --project-ref psusuyesaxuhiondxqie
    ```
2.  **Push the Migrations:**
    ```bash
    npx supabase db push
    ```

### Step 5: CRITICAL SAFETY STEP (Always Link Back to Staging)
To prevent accidental database operations on the Production database in future terminal runs, **always link back to Staging when finished**:
```bash
npx supabase link --project-ref ykyifdoufyadgtemkhdd
```

---

## 🚀 Deploying Supabase Edge Functions

If any files in `supabase/functions/` are modified, the AI must deploy them:

1.  **Deploy to Staging:**
    ```bash
    npx supabase functions deploy --project-ref ykyifdoufyadgtemkhdd
    ```
2.  **Deploy to Production:**
    ```bash
    npx supabase functions deploy --project-ref psusuyesaxuhiondxqie
    ```

---

## 🔐 Environment Variables (.env.local vs Vercel)

*   **Local machine:** The `.env.local` must point to the **Staging** URL and keys.
*   **Vercel Production:** The environment variables in Vercel settings must point to the **Production** URL and keys.
*   If environment variables are added or changed, they must be set in Vercel, and the user must be instructed to trigger a **Redeploy** on Vercel.

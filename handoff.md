# Handoff Document — ICSN Playgroup Class Booking
**Date:** 2026-07-10  
**Session:** Debugging, DB Migrations, Google Sheets Sync fix, Production Audit  
**Branch in progress:** `fix/audit-fixes-20260710` (NOT yet merged to main)  
**Supabase linked to:** Staging (`ykyifdoufyadgtemkhdd`) — always reset after prod tasks

---

## 🔴 Pending Action (User Must Do)

ยังไม่เสร็จ 1 อย่าง: ไปที่ **Supabase Dashboard → SQL Editor → Production** แล้วรัน SQL นี้เพื่อ verify ว่า `invoke_sync_sheets()` ใช้ `app_secrets` แทน `current_setting` แล้ว:

```sql
SELECT prosrc FROM pg_proc WHERE proname = 'invoke_sync_sheets';
```

ถ้า body ยังมี `current_setting` อยู่ ต้องรัน SQL ที่อยู่ใน migration:  
`supabase/migrations/20260710095640_fix_dynamic_webhook_url.sql`

---

## ✅ What Was Accomplished This Session

### 1. Debugging (Earlier)
- แก้ error: ลดเครดิตติดลบ → migration `20260710085441_support_negative_credit_adjustments.sql`
- แก้ error: บันทึก `admin_notes` ไม่ได้ → migration `20260710090056_allow_admin_notes_in_edit_user.sql`
- แก้ error: `trial_capacity` column ไม่มีบน Prod → `20260710080954_add_trial_capacity.sql`

### 2. Google Sheets Sync (Core Problem)
**สาเหตุ:** Vercel (Production) ชี้ไปที่ Staging database → ข้อมูลใน Sheets เลยเป็น Staging

**การแก้:**
- อัปเดต Vercel Environment Variables ให้ชี้ Prod (user ทำเอง ✅)
- สร้าง GAS Script ใหม่ (Snapshot Sync) แทนของเก่า (Append) ✅
- อัปเดต `GOOGLE_APPS_SCRIPT_WEBHOOK_SHEETS` Secret บน Prod ✅
- แก้ `invoke_sync_sheets()` ให้ไม่ hardcode URL → ใช้ `app_secrets` table แทน ✅
- Insert `edge_function_base_url` และ `webhook_secret` ใน `app_secrets` บน Prod ✅

### 3. Navigation & UI Labels
- `src/config/navigation.ts` → เปลี่ยน label เป็น English ทั้งหมด
- `src/components/admin/user-detail/PackagesCreditsSection.tsx` → ปรับ label ปรับปรุงเครดิต

### 4. Production Code Audit Fixes (branch: `fix/audit-fixes-20260710`)
| Fix | File |
|-----|------|
| 🔴 `bk` undefined in cancel-booking | `supabase/functions/admin-actions/index.ts` |
| 🟠 Wildcard `select('*')` → explicit columns | `supabase/functions/sync-sheets-snapshot/index.ts` |
| 🟠 Hardcoded prod URL → `app_secrets` lookup | `supabase/migrations/20260710095640_fix_dynamic_webhook_url.sql` |
| 🟠 Insecure fallback secret → abort if missing | same migration |
| 🟡 GAS response error not checked | `sync-sheets-snapshot/index.ts` |
| 🟡 Timezone-unsafe date parsing → UTC methods | `sync-sheets-snapshot/index.ts` |

**Deployed to Prod & Staging:**
- `admin-actions` ✅
- `sync-sheets-snapshot` ✅
- All 6 migrations applied to both Prod & Staging ✅

---

## 🗂️ Key Architecture Facts

### Supabase Projects
| Environment | Ref | When to use |
|-------------|-----|-------------|
| Production | `psusuyesaxuhiondxqie` | Live site at `playgroup.icsn.ac.th` |
| Staging | `ykyifdoufyadgtemkhdd` | Local dev, Vercel Preview |

### Google Sheets Sync Architecture
- **Trigger:** DB Trigger → `invoke_sync_sheets()` → `pg_net.http_post()` → Edge Function `sync-sheets-snapshot`
- **Pattern:** Snapshot Sync (Clear & Rewrite) — NOT append
- **Auth:** `x-webhook-secret` header matched against `app_secrets.webhook_secret`
- **GAS Webhook URL:** Stored in Supabase Secret `GOOGLE_APPS_SCRIPT_WEBHOOK_SHEETS`
- **GAS Script Action:** `payload.action === 'snapshot_sync'` → 4 tabs: `👥 ฐานข้อมูลผู้ใช้`, `📝 ประวัติการใช้เครดิต`, `📅 ประวัติการเข้าเรียนทั้งหมด`, `💳 เครดิตคงเหลือ`
- **Payload keys:** `parentsData`, `usageData`, `bookingData`, `balanceData`

### Google Chat Notifications
- Triggers: children INSERT, slip_uploads INSERT, bookings INSERT/UPDATE, parents name UPDATE
- Edge Function: `google-chat-notify`
- **Safety:** `trigger_google_chat_notify()` checks `app.settings.edge_function_base_url` — if empty, aborts (Staging safe)

### app_secrets Table (Prod only — Staging intentionally empty)
| key | value |
|-----|-------|
| `edge_function_base_url` | `https://psusuyesaxuhiondxqie.supabase.co/functions/v1` |
| `webhook_secret` | `icsn-prod-sheets-sync-2026` |

---

## 📁 Uncommitted Files (branch: `fix/audit-fixes-20260710`)

```
M supabase/functions/admin-actions/index.ts
M supabase/functions/sync-sheets-snapshot/index.ts
?? supabase/migrations/20260710095640_fix_dynamic_webhook_url.sql
```

**Next step:** Commit + push branch → test Vercel Preview → merge to main

---

## 🔮 Known Remaining Issues (Low Priority)

- Sentry `tunnelRoute: "/monitoring"` gives 404 with i18n routing (`/en/monitoring`) — cosmetic only, Sentry still works
- `PackagesCreditsSection` uses `any` types — needs proper TypeScript interfaces
- `sync-sheets-snapshot` fires on EVERY row change (no debounce) — consider pg_cron once/minute if dataset grows large

---

## 💡 Suggested Skills for Next Session

- `git-workflow-and-versioning` — commit the open branch and merge
- `code-review-and-quality` — review the branch before merging to main
- `supabase` — if any further DB schema work needed
- `karpathy-guidelines` — keep changes small and verifiable

# Handoff Document — ICSN Playgroup Class Booking
**Date:** 2026-07-03  
**Session Conversation ID:** b503412b-57ea-4175-a681-bf67250e01cb  
**Project Root:** `c:\icsn-playgroup-class-booking`  
**Tech Stack:** Next.js 16 (App Router), React 19, Supabase, TailwindCSS v4, TypeScript

---

## 1. สถานะปัจจุบัน

ระบบ **Build ผ่าน 100%** และ `npm run dev` รันอยู่ ไม่มี error ใดค้างอยู่

---

## 2. สิ่งที่ทำสำเร็จในแชทนี้

### 2.1 Trial Package — Credit Increment Fix
**ปัญหา:** เพิ่มเด็กคนที่ 2 ผ่าน trial path แล้วได้ error `duplicate key value violates unique constraint "idx_unique_trial_package"`

**วิธีแก้:**
1. สร้าง migration `supabase/migrations/20260703150500_rpc_grant_trial_package.sql` — RPC function `grant_trial_package(target_parent_id UUID)` ที่รัน `SECURITY DEFINER`
2. อัปเดต `src/lib/domain/adapters/SupabasePackageAdapter.ts` → `grantTrialPackage()` ให้เรียก `supabase.rpc('grant_trial_package', ...)` แทนการ insert/update โดยตรง
3. Migration ถูก push ขึ้น Supabase staging แล้ว

### 2.2 Admin Dashboard — Recent Bookings + Quick Actions
- เพิ่ม `getRecentBookings(limit: number)` ใน `src/lib/services/admin-booking.service.ts`
- อัปเดต `src/components/admin/views/AdminDashboard.tsx`:
  - Quick Actions เพิ่มปุ่ม "การจองล่าสุด" (scroll to table)
  - เพิ่ม `RecentBookingsTable` component — ตารางแสดง 15 รายการล่าสุด (คอลัมน์: สถานะ, เด็ก, ผู้ปกครอง, เบอร์, วันที่, รอบ, จองเมื่อ)
  - Refactor: แยก `StatCard`, `QuickAction`, `RecentBookingsTable` เป็น sub-components
  - Parallelise API calls ด้วย `Promise.all`

### 2.3 Admin Daily Ops — Compact + Accessible Layout
- อัปเดต `src/components/admin/views/AdminDailyOps.tsx`:
  - Date + Session chips รวมเป็น 1 row แนวนอน
  - Controls (Capacity / Toggle / Print) รวมเป็น inline toolbar
  - ข้อความขยายให้ใหญ่ขึ้น: `text-base` สำหรับ table cells, `text-sm` สำหรับ buttons
  - `py-3` row height สำหรับ accessibility

### 2.4 Rules Saved to AGENTS.md
Rules 5 ข้อถูกบันทึกใน `.agents/AGENTS.md` แล้ว ดู `/learn` section ใน session นี้

---

## 3. Architecture ที่สำคัญ

### Admin Navigation (Fixed Sidebar)
- Sidebar แบบ classic fixed อยู่ซ้ายบน desktop
- `src/app/admin/page.tsx` — entry point, จัดการ `activeTab` state + dynamic import ทุก view
- Tab IDs: `dashboard`, `daily_ops`, `slips`, `users`, `packages`, `timeslot`, `holidays`, `settings`
- `src/config/navigation.ts` — canonical `AdminTabId` type

### Package / Credit System
- ตาราง `packages` มี unique constraint `idx_unique_trial_package ON packages(parent_id) WHERE type = 'trial'`
- ห้าม insert/update trial packages จาก client — ใช้ `supabase.rpc('grant_trial_package', ...)` เสมอ
- RLS: ผู้ใช้ทั่วไป SELECT/INSERT ได้บน packages แต่ UPDATE ถูกบล็อก

### Key Files Changed This Session
| File | สิ่งที่เปลี่ยน |
|---|---|
| `src/lib/domain/adapters/SupabasePackageAdapter.ts` | `grantTrialPackage()` → ใช้ RPC |
| `src/lib/services/admin-booking.service.ts` | เพิ่ม `getRecentBookings()` |
| `src/components/admin/views/AdminDashboard.tsx` | Refactor + Recent Bookings table |
| `src/components/admin/views/AdminDailyOps.tsx` | Compact + larger text |
| `supabase/migrations/20260703150500_rpc_grant_trial_package.sql` | [NEW] RPC function |
| `.agents/AGENTS.md` | เพิ่ม 5 rules |

---

## 4. สิ่งที่ยังไม่ได้ทำ / To-Do ต่อไป

ไม่มี outstanding task ที่ค้างอยู่ สถานะ clean ครับ

---

## 5. Suggested Skills สำหรับ Session ถัดไป

- **`/karpathy-guidelines`** — ใช้ก่อนเขียนโค้ดใหม่ทุกครั้งเพื่อหลีกเลี่ยง overengineering
- **`/ui-styling`** — ถ้าต้องปรับ UI ของ Admin views
- **`/supabase`** — ถ้าต้องแก้ migration หรือ RLS policy
- **`/production-code-audit`** + **`/clean-code`** — ถ้าต้องการ refactor ไฟล์ใหม่

---

## 6. Branch ปัจจุบัน

> [!IMPORTANT]
> ก่อนเขียนโค้ดใดๆ ให้รัน `git branch` เพื่อตรวจสอบว่าไม่ได้อยู่บน `main` — ถ้าอยู่บน `main` ให้สร้าง branch ใหม่ก่อนเสมอ

---

## 7. Environment

- `.env.local` ต้องมีอยู่ที่ root — ไม่ได้ commit ใน git (ดู `.gitignore`)
- Supabase: project มี 2 env (production + staging) — local dev ชี้ไปที่ staging เสมอ
- `npm run dev` รันอยู่ที่ port 3000

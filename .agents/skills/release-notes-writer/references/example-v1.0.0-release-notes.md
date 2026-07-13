# Reference: v1.0.0 Release Notes Example

This file shows the expected output quality for both RELEASE_NOTES.md (Thai) and CHANGELOG.md (English).

---

## RELEASE_NOTES.md — Thai (for staff)

```markdown
## v1.0.0 — 13 ก.ค. 2569 · เวอร์ชันแรก (Full Launch)

### ✅ สิ่งที่เพิ่มใหม่

**ระบบผู้ปกครอง**
- สมัครสมาชิก, ล็อกอิน, และกู้คืนรหัสผ่านทางอีเมลได้แล้ว
- กรอกใบสมัครเด็กพร้อมอัปโหลดรูปภาพและเซ็นชื่อดิจิทัล
- จองคลาสจากปฏิทิน, ดูที่นั่งคงเหลือ, ยกเลิกการจองก่อน cutoff ได้
- ดูยอดเครดิต, ซื้อแพ็กเกจ, แนบสลิปชำระเงินผ่านแอปได้เลย
- แจ้งเตือนวันหยุดโรงเรียนให้ผู้ปกครองทราบอัตโนมัติ
- รองรับทั้งภาษาไทยและภาษาอังกฤษ

**ระบบทีมงาน (Admin)**
- ดูและจัดการข้อมูลผู้ปกครองและเด็กได้จากหน้าเดียว
- อนุมัติสลิปชำระเงิน ระบบจะเติมเครดิตให้อัตโนมัติ
- จัดการ Walk-in และเช็คอินเด็กรายวันได้จากหน้าแอดมิน
- กำหนดวันหยุด, จำนวนที่นั่ง, และเวลา cutoff ได้เอง

**ระบบอัตโนมัติ**
- ไฟล์สลิปและรูปเด็กถูกบันทึกลง Google Drive อัตโนมัติ
- ข้อมูลการจองซิงค์ไป Google Sheets ทันทีที่มีการเปลี่ยนแปลง
- แจ้งเตือนทีมงานทาง Google Chat ทุกครั้งที่มีการจองหรืออนุมัติ
```

---

## CHANGELOG.md — English (for developer)

```markdown
## [1.0.0] - 2026-07-13

### Added
- Full parent booking flow: calendar, session selection, credit deduction, cancellation with configurable cutoff
- Child application workflow: multi-child profiles, photo upload, digital signature via react-signature-canvas
- Admin dashboard: user management drawer, slip approval, daily ops (capacity management), walk-in management, check-in system
- School closure management with parent-facing banner notifications
- Google Drive sync via Edge Function + GAS webhook (slips, photos, signatures)
- Google Sheets snapshot sync triggered by Postgres database triggers via pg_net
- Google Chat notifications for booking/cancellation/slip approval events
- Trial package auto-grant via `grant_trial_package` RPC (handles INSERT + UPDATE safely)
- i18n support (Thai/English) with `[lang]` dynamic route and module-level caching
- Sentry error tracking on frontend (instrumentation-client.ts) and backend (instrumentation.ts)
- Admin settings: cutoff hour, default capacity, operating days — all fetched dynamically from SystemSettings

### Security
- Row Level Security on all tables — parents scoped to own data only
- Admin role verified server-side via `app_metadata` (never client-side)
- Webhook endpoints secured with HMAC secret verification
- Auth uses `supabase.auth.getUser()` exclusively (never `getSession()` for authorization)
```

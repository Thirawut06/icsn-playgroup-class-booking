# Source of Truth: Google Sheets Column Mapping

## DB Schema (verified from live production data)

| Table | Columns |
|-------|---------|
| `parents` | id, phone, name, email, created_at, admin_notes, **google_drive_url** (folder URL) |
| `children` | id, parent_id, full_name, nickname, **dob** *(NOT date_of_birth)*, age, food_allergy, special_info, media_perm, no_photo_perm, **photo_url** (Supabase URL), **parent_photo_url** (Supabase URL), created_at |
| `packages` | id, parent_id, type, credits_remaining, created_at, **non_refundable** *(always false — never set on create)* |
| `slip_uploads` | id, parent_id, file_url (Supabase URL), status, non_refundable *(true = user agreed)*, **package_id** *(stores type STRING, not UUID!)*, created_at |

---

## Column Mapping: Trial Row (form_type = 'trial')

| Col | Index | Header | Source | DB Field | Notes |
|-----|-------|--------|--------|----------|-------|
| A | 0 | Timestamp | `parents.created_at` | `parent.created_at` | ⚠️ was using `new Date()` |
| C | 2 | Email Address | `parents.email` | `parent.email` | |
| D | 3 | Next step | hardcoded | `'A free trial class / ทดลองเรียนฟรีครั้งแรก'` | |
| F | 5 | Parent Name | `parents.name` | `parent.name` | |
| G | 6 | Phone | `parents.phone` | `parent.phone` | |
| **H** | **7** | **Parent Photo** | **Google Drive** | ❌ **Not in DB** — Drive file URL only sent to Sheets live | Cannot backfill from DB |
| I | 8 | Child Full Name | `children.full_name` | `child.full_name` | |
| J | 9 | Child Nickname | `children.nickname` | `child.nickname` | |
| K | 10 | Child DOB | `children.dob` | `child.dob` | ⚠️ was using `child.date_of_birth` (wrong!) |
| **L** | **11** | **Child Photo** | **Google Drive** | ❌ **Not in DB** — Drive file URL only sent to Sheets live | Cannot backfill from DB |
| M | 12 | Food Allergy | `children.food_allergy` | `child.food_allergy` | |
| N | 13 | Special Info | `children.special_info` | `child.special_info` | |
| O | 14 | Media Permission | `children.media_perm` | `child.media_perm` → `'Yes'/'No'` | ✅ stored correctly |
| P | 15 | No Photo Permission | `children.no_photo_perm` | `child.no_photo_perm` → `'Yes'/'No'` | ✅ stored correctly |
| AJ | 35 | Transaction ID | `parents.id` | `parent.id` | |

---

## Column Mapping: Payment Row (form_type = 'payment')

| Col | Index | Header | Source | DB Field | Notes |
|-----|-------|--------|--------|----------|-------|
| A | 0 | Timestamp | `packages.created_at` | `pkg.created_at` | ⚠️ was using `new Date()` |
| C | 2 | Email Address | `parents.email` | `parent.email` | |
| D | 3 | Next step | hardcoded | `'Make a Payment / ชำระเงิน'` | |
| Q | 16 | Parent Name | `parents.name` | `parent.name` | |
| R | 17 | Phone | `parents.phone` | `parent.phone` | |
| S | 18 | Child Full Name | `children.full_name` | `child.full_name` | |
| T | 19 | Child Nickname | `children.nickname` | `child.nickname` | |
| U | 20 | Child DOB | `children.dob` | `child.dob` | ⚠️ was using `child.date_of_birth` (wrong!) |
| V | 21 | Package Type | `packages.type` | `pkg.type` | |
| **W** | **22** | **Payment Slip** | **Google Drive** | ❌ **Not in DB** — Drive file URL only sent to Sheets live | Cannot backfill from DB |
| Z | 25 | Non-Refundable | `slip_uploads.non_refundable` | `slip.non_refundable` → `'Yes'/'No'` | ⚠️ join by `parent_id`, NOT `package_id` (package_id column stores type string!) |
| AA | 26 | Media Permission | `children.media_perm` | `child.media_perm` → `'Yes'/'No'` | ✅ stored correctly |
| AB | 27 | No Photo Permission | `children.no_photo_perm` | `child.no_photo_perm` → `'Yes'/'No'` | ✅ stored correctly |
| AJ | 35 | Transaction ID | `packages.id` | `pkg.id` | |

---

## Drive Links — The Real Situation

> [!IMPORTANT]
> Drive file URLs (H, L, W) are **never stored in the database**.
> They are generated in real-time by `sync-files-to-drive` and sent directly to Sheets via `update_drive_link` webhook.
> The only Drive URL in DB is **`parents.google_drive_url`** = **folder URL** (not individual file URLs).

### To populate H, L, W for backfill:
- The files already exist in Google Drive (from previous syncs)
- `parents.google_drive_url` has the **folder URL** per parent
- We can put the **folder URL** in H, L, W as a fallback → admin can click into the folder
- OR we re-trigger `sync-files-to-drive` via DB UPDATE on children/slip_uploads
  - ⚠️ BUT the Edge Function ignores children updates where `photo_url` didn't change
  - ⚠️ AND slip_uploads updates are ignored unless status changes to 'approved'

### Realistic approach for H, L, W:
- **H (Parent Photo):** use `parents.google_drive_url` as folder link (best we can do from DB)
- **L (Child Photo):** use `parents.google_drive_url` as folder link (same folder)
- **W (Payment Slip):** use `parents.google_drive_url` as folder link (same folder)

---

## All Bugs Found in backfill-sheets-direct.js

| # | Bug | Was | Should Be |
|---|-----|-----|-----------|
| 1 | DOB column | `child.date_of_birth` | `child.dob` |
| 2 | DOB in select query | `'date_of_birth'` in select | `'dob'` |
| 3 | Timestamp (trial) | `new Date()` | `parent.created_at` ✅ fixed |
| 4 | Timestamp (payment) | `new Date()` | `pkg.created_at` ✅ fixed |
| 5 | non_refundable source | `packages.non_refundable` (always false) | `slip_uploads.non_refundable` (always true) ✅ fixed |
| 6 | slip join field | `.eq('package_id', pkg.id)` (UUID vs string) | `.eq('parent_id', parent.id)` ✅ fixed |
| 7 | H, L, W | blank | `parents.google_drive_url` (folder link as fallback) |

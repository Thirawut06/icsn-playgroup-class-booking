---
name: release-notes-writer
description: >
  Generates professional, bilingual (Thai/English) release notes and changelogs for ICSN Playgroup Class Booking.
  Use when preparing a new version release, writing RELEASE_NOTES.md or CHANGELOG.md, or when the user says "เขียน release notes", "สรุปเวอร์ชัน", "write changelog", or "what changed since last release".
---

# Release Notes Writer — ICSN Playgroup

## Overview

This skill synthesizes git commit history, code structure, and project context into professional release notes tailored to two distinct audiences:

1. **RELEASE_NOTES.md** — Thai-language, human-readable notes for low-tech school staff
2. **CHANGELOG.md** — Technical, English-language structured log for the developer

## Workflow

### Step 1: Gather Evidence

Run these commands to collect raw data:

```bash
# Get commits since last tag
git log $(git describe --tags --abbrev=0)..HEAD --oneline --no-merges

# Get last tag name
git describe --tags --abbrev=0

# List changed files
git diff $(git describe --tags --abbrev=0)..HEAD --name-only
```

Also inspect:
- `src/components/` — for new UI features
- `supabase/migrations/` — for database schema changes
- `supabase/functions/` — for new Edge Functions or automation
- `src/lib/services/` — for new business logic

### Step 2: Categorize Changes

Group the raw evidence into these buckets (ignore `chore:`, `test:`, `style:`, `refactor:` unless user-visible):

| Bucket | Include |
|---|---|
| ✨ ฟีเจอร์ใหม่ | `feat:` commits, new components, new pages |
| 🐛 แก้บั๊ก | `fix:` commits |
| ⚡ ปรับปรุง | Performance, UX improvements |
| ⚠️ Breaking / ต้องระวัง | DB schema changes, env var changes, config changes |
| 🔒 ความปลอดภัย | RLS changes, auth changes, webhook security |

### Step 3: Write RELEASE_NOTES.md Entry (Thai, for staff)

**Rules:**
- Write in Thai — simple, friendly, no technical jargon
- Focus on **ผู้ใช้ได้ประโยชน์อะไร** not implementation details
- No filenames, no function names, no SQL
- Use emojis as section markers (✅ ✨ 🐛 ⚠️)
- Max 2 sentences per bullet point
- Keep sections short — staff read on mobile

**Template:**
```markdown
## v{VERSION} — {DATE_THAI}

### ✅ สิ่งที่เพิ่มใหม่
- {User-facing description in Thai}

### 🐛 สิ่งที่แก้ไข
- {Fix description in Thai}

### ⚠️ สิ่งที่ต้องระวัง
- {Breaking change or important note in Thai, if any}
```

**Thai Date Format:** Use Buddhist Era (พ.ศ.) — e.g., `13 ก.ค. 2569`

### Step 4: Write CHANGELOG.md Entry (English, for developer)

Follow [Keep a Changelog](https://keepachangelog.com/) + Semantic Versioning format:

```markdown
## [{VERSION}] - {DATE_ISO}

### Added
- {Technical description}

### Fixed
- {Technical description}

### Changed
- {Technical description}

### Security
- {Security-related changes}
```

**Rules:**
- Keep it technical and precise
- Reference filenames or service names where helpful
- Group by type, newest on top

### Step 5: Determine Version Bump

| Situation | Bump |
|---|---|
| Only `fix:` commits, no schema changes | PATCH `x.x.+1` |
| New `feat:` commits | MINOR `x.+1.0` |
| Breaking DB schema, breaking API, removed feature | MAJOR `+1.0.0` |

### Step 6: Update Files

1. **Prepend** the new entry to `RELEASE_NOTES.md` (after the header, before previous versions)
2. **Prepend** the new entry to `CHANGELOG.md` (after the header)
3. **Do NOT** delete previous entries

### Step 7: Commit

```bash
git add CHANGELOG.md RELEASE_NOTES.md
git commit -m "docs: release notes for v{VERSION}"
```

Then instruct the user to run:
```bash
npm run release
```

## Output Quality Standards

- **Staff notes (Thai)**: Should read like something a school admin would understand without asking for clarification
- **Changelog (English)**: Should let the developer reproduce what changed without reading the diff
- **Tone**: Professional but warm for Thai, precise and terse for English
- **Completeness**: Every user-visible change must appear; internal refactors may be omitted

## Example Output

See `references/example-v1.0.0-release-notes.md` for a complete reference example.

# Implementation Plan: Real-time Calendar Sync

## Overview
Currently, the parent booking calendar loads data (`system_settings`, `school_closures`, and `sessions`) only once when the page mounts. If an admin updates settings, closures, or class capacities, the parent's calendar becomes stale. When the parent clicks a stale available date, the lazy-loading kicks in and updates the UI to show it as full/closed, causing confusion. We will implement Supabase Realtime subscriptions in `BookingContext.tsx` to automatically re-fetch data in the background whenever these tables change, ensuring the UI is always accurate.

## Architecture Decisions
- Subscribe to `system_settings`, `school_closures`, and `sessions` on the `public` schema.
- Re-use the existing `loadData(parentId, false)` function to perform a background silent fetch so the user's UI doesn't show a full-page loading spinner.
- All subscriptions will be bundled into the existing `realtime-slips` channel or a renamed `realtime-booking-data` channel.

## Task List

### Phase 1: Foundation
- [ ] Task 1: Update `BookingContext.tsx` to add Supabase Realtime listeners for `system_settings`, `school_closures`, and `sessions`.

### Checkpoint: Complete
- [ ] UI updates automatically (gray/red) when admin changes closures/settings.
- [ ] Code builds without errors.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Fetch spam if `sessions` updates frequently | Low | The `loadData` function only fetches 2 months of data; Supabase can easily handle this. |

## Open Questions
- None.

# ICSN Playgroup - Business Domain Rules

This document outlines the core business logic and rules of the ICSN Playgroup class booking system. These rules govern how the application behaves and must be strictly adhered to when developing new features or fixing bugs.

## 1. Daily Operations (Sessions)
- **Lazy Initialization:** When building admin features that operate on daily data (like setting capacity or toggling active status), the system must NOT throw errors if a session does not exist for the date. 
- **Auto-Creation:** The system must proactively use `sessionModule.getOrCreateSessionsForDate` to initialize the session based on the template before applying updates.

## 2. Session Templates (Time Slot Management)
- **Forward-Only Changes:** Changes to default time slots (e.g., changing time labels, capacities, or deleting a time slot) must **only apply to future, uncreated sessions**.
- **Historical Integrity:** Modifying templates must NEVER retroactively modify or delete existing sessions to prevent breaking historical data or confusing parents who have already booked.

## 3. Dynamic Booking Rules
- **Configuration over Hardcoding:** Business rules (like the 07:00 AM daily cutoff time for booking/cancellations) must NEVER be hardcoded in UI strings or frontend logic.
- **System Settings Context:** ALWAYS fetch these values dynamically from the `SystemSettings` context or props (e.g., `settings.cutoff_hour`) to ensure the admin can configure them without code changes.

## 4. Trial Packages (Free Trials)
- **One Per Child:** Trial packages are strictly limited to one per child.
- **RPC Requirement:** NEVER call `supabase.from('packages').insert()` or `update()` from the client for trial packages, as it will hit the unique constraint `idx_unique_trial_package` or be blocked by RLS.
- **Granting Logic:** ALWAYS use the Postgres RPC function `grant_trial_package`:
  ```typescript
  await supabase.rpc('grant_trial_package', { target_parent_id: parentId })
  ```
  This function safely handles both INSERT (first child) and UPDATE (subsequent children) securely.

## 5. Booking Flow & Limits
- **Capacity Validation:** Always disable selection elements (with clear visual feedback like "เต็มแล้ว" / Full) on the client side if the available capacity is `<= 0`. Do not rely solely on backend validation.
- **FIFO Auto-Deselect:** When a parent selects a class but has reached their maximum limit (e.g., limited by available credits), implement a First-In, First-Out (FIFO) behavior. 
  - **Behavior:** Automatically deselect the oldest selected item and select the new one fluidly, rather than showing a hard error that blocks the user's interaction.

## 6. Non-Refundable Policy
- **Source of Truth:** The `non_refundable` boolean on the `packages` table is always `false` by default. 
- **Consent Capture:** The actual user consent for the non-refundable policy is captured and stored on the `slip_uploads` table during the checkout process.

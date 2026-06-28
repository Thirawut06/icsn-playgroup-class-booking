# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slips.spec.ts >> Admin Slips Tab (E2E) >> should login as Admin and display the Slips tab
- Location: e2e\slips.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Admin Session Active')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('text=Admin Session Active')

```

```yaml
- img "ICSN Admin"
- heading "Class Admin Panel ผู้ดูแลระบบคลาสเรียน" [level=2]
- paragraph: Please enter password to unlock adult admin panel กรุณากรอกรหัสผ่านเพื่อปลดล็อกแผงผู้ดูแลระบบ
- text: Admin Password / รหัสผ่านแอดมิน
- textbox "••••••••": ICSNadmin2024
- text: Edge Function returned a non-2xx status code
- button "Unlock Admin Board ปลดล็อกแผงแอดมิน"
- paragraph: Closed Server Security System
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Admin Slips Tab (E2E)', () => {
  4  |   test('should login as Admin and display the Slips tab', async ({ page }) => {
  5  |     // 1. Get the admin password from environment variables or use the default
  6  |     // คุณสามารถเปลี่ยนรหัสผ่านได้ง่ายๆ โดยการตั้งค่า ADMIN_PASSWORD ในไฟล์ .env หรือ .env.local
  7  |     const adminPassword = process.env.ADMIN_PASSWORD || 'ICSNadmin2024';
  8  | 
  9  |     // 2. Navigate to admin dashboard
  10 |     await page.goto('/admin');
  11 |     
  12 |     // 3. Login Flow
  13 |     // Wait for the login input field and type the password
  14 |     await page.locator('input[type="password"]').fill(adminPassword);
  15 |     await page.locator('button', { hasText: 'Unlock Admin Board' }).click();
  16 | 
  17 |     // 4. Verify successful login by checking for the sidebar or main tabs
> 18 |     await expect(page.locator('text=Admin Session Active')).toBeVisible({ timeout: 10000 });
     |                                                             ^ Error: expect(locator).toBeVisible() failed
  19 | 
  20 |     // 5. Click the Approve Slips tab
  21 |     const slipsTab = page.locator('button', { hasText: 'Approve Slips' });
  22 |     await slipsTab.click();
  23 | 
  24 |     // 6. Verify we are in the slips tab
  25 |     await expect(page.locator('text=Pending Top-ups')).toBeVisible();
  26 | 
  27 |     // 7. Check for slips or the empty state message
  28 |     const approveButtons = page.locator('button', { hasText: 'Approve' });
  29 |     if (await approveButtons.count() > 0) {
  30 |       await expect(approveButtons.first()).toBeVisible();
  31 |     } else {
  32 |       await expect(page.locator('text=ไม่มีรายการรอตรวจสอบ')).toBeVisible();
  33 |     }
  34 |   });
  35 | });
  36 | 
```
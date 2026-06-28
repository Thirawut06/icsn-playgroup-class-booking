import { test, expect } from '@playwright/test';

test.describe('Admin Slips Tab (E2E)', () => {
  test('should login as Admin and display the Slips tab', async ({ page }) => {
    // 1. Get the admin password from environment variables or use the default
    // คุณสามารถเปลี่ยนรหัสผ่านได้ง่ายๆ โดยการตั้งค่า ADMIN_PASSWORD ในไฟล์ .env หรือ .env.local
    const adminPassword = process.env.ADMIN_PASSWORD || 'ICSNadmin2024';

    // 2. Navigate to admin dashboard
    await page.goto('/admin');
    
    // 3. Login Flow
    // Wait for the login input field and type the password
    await page.locator('input[type="password"]').fill(adminPassword);
    await page.locator('button', { hasText: 'Unlock Admin Board' }).click();

    // 4. Verify successful login by checking for the sidebar or main tabs
    await expect(page.locator('text=Admin Session Active')).toBeVisible({ timeout: 10000 });

    // 5. Click the Approve Slips tab
    const slipsTab = page.locator('button', { hasText: 'Approve Slips' });
    await slipsTab.click();

    // 6. Verify we are in the slips tab
    await expect(page.locator('text=Pending Top-ups')).toBeVisible();

    // 7. Check for slips or the empty state message
    const approveButtons = page.locator('button', { hasText: 'Approve' });
    if (await approveButtons.count() > 0) {
      await expect(approveButtons.first()).toBeVisible();
    } else {
      await expect(page.locator('text=ไม่มีรายการรอตรวจสอบ')).toBeVisible();
    }
  });
});

import { test, expect } from '@playwright/test';

test.describe('Admin Page - Authentication', () => {
  test('unauthenticated user sees the login gate', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('text=Class Admin Panel')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Unlock Admin Board' })).toBeVisible();
    await expect(page.locator('text=ภาพรวมรายวัน')).not.toBeVisible();
  });

  test('authenticated user sees the dashboard', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.setItem('icsn_admin_verified', 'true'));
    await page.goto('/admin');
    await expect(page.locator('text=Class Admin Panel')).not.toBeVisible();
    await expect(page.locator('text=ภาพรวมรายวัน').first()).toBeVisible();
    await expect(page.locator('text=Dashboard').first()).toBeVisible();
  });
});

test.describe('Admin Page - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate before each test in this block
    await page.goto('/');
    await page.evaluate(() => sessionStorage.setItem('icsn_admin_verified', 'true'));
    await page.goto('/admin');
  });

  test('can navigate to all main tabs', async ({ page }) => {
    // 1. Dashboard (Default)
    await expect(page.locator('text=ภาพรวมรายวัน').first()).toBeVisible();

    // 2. Approve Slips
    await page.locator('button', { hasText: 'Approve Slips' }).click();
    await expect(page.locator('text=ตรวจสอบสลิปโอนเงิน (Pending Slips)').first()).toBeVisible();

    // 3. Users & Credits
    await page.locator('button', { hasText: 'Users & Credits' }).click();
    await expect(page.locator('text=จัดการผู้ใช้งาน (Users & Credits)').first()).toBeVisible();
    
    // Verify segmented control inside Users
    await expect(page.locator('button', { hasText: 'ผู้ปกครองและเครดิต' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'ข้อมูลนักเรียน' })).toBeVisible();

    // 4. System Settings
    await page.locator('button', { hasText: 'System Settings' }).click();
    await expect(page.locator('text=ตั้งค่าระบบ (System Configurations)').first()).toBeVisible();
  });
});

test.describe('Admin Page - Dashboard Walk-in', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.setItem('icsn_admin_verified', 'true'));
    await page.goto('/admin');
  });

  test('can see and interact with walk-in form', async ({ page }) => {
    // Wait for the dashboard to load completely
    await expect(page.locator('text=เพิ่ม Walk-in (หน้างาน)')).toBeVisible();

    // Verify inputs are present
    const phoneInput = page.locator('input[placeholder="เบอร์โทรศัพท์ (08XXXXXXXX)"]');
    const nameInput = page.locator('input[placeholder="ชื่อเล่นน้อง"]');
    const submitButton = page.locator('button', { hasText: '+ เพิ่มนักเรียน' });

    await expect(phoneInput).toBeVisible();
    await expect(nameInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).not.toBeDisabled();

    // Fill in the form
    await phoneInput.fill('0812345678');
    await nameInput.fill('น้องทดสอบ');
    
    await expect(phoneInput).toHaveValue('0812345678');
    await expect(nameInput).toHaveValue('น้องทดสอบ');
  });
});

import { test, expect } from '@playwright/test';
import { Client } from 'pg';

const DB_URL = "postgresql://postgres.psusuyesaxuhiondxqie:L{;&+7GSiQnNr3tT@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";
let dbClient: Client;
let testPhone: string;
let testParentId: string;
let testSessionId: string;
let testSessionDate: string;
let tomorrow: Date;

test.beforeAll(async () => {
  dbClient = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await dbClient.connect();

  // Create a test session for tomorrow
  tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  testSessionDate = tomorrow.toISOString().split('T')[0];

  const sessionRes = await dbClient.query(`
    INSERT INTO public.sessions (session_date, capacity, booked_count, time_label)
    VALUES ($1, 10, 0, 'เช้า (09:00 - 12:00)')
    ON CONFLICT (session_date, time_label) 
    DO UPDATE SET capacity = 10
    RETURNING id;
  `, [testSessionDate]);
  testSessionId = sessionRes.rows[0].id;

  testPhone = '080' + Math.floor(1000000 + Math.random() * 9000000).toString();
});

test.afterAll(async () => {
  // Clean up
  if (testParentId) {
    await dbClient.query('DELETE FROM public.bookings WHERE parent_id = $1', [testParentId]);
    await dbClient.query('DELETE FROM public.packages WHERE parent_id = $1', [testParentId]);
    await dbClient.query('DELETE FROM public.children WHERE parent_id = $1', [testParentId]);
    await dbClient.query('DELETE FROM public.parents WHERE id = $1', [testParentId]);
  }
  if (testSessionId) {
    await dbClient.query('DELETE FROM public.sessions WHERE id = $1', [testSessionId]);
  }
  await dbClient.end();
});

test.describe('Booking Feature', () => {

  test('Should successfully book and prevent double booking', async ({ page }) => {
    testParentId = await dbClient.query(`
      INSERT INTO public.parents (name, phone, email)
      VALUES ('Test Parent E2E', $1, $1 || '@test.com')
      RETURNING id
    `, [testPhone]).then(res => res.rows[0].id);

    const childRes = await dbClient.query(`
      INSERT INTO public.children (parent_id, nickname, age)
      VALUES ($1, 'TestNong', 3)
      RETURNING id
    `, [testParentId]);
    const childId = childRes.rows[0].id;

    await dbClient.query(`
      INSERT INTO public.packages (parent_id, type, credits_remaining)
      VALUES ($1, 'TEST', 5)
    `, [testParentId]);

    // 1. Login via localStorage bypass
    await page.goto('/');
    await page.evaluate(({ pid, pphone }) => {
      localStorage.setItem('icsn_parent_id', pid);
      localStorage.setItem('icsn_parent_name', 'Test Parent E2E');
      localStorage.setItem('icsn_parent_phone', pphone);
    }, { pid: testParentId, pphone: testPhone });

    // 2. Go to book page and verify credits
    await page.goto('/book');
    await expect(page.locator('text=Test Parent E2E')).toBeVisible();
    await expect(page.locator('text=สิทธิ์เรียน:')).toBeVisible();
    await expect(page.locator('span.text-icsn-teal:has-text("5")').first()).toBeVisible();

    // 3. Select the child and date
    await page.selectOption('select', { label: 'TestNong ()' });
    const dayButton = page.getByRole('button', { name: tomorrow.getDate().toString(), exact: true }).first();
    await dayButton.click();

    // Select the session slot
    await page.click('text=เช้า (09:00 - 12:00)');

    // Click Book
    await page.click('button:has-text("ยืนยันการจองสิทธิ์ (หัก 1 Credit)")');

    // Confirm booking
    await page.click('button:has-text("ยืนยันจอง")');

    // Wait for success modal (assuming it has the text จองสำเร็จ or similar)
    // In BookingConfirmModal it redirects or shows success? 
    // Actually the app redirects to /my-bookings or shows a success UI.
    // We will just verify credits are reduced to 4.
    await page.waitForTimeout(2000); // give time for the redirect or state update
    await page.goto('/book');
    await expect(page.locator('text=สิทธิ์เรียน:')).toBeVisible();
    await expect(page.locator('span.text-icsn-teal:has-text("4")').first()).toBeVisible();

    // 4. Double booking test
    // Ensure the child is still selected
    await page.selectOption('select', { label: 'TestNong ()' });
    
    // The calendar day for tomorrow should now be disabled since it's already booked!
    const bookedDayButton = page.getByRole('button', { name: tomorrow.getDate().toString(), exact: true }).first();
    await expect(bookedDayButton).toBeDisabled();
  });

});

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

test.describe('Cancellation Feature', () => {

  test('Should successfully cancel booking and refund credit', async ({ page }) => {
    testParentId = await dbClient.query(`
      INSERT INTO public.parents (name, phone, email)
      VALUES ('Test Parent Cancel', $1, $1 || '@test.com')
      RETURNING id
    `, [testPhone]).then(res => res.rows[0].id);

    const childRes = await dbClient.query(`
      INSERT INTO public.children (parent_id, nickname, age)
      VALUES ($1, 'TestCancelNong', 3)
      RETURNING id
    `, [testParentId]);
    const childId = childRes.rows[0].id;

    // Grant 4 credits (simulate 1 used for the upcoming booking)
    await dbClient.query(`
      INSERT INTO public.packages (parent_id, type, credits_remaining)
      VALUES ($1, 'TEST', 4)
    `, [testParentId]);

    // Pre-book the session
    await dbClient.query(`
      INSERT INTO public.bookings (parent_id, child_id, session_id, session_date, status, child_name_snapshot, parent_phone_snapshot)
      VALUES ($1, $2, $3, $4, 'confirmed', 'TestCancelNong', $5)
    `, [testParentId, childId, testSessionId, testSessionDate, testPhone]);

    // 1. Login via localStorage bypass
    await page.goto('/');
    await page.evaluate(({ pid, pphone }) => {
      localStorage.setItem('icsn_parent_id', pid);
      localStorage.setItem('icsn_parent_name', 'Test Parent Cancel');
      localStorage.setItem('icsn_parent_phone', pphone);
    }, { pid: testParentId, pphone: testPhone });

    // 2. Go to My Bookings
    await page.goto('/my-bookings');
    await expect(page.locator('text=TestCancelNong')).toBeVisible();

    // 3. Click Cancel Booking
    await page.click('button:has-text("Cancel Booking")');
    await page.click('button:has-text("ยืนยัน (Confirm)")');

    // Expect success message
    await expect(page.locator('text=ยกเลิกสำเร็จ')).toBeVisible();
    await page.click('button:has-text("ปิด (Close)")');

    // 4. Go back to book to check credits refunded (from 4 to 5)
    await page.goto('/book');
    await expect(page.locator('text=สิทธิ์เรียน:')).toBeVisible();
    await expect(page.locator('span.text-icsn-teal:has-text("5")').first()).toBeVisible();
  });

});

import { NextResponse } from 'next/server';
import { GoogleWorkspaceService } from '@/lib/services/google-workspace.service';
import { AdminService } from '@/lib/supabase';

export async function POST() {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'GOOGLE_SHEET_ID is not configured in .env.local' }, { status: 500 });
    }

    // 1. Fetch data from Supabase
    const users = await AdminService.getAllUsersClassified();

    // 2. Prepare Data Rows for Sheets
    const headers = ['รหัสครอบครัว', 'ชื่อผู้ปกครอง', 'เบอร์โทรศัพท์', 'อีเมล', 'ชื่อเล่นลูก', 'ยอดจองสำเร็จ', 'เครดิตคงเหลือ', 'หมวดหมู่', 'ใช้งานล่าสุด'];
    const rows = users.map(user => [
      user.id,
      user.name,
      user.phone,
      user.email || '',
      user.children_nicknames,
      user.total_bookings,
      user.total_credits,
      user.category,
      new Date(user.latestActivity).toLocaleString('th-TH')
    ]);

    const dataRows = [headers, ...rows];

    // 3. Sync to Google Sheets
    await GoogleWorkspaceService.syncDataToSheet(spreadsheetId, 'Sheet1!A1', dataRows);

    return NextResponse.json({ success: true, rowsSynced: rows.length });
  } catch (error: any) {
    console.error('Google Sheets Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

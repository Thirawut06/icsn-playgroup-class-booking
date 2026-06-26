"use client";

import React, { useState } from 'react';
import { DownloadCloud, FileSpreadsheet } from 'lucide-react';
import { AppDB } from '@/lib/supabase';
import type { ExportCSVRow } from '@/types';
import { AdminPanel, AdminPanelHeader } from './admin-ui';

function downloadCSV(rows: ExportCSVRow[]) {
  const headers = [
    'ชื่อผู้ปกครอง',
    'เบอร์โทร',
    'ชื่อเล่นเด็ก',
    'อายุ',
    'แพ้อาหาร',
    'เครดิตคงเหลือ',
    'วันที่จองคลาส',
    'วันที่ลงทะเบียน',
  ];

  const escape = (val: string | number) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [
    headers.join(','),
    ...rows.map(r =>
      [
        r.parent_name,
        r.phone,
        r.child_nickname,
        r.age,
        r.food_allergy,
        r.credits_remaining,
        r.booking_dates,
        r.registration_date,
      ].map(escape).join(',')
    ),
  ];

  const bom = '\uFEFF';
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `icsn-playgroup-export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportTab() {
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState<number | null>(null);

  const handleExport = async () => {
    setLoading(true);
    try {
      const rows = await AppDB.getExportCSVData();
      setRowCount(rows.length);
      downloadCSV(rows);
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminPanel className="no-print">
      <AdminPanelHeader
        icon={DownloadCloud}
        title="ส่งออกชุดข้อมูลสมาชิกเป็นไฟล์ CSV (CSV Export Operations)"
      />

      <div className="space-y-4">
        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-500 leading-relaxed">
          <p className="font-bold text-gray-700 mb-1">💡 รูปแบบรายงานสารสนเทศ:</p>
          <p>
            ระบบจะสร้างไฟล์ Excel CSV ที่ประกอบไปด้วยรายชื่อคุณพ่อคุณแม่ทั้งหมด, รายชื่อน้อง,
            ประวัติอาหารแพ้, จำนวนโควตาสิทธิ์ที่เหลืออยู่, รายการวันที่จองไปแล้วทั้งหมด
            เพื่อประมวลผลด่วนภายนอก
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={handleExport}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-icsn-teal hover:bg-[#00969e] text-white py-3 px-6 rounded-xl font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>{loading ? 'กำลังสร้างไฟล์...' : 'ส่งออกเอกสาร (Export CSV Sheet)'}</span>
          </button>
          {rowCount !== null ? (
            <p className="text-sm text-icsn-teal mt-4">ส่งออก {rowCount} แถวสำเร็จ</p>
          ) : null}
        </div>
      </div>
    </AdminPanel>
  );
}

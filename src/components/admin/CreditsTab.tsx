"use client";

import React, { useState } from 'react';
import { Ticket } from 'lucide-react';
import { AdminService } from '@/lib/supabase';
import type { ParentWithDetails } from '@/types';
import {
  AdminEmptyState,
  AdminFieldLabel,
  AdminPanel,
  AdminPanelHeader,
  AdminPrimaryButton,
} from './admin-ui';

export function CreditsTab() {
  const [phone, setPhone] = useState('');
  const [parent, setParent] = useState<ParentWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [creditOffset, setCreditOffset] = useState(0);
  const [creditMessage, setCreditMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const totalCredits = parent?.packages?.reduce((sum, p) => sum + p.credits_remaining, 0) ?? 0;

  const handleSearch = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    setParent(null);
    setCreditOffset(0);
    setCreditMessage('');
    try {
      const result = await AdminService.searchParentByPhone(phone.trim());
      if (!result) {
        alert('ไม่พบเบอร์โทรศัพท์นี้ในระบบ');
      }
      setParent(result);
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const saveCreditsChange = async () => {
    if (!parent) return;
    if (!creditOffset) {
      alert('กรุณาปรับจำนวนเครดิตก่อนบันทึก');
      return;
    }
    if (!reason.trim()) {
      alert('กรุณาระบุเหตุผลในการแก้ไขข้อมูลผู้เรียน');
      return;
    }
    setSaving(true);
    try {
      const newTotal = await AdminService.adjustCredits(parent.id, creditOffset, reason.trim());
      const updated = await AdminService.searchParentByPhone(parent.phone);
      setParent(updated);
      setCreditOffset(0);
      setReason('');
      setCreditMessage(`บันทึกสำเร็จ — คงเหลือ ${newTotal} credit(s) (${newTotal} ครั้ง)`);
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPanel className="no-print">
      <AdminPanelHeader
        icon={Ticket}
        title="จัดการเพิ่ม/ลดสิทธิ์เข้าบัญชีผู้เรียน (Manual Credits Control)"
      />

      <div className="space-y-6">
        <div className="bg-gray-50 p-6 border border-gray-200 rounded-2xl flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <AdminFieldLabel>ค้นหาข้อมูลผู้ปกครองด้วยเบอร์โทรศัพท์:</AdminFieldLabel>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="เช่น 0812345678"
              className="block w-full px-4 py-3 text-sm border border-gray-200 rounded-xl h-12 bg-white"
            />
          </div>
          <AdminPrimaryButton onClick={handleSearch} disabled={loading}>
            {loading ? 'กำลังค้นหา...' : 'ค้นหาผู้ใช้'}
          </AdminPrimaryButton>
        </div>

        {!parent ? (
          <AdminEmptyState message="ค้นหาผู้ปกครองด้วยเบอร์โทรศัพท์เพื่อจัดการเครดิต" />
        ) : (
          <div className="border border-gray-200 rounded-2xl p-6 md:p-8 bg-white space-y-8 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm border-b border-gray-100 pb-8">
              <div>
                <span className="block text-gray-400 mb-1">ชื่อผู้ใช้:</span>
                <span className="font-bold text-gray-900 text-base">{parent.name}</span>
              </div>
              <div>
                <span className="block text-gray-400 mb-1">Phone (เบอร์โทรศัพท์):</span>
                <span className="font-bold text-gray-900 font-mono text-base">{parent.phone}</span>
              </div>
              <div>
                <span className="block text-gray-400 mb-1">Remaining Credits (สิทธิ์คงเหลือสะสม):</span>
                <span className="text-xl font-black text-icsn-teal">
                  {totalCredits} credit(s) ({totalCredits} ครั้ง)
                </span>
              </div>
              <div>
                <span className="block text-gray-400 mb-1">Student Nicknames (ชื่อเล่นนักเรียน):</span>
                <span className="font-bold text-gray-900 text-base">
                  {parent.children?.map(c => c.nickname).join(', ') || '-'}
                </span>
              </div>
            </div>

            <div className="space-y-6 max-w-sm">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setCreditOffset(curr => curr - 1)}
                  className="w-12 h-12 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center font-bold text-gray-700 cursor-pointer transition text-lg"
                >
                  -1
                </button>
                <div className="flex-1 text-center font-bold text-base text-gray-800 bg-gray-50 py-3 rounded-xl border border-gray-100">
                  ปรับโควตา : <span className={creditOffset > 0 ? 'text-emerald-600' : creditOffset < 0 ? 'text-rose-600' : ''}>{creditOffset > 0 ? `+${creditOffset}` : creditOffset}</span> ครั้ง
                </div>
                <button
                  type="button"
                  onClick={() => setCreditOffset(curr => curr + 1)}
                  className="w-12 h-12 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center font-bold text-gray-700 cursor-pointer transition text-lg"
                >
                  +1
                </button>
              </div>

              <div>
                <AdminFieldLabel>
                  ระบุเหตุผลในการแก้ไขข้อมูลผู้เรียน * (คีย์เวิร์ดบังคับ):
                </AdminFieldLabel>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="เช่น คุณแม่โอนเพิ่มเติมสด / หักสิทธิ์ชดเชยที่จองผิด..."
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-sm h-12 focus:ring-icsn-teal focus:border-icsn-teal outline-none transition"
                />
              </div>

              {creditMessage ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-sm font-bold flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  {creditMessage}
                </div>
              ) : null}

              <button
                type="button"
                onClick={saveCreditsChange}
                disabled={saving}
                className="w-full bg-icsn-teal hover:bg-icsn-teal/90 text-white py-3 px-4 rounded-xl text-sm font-bold h-12 cursor-pointer disabled:opacity-50 transition shadow-sm"
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึกการจัดสรรสิทธิ์เครดิต'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminPanel>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Save, Loader2, Info } from 'lucide-react';
import { SettingsService, SystemSettings } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { COPY } from '@/config/copy';
import {
  
  
  AdminFieldLabel,
} from './admin-ui';

export function SettingsTab() {
  const [settings, setSettings] = useState<SystemSettings>({
    cutoff_hour: 7,
    default_capacity: 12,
    announcement_text: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await SettingsService.getAllSettings();
      if (data) {
        setSettings(data);
      }
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      await SettingsService.updateAllSettings(settings);
      setSuccessMsg('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <Loader2 className="w-8 h-8 animate-spin text-icsn-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="w-full">
        

        <div className="space-y-8 mt-6">
          {/* Section 1: Business Rules */}
          <section className="bg-gray-50 p-5 rounded-lg border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
              กฎการจอง (Booking Rules)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
              <div>
                <AdminFieldLabel>เวลาตัดรอบจอง/ยกเลิก ภายในวันเดียวกัน (Cut-off Time)</AdminFieldLabel>
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={settings.cutoff_hour}
                    onChange={(e) => setSettings({ ...settings, cutoff_hour: parseInt(e.target.value) })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}:00 น.
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  เวลาที่จะไม่อนุญาตให้ผู้ปกครองจองหรือยกเลิกคลาสของวันนี้ (ค่าเริ่มต้น: 07:00 น.)
                </p>
              </div>

              <div>
                <AdminFieldLabel>จำนวนรับสมัครพื้นฐานต่อวัน (Default Capacity)</AdminFieldLabel>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min="1"
                    value={settings.default_capacity}
                    onChange={(e) => setSettings({ ...settings, default_capacity: parseInt(e.target.value) || 12 })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                  />
                  <span className="text-sm text-gray-600">คน/วัน</span>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  จำนวนเด็กที่รับได้สูงสุดต่อ 1 session (ค่าเริ่มต้น: 12)
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Announcements */}
          <section className="bg-amber-50/50 p-5 rounded-lg border border-amber-200/60">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-amber-100 text-amber-800 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
              ประกาศหน้าแอพ (Announcements)
            </h3>
            
            <div className="pl-8">
              <AdminFieldLabel>ข้อความประกาศแจ้งผู้ปกครอง (Announcement Text)</AdminFieldLabel>
              <textarea
                value={settings.announcement_text}
                onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
                placeholder="เช่น โรงเรียนหยุดทำการในวันศุกร์ที่ 12... (เว้นว่างไว้หากไม่มีประกาศ)"
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                ข้อความนี้จะแสดงเด่นอยู่บนสุดของหน้าการจองในแอปพลิเคชันฝั่งผู้ปกครอง
              </p>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            {successMsg && (
              <span className="text-emerald-600 text-sm font-bold animate-pulse">{successMsg}</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              บันทึกการตั้งค่า
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

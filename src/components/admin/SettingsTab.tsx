"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Save, Loader2, Info } from 'lucide-react';
import { SettingsService, SystemSettings } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { COPY } from '@/config/copy';
import { AdminFieldLabel } from './admin-ui';

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
        <div className="space-y-8 mt-4 animate-in fade-in duration-500">
          {/* Section 1: Business Rules */}
          <section className="bg-white p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-base font-bold text-icsn-navy mb-6 flex items-center gap-2">
              <div className="bg-icsn-teal/10 p-2 rounded-xl text-icsn-teal">
                <Settings className="w-5 h-5" />
              </div>
              กฎการจอง (Booking Rules)
            </h3>
            
            <div className="pl-0 sm:pl-[52px]">
              <AdminFieldLabel>เวลาตัดรอบจอง/ยกเลิก ภายในวันเดียวกัน (Cut-off Time)</AdminFieldLabel>
              <div className="flex items-center gap-3 mt-2">
                <select
                  value={settings.cutoff_hour}
                  onChange={(e) => setSettings({ ...settings, cutoff_hour: parseInt(e.target.value) })}
                  className="w-40 px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-icsn-teal/30 outline-none font-medium text-icsn-navy transition-all"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}:00 น.
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-muted-foreground mt-3 flex items-start gap-1.5 bg-muted/30 p-3 rounded-lg border border-border/50">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-icsn-teal" />
                เวลาที่จะไม่อนุญาตให้ผู้ปกครองจองหรือยกเลิกคลาสของวันนี้ (ค่าเริ่มต้น: 07:00 น.)
              </p>
            </div>
          </section>

          {/* Section 2: Announcements */}
          <section className="bg-white p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-base font-bold text-icsn-navy mb-6 flex items-center gap-2">
              <div className="bg-warning/10 p-2 rounded-xl text-warning">
                <Info className="w-5 h-5" />
              </div>
              ประกาศหน้าแอป (Announcements)
            </h3>
            
            <div className="pl-0 sm:pl-[52px]">
              <AdminFieldLabel>ข้อความประกาศแจ้งผู้ปกครอง (Announcement Text)</AdminFieldLabel>
              <textarea
                value={settings.announcement_text}
                onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
                placeholder="เช่น โรงเรียนหยุดทำการในวันศุกร์ที่ 12... (เว้นว่างไว้หากไม่มีประกาศ)"
                rows={4}
                className="w-full mt-2 px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-warning/30 focus:border-warning/50 outline-none text-sm transition-all resize-none text-icsn-navy"
              />
              <p className="text-sm text-muted-foreground mt-3 flex items-start gap-1.5 bg-warning/5 p-3 rounded-lg border border-warning/10">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-warning" />
                ข้อความนี้จะแสดงเด่นอยู่บนสุดของหน้าการจองในแอปพลิเคชันฝั่งผู้ปกครอง
              </p>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
            {successMsg && (
              <span className="text-success text-sm font-bold animate-pulse">{successMsg}</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-icsn-teal hover:bg-icsn-teal/90 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

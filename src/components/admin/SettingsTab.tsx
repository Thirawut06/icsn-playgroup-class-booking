"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Save, Loader2, Info, BellRing, Clock } from 'lucide-react';
import { SettingsService, SystemSettings } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { COPY } from '@/config/copy';
import { AdminFieldLabel, AdminPrimaryButton } from './admin-ui';

export function SettingsTab() {
  const [settings, setSettings] = useState<SystemSettings>({
    cutoff_hour: 7,
    default_capacity: 12,
    announcement_text: '',
    operating_days: [0, 1, 2, 3, 4, 5, 6],
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
      toast.success('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-icsn-teal" />
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500 max-w-3xl">
      <div className="space-y-8">
        
        {/* Section 1: Business Rules */}
        <section className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-muted/40 px-6 py-4 border-b border-border flex items-center gap-3">
            <div className="bg-icsn-teal/10 p-2 rounded-lg text-icsn-teal">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-icsn-navy text-lg">กฎการจอง (Booking Rules)</h3>
              <p className="text-sm text-muted-foreground">ตั้งค่าเงื่อนไขเวลาในการจองหรือยกเลิกคลาส</p>
            </div>
          </div>
          
          <div className="p-6">
            <div className="max-w-md">
              <AdminFieldLabel>เวลาตัดรอบจอง/ยกเลิก ภายในวันเดียวกัน (Cut-off Time)</AdminFieldLabel>
              <div className="flex items-center gap-3 mt-2">
                <select
                  value={settings.cutoff_hour}
                  onChange={(e) => setSettings({ ...settings, cutoff_hour: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none font-bold text-icsn-navy transition-all"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}:00 น.
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-start gap-2 mt-3 p-3 bg-muted/50 rounded-lg">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-icsn-teal" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  เวลาที่จะไม่อนุญาตให้ผู้ปกครองทำรายการ "จอง" หรือ "ยกเลิก" คลาสของวันนี้<br />
                  <span className="font-medium text-foreground">ตัวอย่าง:</span> หากตั้งไว้ที่ 07:00 น. ผู้ปกครองจะไม่สามารถกดยกเลิกคลาสของวันนี้ได้หลังจากเจ็ดโมงเช้าเป็นต้นไป
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Announcements */}
        <section className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-warning/5 px-6 py-4 border-b border-warning/10 flex items-center gap-3">
            <div className="bg-warning/20 p-2 rounded-lg text-warning">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-icsn-navy text-lg">ประกาศหน้าแอป (Announcements)</h3>
              <p className="text-sm text-muted-foreground">ข้อความที่จะแสดงเด่นชัดให้ผู้ปกครองทุกคนเห็น</p>
            </div>
          </div>
          
          <div className="p-6">
            <div>
              <AdminFieldLabel>ข้อความประกาศแจ้งผู้ปกครอง (Announcement Text)</AdminFieldLabel>
              <textarea
                value={settings.announcement_text}
                onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
                placeholder="เช่น โรงเรียนหยุดทำการในวันศุกร์ที่ 12 เนื่องในวันหยุด..."
                rows={3}
                className="w-full mt-2 px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-warning/30 focus:border-warning/50 outline-none text-sm transition-all resize-none text-icsn-navy"
              />
              <div className="flex items-start gap-2 mt-3 p-3 bg-warning/5 rounded-lg border border-warning/10">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-warning" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  ข้อความนี้จะแสดงอยู่<span className="font-bold text-warning">บนสุดของหน้าหลัก (แถบสีเหลือง)</span> ในแอปพลิเคชันฝั่งผู้ปกครอง<br />
                  หากไม่ต้องการแสดงประกาศ ให้ลบข้อความออกให้หมด (เว้นว่างไว้)
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
        {successMsg && (
          <span className="text-success text-sm font-bold animate-fade-in-up">{successMsg}</span>
        )}
        <AdminPrimaryButton
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 h-auto text-base"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </AdminPrimaryButton>
      </div>
    </div>
  );
}

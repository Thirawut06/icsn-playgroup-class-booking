"use client";

import React, { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { SettingsService } from '@/lib/services/settings.service';
import type { SystemSettings } from '@/lib/services/settings.service';
import toast from 'react-hot-toast';
import { COPY } from '@/config/copy';
import { AdminPrimaryButton } from './admin-ui';
import { BookingRulesSection } from './settings/BookingRulesSection';
import { AnnouncementsSection } from './settings/AnnouncementsSection';
import { AutoApproveSection } from './settings/AutoApproveSection';

export function SettingsTab() {
  const [settings, setSettings] = useState<SystemSettings>({
    cutoff_hour: 7,
    default_capacity: 12,
    announcement_text: '',
    operating_days: [0, 1, 2, 3, 4, 5, 6],
    auto_approve_slip_enabled: true,
    auto_approve_slip_start: '17:00',
    auto_approve_slip_end: '07:00',
    auto_approve_full_days: [],
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
        <BookingRulesSection settings={settings} setSettings={setSettings} />
        <AnnouncementsSection settings={settings} setSettings={setSettings} />
        <AutoApproveSection settings={settings} setSettings={setSettings} />
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

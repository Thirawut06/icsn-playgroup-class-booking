"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Save, Loader2, AlertTriangle } from 'lucide-react';
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
  const [originalSettings, setOriginalSettings] = useState<SystemSettings | null>(null);
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
        setOriginalSettings(JSON.parse(JSON.stringify(data)));
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
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      setSuccessMsg('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
      toast.success('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = useMemo(() => {
    if (!originalSettings) return false;
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }, [settings, originalSettings]);

  if (loading) {
    return (
      <div className="w-full py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-icsn-teal" />
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500 max-w-3xl relative">
      <div className="space-y-8 pb-24">
        <BookingRulesSection settings={settings} setSettings={setSettings} />
        <AnnouncementsSection settings={settings} setSettings={setSettings} />
        <AutoApproveSection settings={settings} setSettings={setSettings} />
      </div>

      {/* Sticky Save Bar */}
      <div className={`fixed sm:absolute bottom-0 left-0 right-0 sm:rounded-b-2xl p-4 sm:p-6 bg-white border-t border-border shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] flex items-center justify-between z-10 transition-transform duration-300 ${hasUnsavedChanges ? 'translate-y-0' : 'translate-y-0 sm:translate-y-0'}`}>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <>
              <div className="bg-warning/20 text-warning p-2 rounded-full hidden sm:block">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="text-warning font-bold text-sm sm:text-base hidden sm:inline">มีข้อมูลที่ยังไม่บันทึก</span>
              <span className="text-warning font-bold text-sm sm:hidden">ยังไม่บันทึก</span>
            </>
          )}
          {successMsg && !hasUnsavedChanges && (
            <span className="text-success text-sm font-bold animate-fade-in-up">{successMsg}</span>
          )}
        </div>
        <AdminPrimaryButton
          onClick={handleSave}
          disabled={saving || !hasUnsavedChanges}
          className={`px-6 sm:px-8 py-3 h-auto text-base ${hasUnsavedChanges ? 'bg-error hover:bg-error/90 ring-4 ring-error/20' : ''}`}
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </AdminPrimaryButton>
      </div>
    </div>
  );
}

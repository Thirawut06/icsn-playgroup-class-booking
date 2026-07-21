"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Save, Loader2, AlertTriangle } from 'lucide-react';
import { SettingsService } from '@/lib/services/settings.service';
import type { SystemSettings } from '@/lib/services/settings.service';
import toast from 'react-hot-toast';
import { COPY } from '@/config/copy';
import { AdminPrimaryButton, AdminConfirmModal } from './admin-ui';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
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

  const handleSave = async (): Promise<boolean> => {
    setSaving(true);
    setSuccessMsg('');
    try {
      await SettingsService.updateAllSettings(settings);
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      setSuccessMsg('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
      toast.success('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
      setTimeout(() => setSuccessMsg(''), 3000);
      return true;
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(err instanceof Error ? err.message : String(err)));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndLeave = async () => {
    const success = await handleSave();
    if (success) {
      handleConfirmLeave();
    }
  };

  const hasUnsavedChanges = useMemo(() => {
    if (!originalSettings) return false;
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }, [settings, originalSettings]);

  // Use Custom Hook for Clean Code
  const { isLeaveModalOpen, handleConfirmLeave, handleCancelLeave } = useUnsavedChangesGuard(hasUnsavedChanges);

  if (loading) {
    return (
      <div className="w-full py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-icsn-teal" />
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500 max-w-3xl relative flex flex-col h-full">
      <div className="space-y-4 pb-4">
        <BookingRulesSection settings={settings} setSettings={setSettings} />
        <AnnouncementsSection settings={settings} setSettings={setSettings} />
        <AutoApproveSection settings={settings} setSettings={setSettings} />
      </div>

      {/* Sticky Save Bar */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t border-border flex items-center justify-between z-10 mt-auto rounded-b-2xl shadow-sm">
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
          className={`px-6 sm:px-8 py-2.5 h-auto text-sm ${hasUnsavedChanges ? 'bg-error hover:bg-error/90 ring-2 ring-error/20' : ''}`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </AdminPrimaryButton>
      </div>

      {/* Confirmation Modal */}
      <AdminConfirmModal
        isOpen={isLeaveModalOpen}
        onClose={handleCancelLeave} // Backdrop/X -> Cancel routing, stay on page
        onCancelAction={handleConfirmLeave} // Left button -> Discard and leave
        onConfirm={handleSaveAndLeave} // Right button -> Save and leave
        title="มีข้อมูลที่ยังไม่ได้บันทึก"
        message="คุณต้องการบันทึกการตั้งค่าก่อนออกจากหน้านี้หรือไม่?"
        confirmText="บันทึกและออก"
        cancelText="ไม่บันทึก"
        isDestructive={false}
      />
    </div>
  );
}

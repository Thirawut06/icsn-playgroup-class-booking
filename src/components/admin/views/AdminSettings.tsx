"use client";

import React from 'react';
import { Settings } from 'lucide-react';
import { AdminPanel, AdminPanelHeader } from '../admin-ui';
import { SettingsTab } from '../SettingsTab';

export function AdminSettings() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPanel className="no-print">
        <AdminPanelHeader icon={Settings} title="การตั้งค่าทั่วไป (General Settings)" />

        <div className="p-0 sm:p-6 space-y-6">
          <div className="px-6 sm:px-0 pb-6 sm:pb-0 pt-6">
            <SettingsTab />
          </div>
        </div>
      </AdminPanel>
    </div>
  );
}

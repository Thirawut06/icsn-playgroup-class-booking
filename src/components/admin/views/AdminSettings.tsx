"use client";

import React, { useState } from 'react';
import { Settings, SlidersHorizontal, CalendarCog, Package } from 'lucide-react';
import { AdminPanel, AdminPanelHeader } from '../admin-ui';
import { SettingsTab } from '../SettingsTab';
import { CalendarSettingsTab } from '../CalendarSettingsTab';
import { PackageOptionsTab } from '../PackageOptionsTab';

export function AdminSettings() {
  const [activeSubTab, setActiveSubTab] = useState<'system' | 'calendar' | 'packages'>('system');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPanel className="no-print">
        <AdminPanelHeader icon={Settings} title="ตั้งค่าระบบ (System Configurations)" />

        <div className="p-6 space-y-6">
          {/* Segmented Control */}
          <div className="flex p-1 bg-gray-100 rounded-xl w-full max-w-2xl mx-auto flex-col sm:flex-row gap-1">
            <button
              onClick={() => setActiveSubTab('system')}
              className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-lg font-bold text-sm transition ${
                activeSubTab === 'system' ? 'bg-white text-icsn-teal shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              การตั้งค่าทั่วไป
            </button>
            <button
              onClick={() => setActiveSubTab('calendar')}
              className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-lg font-bold text-sm transition ${
                activeSubTab === 'calendar' ? 'bg-white text-icsn-teal shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarCog className="w-4 h-4" />
              ปฏิทิน & วันหยุด
            </button>
            <button
              onClick={() => setActiveSubTab('packages')}
              className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-lg font-bold text-sm transition ${
                activeSubTab === 'packages' ? 'bg-white text-icsn-teal shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package className="w-4 h-4" />
              จัดการแพ็กเกจ
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden p-6">
             {activeSubTab === 'system' ? <SettingsTab /> : null}
             {activeSubTab === 'calendar' ? <CalendarSettingsTab /> : null}
             {activeSubTab === 'packages' ? <PackageOptionsTab /> : null}
          </div>
        </div>
      </AdminPanel>
    </div>
  );
}

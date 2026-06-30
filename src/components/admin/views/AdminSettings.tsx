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

        <div className="p-0 sm:p-6 space-y-6">
          {/* Premium Horizontal Tabs */}
          <div className="px-6 sm:px-0 border-b border-border">
            <div className="flex space-x-8 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveSubTab('system')}
                className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                  activeSubTab === 'system'
                    ? 'border-icsn-teal text-icsn-teal'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                การตั้งค่าทั่วไป
              </button>
              
              <button
                onClick={() => setActiveSubTab('calendar')}
                className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                  activeSubTab === 'calendar'
                    ? 'border-icsn-teal text-icsn-teal'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <CalendarCog className="w-4 h-4" />
                ปฏิทิน & วันหยุด
              </button>
              
              <button
                onClick={() => setActiveSubTab('packages')}
                className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                  activeSubTab === 'packages'
                    ? 'border-icsn-teal text-icsn-teal'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Package className="w-4 h-4" />
                แพ็กเกจราคา
              </button>
            </div>
          </div>

          <div className="px-6 sm:px-0 pb-6 sm:pb-0 pt-6">
            <div className="transition-all">
               {activeSubTab === 'system' ? <SettingsTab /> : null}
               {activeSubTab === 'calendar' ? <CalendarSettingsTab /> : null}
               {activeSubTab === 'packages' ? <PackageOptionsTab /> : null}
            </div>
          </div>
        </div>
      </AdminPanel>
    </div>
  );
}

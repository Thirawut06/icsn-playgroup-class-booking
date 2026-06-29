"use client";

import React, { useState } from 'react';
import { Users, Ticket, Baby } from 'lucide-react';
import { AdminPanel, AdminPanelHeader } from '../admin-ui';
import { CreditsTab } from '../CreditsTab';
import { ChildrenTab } from '../ChildrenTab';

export function AdminUsers() {
  const [activeSubTab, setActiveSubTab] = useState<'parents' | 'children'>('parents');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPanel className="no-print">
        <AdminPanelHeader icon={Users} title="จัดการผู้ใช้งาน (Users & Credits)" />

        <div className="p-6 space-y-6">
          {/* Segmented Control */}
          <div className="flex p-1 bg-gray-100 rounded-xl w-full max-w-md mx-auto">
            <button
              onClick={() => setActiveSubTab('parents')}
              className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-lg font-bold text-sm transition ${
                activeSubTab === 'parents' ? 'bg-white text-icsn-teal shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Ticket className="w-4 h-4" />
              ผู้ปกครองและเครดิต
            </button>
            <button
              onClick={() => setActiveSubTab('children')}
              className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-lg font-bold text-sm transition ${
                activeSubTab === 'children' ? 'bg-white text-icsn-teal shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Baby className="w-4 h-4" />
              ข้อมูลนักเรียน
            </button>
          </div>

          {/* We reuse the existing components directly since we removed their outer panels */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden p-6">
             {activeSubTab === 'parents' ? <CreditsTab /> : <ChildrenTab />}
          </div>
        </div>
      </AdminPanel>
    </div>
  );
}

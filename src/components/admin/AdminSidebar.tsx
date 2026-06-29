"use client";

import React from 'react';
import {
  Calendar,
  CalendarCog,
  ReceiptText,
  Ticket,
  Baby,
  CalendarX,
  DownloadCloud,
  Package,
  Settings,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';
import type { AdminTab } from './admin-types';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  pendingSlipCount: number;
}

interface TabItem {
  id: AdminTab;
  label: string;
  sub: string;
  icon: React.ElementType;
  justifyBetween?: boolean;
}

const TABS: TabItem[] = [
  { id: 'dashboard', label: 'Dashboard', sub: 'ภาพรวมระบบ', icon: LayoutDashboard },
  { id: 'daily', label: 'Daily Schedule', sub: 'ตารางรายวัน', icon: Calendar },
  { id: 'calendar', label: 'Calendar & Rules', sub: 'ปฏิทิน/วันหยุด', icon: CalendarCog },
  { id: 'slips', label: 'Approve Slips', sub: 'อนุมัติหลักฐานสลิป', icon: ReceiptText, justifyBetween: true },
  { id: 'credits', label: 'Parents & Credits', sub: 'ผู้ปกครอง/เครดิต', icon: Ticket },
  { id: 'children', label: 'Children', sub: 'ข้อมูลนักเรียน', icon: Baby },
  { id: 'cancel', label: 'Override Cancel', sub: 'ยกเลิกแทนผู้ปกครอง', icon: CalendarX },
  { id: 'packages', label: 'Package Options', sub: 'จัดการแพ็กเกจ', icon: Package },
  { id: 'settings', label: 'System Settings', sub: 'ตั้งค่าระบบ', icon: Settings },
];

export function AdminSidebar({ activeTab, onTabChange, pendingSlipCount }: AdminSidebarProps) {
  return (
    <nav className="md:w-60 shrink-0 space-y-2 no-print">
      {TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition cursor-pointer ${
              tab.justifyBetween ? 'justify-between' : ''
            } ${
              isActive
                ? 'bg-icsn-teal text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200'
            }`}
          >
            <span className={`flex items-center gap-3 ${tab.justifyBetween ? '' : ''}`}>
              <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
              <span className="text-left">
                {tab.label}
                <br />
                <span
                  className={`font-normal opacity-80 mt-0.5 hidden md:block ${
                    isActive ? 'text-white/80' : 'text-gray-400'
                  }`}
                >
                  {tab.sub}
                </span>
              </span>
            </span>
            {tab.id === 'slips' && pendingSlipCount > 0 ? (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                  isActive ? 'bg-white text-emerald-600' : 'bg-rose-500 text-white'
                }`}
              >
                {pendingSlipCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}


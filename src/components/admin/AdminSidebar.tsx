"use client";

import React from 'react';
import {
  Calendar,
  ReceiptText,
  Ticket,
  CalendarX,
  DownloadCloud,
  Package,
} from 'lucide-react';
import type { AdminTab } from './admin-types';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  pendingSlipCount: number;
}

const TABS: {
  id: AdminTab;
  label: string;
  sub: string;
  icon: React.ElementType;
  justifyBetween?: boolean;
}[] = [
  { id: 'daily', label: 'Daily Schedule', sub: 'เธ•เธฒเธฃเธฒเธเธฃเธฒเธขเธงเธฑเธ', icon: Calendar },
  { id: 'slips', label: 'Approve Slips', sub: 'เธญเธเธธเธกเธฑเธ•เธดเธซเธฅเธฑเธเธเธฒเธเธชเธฅเธดเธ', icon: ReceiptText, justifyBetween: true },
  { id: 'credits', label: 'Manage Credits', sub: 'เธเธฑเธ”เธเธฒเธฃเธชเธดเธ—เธเธดเน', icon: Ticket },
  { id: 'cancel', label: 'Override Cancel', sub: 'เธขเธเน€เธฅเธดเธเนเธ—เธเธเธนเนเธเธเธเธฃเธญเธ', icon: CalendarX },
  { id: 'export', label: 'Export Data', sub: 'เธชเนเธเธญเธญเธเธเนเธญเธกเธนเธฅ', icon: DownloadCloud },
  { id: 'packages', label: 'Package Options', sub: 'เธเธฑเธ”เธเธฒเธฃเนเธเนเธเน€เธเธ', icon: Package },
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


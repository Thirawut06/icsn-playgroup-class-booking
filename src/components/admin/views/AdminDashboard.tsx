"use client";

import React from 'react';
import { Users, CalendarCheck, ReceiptText } from 'lucide-react';
import { CLASS_CONFIG } from '@/config/constants';
import { useAdminDashboard } from './dashboard/useAdminDashboard';
import { GoogleDriveIcon, GoogleSheetsIcon } from './dashboard/DashboardIcons';
import { StatCard } from './dashboard/StatCard';
import { QuickAction } from './dashboard/QuickAction';
import { RecentBookingsTable } from './dashboard/RecentBookingsTable';

export function AdminDashboard({ onNavigate }: {
  onRefresh?: () => void;
  onNavigate?: (tab: string) => void;
}) {
  const {
    stats,
    statsLoading,
    recentBookings,
    recentLoading,
    recentRef,
    quickActions,
    fetchRecentBookings,
  } = useAdminDashboard({ onNavigate, GoogleDriveIcon, GoogleSheetsIcon });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={CalendarCheck} color="blue"
          label="ยอดจองวันนี้" description="การจองเรียนใหม่"
          value={`${stats?.todayBookings ?? 0} / ${stats?.todayCapacity ?? CLASS_CONFIG.DEFAULT_CAPACITY} คน`}
          loading={statsLoading}
        />
        <StatCard
          icon={ReceiptText} color="amber"
          label="สลิปรอตรวจสอบ" description="ยอดโอนรอตรวจสอบ"
          value={`${stats?.pendingSlips ?? 0} รายการ`}
          loading={statsLoading}
        />
        <StatCard
          icon={Users} color="emerald"
          label="จำนวนเด็กในระบบ" description="ยอดนักเรียนรวมทั้งหมด"
          value={`${stats?.totalChildren ?? 0} คน`}
          loading={statsLoading}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4 font-outfit">
          Quick Actions <span className="font-sarabun text-sm font-normal text-muted-foreground ml-2">เมนูการจัดการด่วน</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* eslint-disable-next-line react-hooks/refs */}
          {quickActions.map((action) => (
            <QuickAction key={action.label} item={action} />
          ))}
        </div>
      </div>

      {/* Recent Bookings */}
      <div ref={recentRef}>
        <RecentBookingsTable
          bookings={recentBookings}
          loading={recentLoading}
          onRefresh={fetchRecentBookings}
        />
      </div>

    </div>
  );
}
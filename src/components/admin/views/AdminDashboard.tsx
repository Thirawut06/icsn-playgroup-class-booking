"use client";

import React, { useState, useEffect, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Users, CalendarCheck, ReceiptText, Loader2, CalendarOff, Clock } from 'lucide-react';
import { CLASS_CONFIG, BOOKING_STATUS } from '@/config/constants';
import { AdminService, BookingService, SettingsService } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  todayBookings: number;
  todayCapacity: number;
  pendingSlips: number;
  totalChildren: number;
}

interface RecentBooking {
  id: string;
  created_at: string;
  status: string;
  session_date: string;
  time_label: string | null;
  child_nickname: string;
  parent_name: string;
  parent_phone: string;
}

interface QuickActionItem {
  label: string;
  description: string;
  icon: LucideIcon;
  hoverBorder: string;
  hoverBg: string;
  hoverIcon: string;
  onClick: () => void;
  badge?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'เมื่อกี้';
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชม.ที่แล้ว`;
  return `${Math.floor(hrs / 24)} วันที่แล้ว`;
}

function formatThaiDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  blue:   'bg-info/10 text-info',
  amber:  'bg-warning/10 text-warning',
  emerald:'bg-success/10 text-success',
};

function StatCard({ icon: Icon, color, label, description, value, loading }: {
  icon: LucideIcon;
  color: string;
  label: string;
  description?: string;
  value: string | number;
  loading: boolean;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4 hover:shadow-md transition duration-300">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${COLOR_MAP[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wide">{label}</p>
        <div className="text-xl font-black text-foreground mt-0.5">
          {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/70 mt-1" /> : value}
        </div>
        {description && (
          <p className="text-[10px] text-muted-foreground/70 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

function QuickAction({ item }: { item: QuickActionItem }) {
  return (
    <button
      type="button"
      onClick={item.onClick}
      className={`relative bg-white border border-slate-200 ${item.hoverBorder} hover:shadow-md transition-all p-5 rounded-2xl flex flex-col items-center justify-center gap-3 text-center group cursor-pointer`}
    >
      {item.badge ? (
        <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm min-w-[20px] h-5 flex items-center justify-center">
          {item.badge}
        </span>
      ) : null}
      <div className={`w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center ${item.hoverBg} transition-colors`}>
        <item.icon className={`w-6 h-6 text-slate-600 ${item.hoverIcon}`} />
      </div>
      <div>
        <p className="font-bold text-slate-800 text-sm">{item.label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
      </div>
    </button>
  );
}

function RecentBookingsTable({ bookings, loading, onRefresh }: {
  bookings: RecentBooking[];
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-base">การจองล่าสุด (15 รายการ)</h3>
        <button onClick={onRefresh} className="text-sm text-icsn-teal font-semibold hover:underline">
          รีเฟรช
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : bookings.length === 0 ? (
        <p className="text-center py-12 text-slate-500 text-base">ยังไม่มีการจองในระบบ</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-2">สถานะ</th>
                <th className="px-4 py-2">เด็ก</th>
                <th className="px-4 py-2">ผู้ปกครอง</th>
                <th className="px-4 py-2">เบอร์</th>
                <th className="px-4 py-2">วันที่</th>
                <th className="px-4 py-2">รอบ</th>
                <th className="px-4 py-2">จองเมื่อ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => {
                const isConfirmed = b.status === BOOKING_STATUS.CONFIRMED;
                const isCancelled = b.status === BOOKING_STATUS.CANCELLED;
                return (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-semibold whitespace-nowrap">
                      <span className={isConfirmed ? 'text-emerald-600' : isCancelled ? 'text-red-500' : 'text-slate-400'}>
                        {isConfirmed ? '✓ จอง' : isCancelled ? '✕ ยกเลิก' : b.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-800 whitespace-nowrap">{b.child_nickname}</td>
                    <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{b.parent_name}</td>
                    <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{b.parent_phone}</td>
                    <td className="px-4 py-2 text-slate-600 whitespace-nowrap">
                      {b.session_date ? formatThaiDate(b.session_date) : '-'}
                    </td>
                    <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{b.time_label || '-'}</td>
                    <td className="px-4 py-2 text-slate-400 whitespace-nowrap">{formatTimeAgo(b.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminDashboard({ onNavigate }: {
  onRefresh?: () => void;
  onNavigate?: (tab: string) => void;
}) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const recentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStats();
    fetchRecentBookings();
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      // Parallelise independent API calls
      const [sessions, pendingSlips, children, settings] = await Promise.all([
        BookingService.getSessions(today, today),
        AdminService.getPendingSlips(),
        AdminService.getAllChildren(),
        SettingsService.getAllSettings(),
      ]);
      const defaultCapacity = settings?.default_capacity || CLASS_CONFIG.DEFAULT_CAPACITY;
      setStats({
        todayBookings: sessions[0]?.booked_count || 0,
        todayCapacity: sessions[0]?.total_capacity || defaultCapacity,
        pendingSlips: pendingSlips.length,
        totalChildren: children.length,
      });
    } catch (err) {
      console.error('[AdminDashboard] fetchStats error:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchRecentBookings = async () => {
    setRecentLoading(true);
    try {
      const bookings = await AdminService.getRecentBookings(15);
      setRecentBookings(bookings);
    } catch (err) {
      console.error('[AdminDashboard] fetchRecentBookings error:', err);
    } finally {
      setRecentLoading(false);
    }
  };

  const quickActions: QuickActionItem[] = [
    {
      label: 'จัดการรอบเรียนวันนี้',
      description: 'เช็คอิน / เพิ่ม Walk-in',
      icon: CalendarCheck,
      hoverBorder: 'hover:border-icsn-teal/50',
      hoverBg: 'group-hover:bg-icsn-teal/10',
      hoverIcon: 'group-hover:text-icsn-teal',
      onClick: () => onNavigate?.('daily_ops'),
    },
    {
      label: 'ตรวจสอบสลิปเงิน',
      description: 'อนุมัติเครดิตแพ็กเกจใหม่',
      icon: ReceiptText,
      hoverBorder: 'hover:border-amber-400/50',
      hoverBg: 'group-hover:bg-amber-100',
      hoverIcon: 'group-hover:text-amber-600',
      badge: stats?.pendingSlips || 0,
      onClick: () => onNavigate?.('slips'),
    },
    {
      label: 'ฐานข้อมูลครอบครัว',
      description: 'ดูรายชื่อและสถิติการจอง',
      icon: Users,
      hoverBorder: 'hover:border-blue-400/50',
      hoverBg: 'group-hover:bg-blue-50',
      hoverIcon: 'group-hover:text-blue-600',
      onClick: () => onNavigate?.('users'),
    },
    {
      label: 'ประกาศวันหยุด',
      description: 'ตั้งค่าและแจ้งปิดคลาส',
      icon: CalendarOff,
      hoverBorder: 'hover:border-red-400/50',
      hoverBg: 'group-hover:bg-red-50',
      hoverIcon: 'group-hover:text-red-600',
      onClick: () => onNavigate?.('holidays'),
    },
    {
      label: 'การจองล่าสุด',
      description: 'ดูประวัติการจองล่าสุด 15 รายการ',
      icon: Clock,
      hoverBorder: 'hover:border-purple-400/50',
      hoverBg: 'group-hover:bg-purple-50',
      hoverIcon: 'group-hover:text-purple-600',
      onClick: () => recentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    },
  ];

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
        <h3 className="text-lg font-bold text-slate-800 mb-4 font-outfit">
          Quick Actions <span className="font-sarabun text-sm font-normal text-slate-500 ml-2">เมนูการจัดการด่วน</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

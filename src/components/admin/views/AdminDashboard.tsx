"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Users, CalendarCheck, ReceiptText, Loader2, CalendarOff, Clock, type LucideIcon } from 'lucide-react';
import { CLASS_CONFIG, BOOKING_STATUS } from '@/config/constants';
import { AdminService, BookingService, SettingsService } from '@/lib/supabase';

const GoogleDriveIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 800 741.3696" fill="none" xmlns="http://www.w3.org/2000/svg">
    <mask id="drive-mask" width="168" height="154" x="12" y="18" maskUnits="userSpaceOnUse">
      <path fill="#fff" d="M63.09 37c14.626-25.333 51.193-25.334 65.819 0l45.033 78c14.626 25.334-3.657 57.001-32.91 57.001H50.967c-29.253 0-47.536-31.667-32.91-57.001Z"/>
    </mask>
    <g mask="url(#drive-mask)" transform="matrix(4.8140532,0,0,4.8140532,-62.146701,-86.652356)">
      <path fill="url(#drive-b)" d="M206.905 172.02h-91.888l-19.015-32.934 45.944-79.578Z"/>
      <path fill="url(#drive-c)" d="M-14.919 172.006 50.04 59.494v.002L31.032 92.422h38.02L115 172.004l-129.918.001Z"/>
      <path fill="url(#drive-d)" d="M96.007-20.085 141.954 59.5l-19.011 32.928H31.048Z"/>
    </g>
    <defs>
      <linearGradient id="drive-b" x1="193.6" x2="103.09" y1="165.6" y2="111.21" gradientUnits="userSpaceOnUse">
        <stop offset=".09" stopColor="#ffe921"/>
        <stop offset="1" stopColor="#fec700"/>
      </linearGradient>
      <linearGradient id="drive-c" x1="114.4" x2="15.53" y1="181.61" y2="121.8" gradientUnits="userSpaceOnUse">
        <stop offset=".15" stopColor="#a9a8ff"/>
        <stop offset=".33" stopColor="#6d97ff"/>
        <stop offset=".48" stopColor="#3186ff"/>
      </linearGradient>
      <linearGradient id="drive-d" x1="128.88" x2="28.7" y1="37.88" y2="84.64" gradientUnits="userSpaceOnUse">
        <stop offset=".55" stopColor="#0ebc5f"/>
        <stop offset=".85" stopColor="#78c9ff"/>
      </linearGradient>
    </defs>
  </svg>
);

const GoogleSheetsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 800 581.8182" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="#009954" d="M0 193.6364c0-40.65 0-60.9773 6.3818-77.1a90.91 90.91 0 0 1 51.0637-51.0591c16.1227-6.3864 36.4454-6.3864 77.1-6.3864H410.909c40.65 0 60.9773 0 77.1 6.3818a90.91 90.91 0 0 1 51.0636 51.0637c6.3818 16.1227 6.3818 36.4454 6.3818 77.1v194.5454c0 40.65 0 60.9773-6.3818 77.1a90.91 90.91 0 0 1-51.0636 51.0637c-16.1227 6.3818-36.45 6.3818-77.1 6.3818H134.5454c-40.65 0-60.9772 0-77.1045-6.3818a90.91 90.91 0 0 1-51.059-51.0637C0 449.1591 0 428.8318 0 388.1818Z"/>
    <mask id="sheets-mask" width="160" height="128" x="24" y="32" maskUnits="userSpaceOnUse">
      <rect width="160" height="128" x="24" y="32" fill="#fff" rx="20"/>
    </mask>
    <g mask="url(#sheets-mask)" transform="matrix(4.5454545,0,0,4.5454545,-36.363636,-145.45454)">
      <path fill="#0ebc5f" d="M24 32h160v128H24Z"/>
      <g filter="url(#sheets-filter)">
        <rect width="144" height="102" fill="url(#sheets-c)" rx="25.6" transform="matrix(1,0,0,-1,8,147)" x="0" y="0"/>
      </g>
    </g>
    <path stroke="#ffffff" strokeLinecap="round" strokeWidth="54.5455" d="M327.2727 404.5455H709.091m-90.909 86.3636v-290.909"/>
    <defs>
      <linearGradient id="sheets-c" x1="122.24" x2="20.76" y1="43.31" y2="43.31" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0ebc5f"/>
        <stop offset=".95" stopColor="#78c9ff"/>
      </linearGradient>
      <filter id="sheets-filter" width="168" height="126" x="-4" y="33" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" mode="normal"/>
        <feGaussianBlur result="effect1_foregroundBlur_37435_8174" stdDeviation="6"/>
      </filter>
    </defs>
  </svg>
);

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
  icon: React.ElementType;
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
      className={`relative bg-white border border-border ${item.hoverBorder} hover:shadow-md transition-all p-5 rounded-2xl flex flex-col items-center justify-center gap-3 text-center group cursor-pointer`}
    >
      {item.badge ? (
        <span className="absolute top-3 right-3 bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm min-w-[20px] h-5 flex items-center justify-center">
          {item.badge}
        </span>
      ) : null}
      <div className={`w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center ${item.hoverBg} transition-colors`}>
        <item.icon className={`w-6 h-6 text-foreground/80 ${item.hoverIcon}`} />
      </div>
      <div>
        <p className="font-bold text-foreground text-sm">{item.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
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
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-foreground text-base">การจองล่าสุด (15 รายการ)</h3>
        <button onClick={onRefresh} className="text-sm text-icsn-teal font-semibold hover:underline">
          รีเฟรช
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/70" />
        </div>
      ) : bookings.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground text-base">ยังไม่มีการจองในระบบ</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">
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
                  <tr key={b.id} className="hover:bg-muted/50">
                    <td className="px-4 py-2 font-semibold whitespace-nowrap">
                      <span className={isConfirmed ? 'text-success' : isCancelled ? 'text-error' : 'text-muted-foreground/70'}>
                        {isConfirmed ? '✓ จอง' : isCancelled ? '✕ ยกเลิก' : b.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-medium text-foreground whitespace-nowrap">{b.child_nickname}</td>
                    <td className="px-4 py-2 text-foreground/80 whitespace-nowrap">{b.parent_name}</td>
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{b.parent_phone}</td>
                    <td className="px-4 py-2 text-foreground/80 whitespace-nowrap">
                      {b.session_date ? formatThaiDate(b.session_date) : '-'}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{b.time_label || '-'}</td>
                    <td className="px-4 py-2 text-muted-foreground/70 whitespace-nowrap">{formatTimeAgo(b.created_at)}</td>
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

  useEffect(() => {
    fetchStats();
    fetchRecentBookings();
  }, []);

  const handleScrollToRecent = React.useCallback(() => {
    if (recentRef.current) {
      recentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const quickActions: QuickActionItem[] = React.useMemo(() => [
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
      hoverBorder: 'hover:border-info/50/50',
      hoverBg: 'group-hover:bg-info/10',
      hoverIcon: 'group-hover:text-info',
      onClick: () => onNavigate?.('users'),
    },
    {
      label: 'ประกาศวันหยุด',
      description: 'ตั้งค่าและแจ้งปิดคลาส',
      icon: CalendarOff,
      hoverBorder: 'hover:border-error/50/50',
      hoverBg: 'group-hover:bg-error/10',
      hoverIcon: 'group-hover:text-error',
      onClick: () => onNavigate?.('holidays'),
    },
    {
      label: 'การจองล่าสุด',
      description: 'ดูประวัติการจองล่าสุด 15 รายการ',
      icon: Clock,
      hoverBorder: 'hover:border-accent/50/50',
      hoverBg: 'group-hover:bg-accent/10',
      hoverIcon: 'group-hover:text-accent',
      onClick: handleScrollToRecent,
    },
    {
      label: 'Google Drive จัดเก็บไฟล์',
      description: 'สลิป รูปโปรไฟล์ และลายเซ็น',
      icon: GoogleDriveIcon,
      hoverBorder: 'hover:border-blue-400/50',
      hoverBg: 'group-hover:bg-blue-100',
      hoverIcon: 'group-hover:text-blue-600',
      onClick: () => window.open('https://drive.google.com/drive/u/0/folders/1x32LC1rL7AmB8IO_e2jIqr7oJrFGRiHX', '_blank'),
    },
    {
      label: 'Google Sheets ฐานข้อมูล',
      description: 'ข้อมูลผู้เรียน ยอดคงเหลือ และประวัติ',
      icon: GoogleSheetsIcon,
      hoverBorder: 'hover:border-green-400/50',
      hoverBg: 'group-hover:bg-green-100',
      hoverIcon: 'group-hover:text-green-600',
      onClick: () => window.open('https://docs.google.com/spreadsheets/d/1Draw8NNSHk7rv11YF_uDTGQcNc_0qFnNJfnyrFHK16A/edit?gid=1687370883#gid=1687370883', '_blank'),
    },
  ], [onNavigate, stats?.pendingSlips, handleScrollToRecent]);

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

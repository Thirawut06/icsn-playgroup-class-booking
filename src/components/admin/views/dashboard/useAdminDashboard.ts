import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CLASS_CONFIG } from '@/config/constants';
import { AdminService, BookingService, SettingsService } from '@/lib/supabase';
import { Users, CalendarCheck, ReceiptText, CalendarOff, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface DashboardStats {
  todayBookings: number;
  todayCapacity: number;
  pendingSlips: number;
  totalChildren: number;
}

export interface RecentBooking {
  id: string;
  created_at: string;
  status: string;
  session_date: string;
  time_label: string | null;
  child_nickname: string;
  parent_name: string;
  parent_phone: string;
}

export interface QuickActionItem {
  label: string;
  description: string;
  icon: LucideIcon | React.ElementType;
  hoverBorder: string;
  hoverBg: string;
  hoverIcon: string;
  onClick: () => void;
  badge?: number;
}

interface UseAdminDashboardProps {
  onNavigate?: (tab: string) => void;
  GoogleDriveIcon: React.ElementType;
  GoogleSheetsIcon: React.ElementType;
}

export function useAdminDashboard({ onNavigate, GoogleDriveIcon, GoogleSheetsIcon }: UseAdminDashboardProps) {
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
      // Cast is needed because the types from supabase may not exactly match RecentBooking, but we know they do based on the query.
      setRecentBookings(bookings as any as RecentBooking[]);
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

  const handleScrollToRecent = useCallback(() => {
    if (recentRef.current) {
      recentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const quickActions: QuickActionItem[] = useMemo(() => [
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
  ], [onNavigate, stats?.pendingSlips, handleScrollToRecent, GoogleDriveIcon, GoogleSheetsIcon]);

  return {
    stats,
    statsLoading,
    recentBookings,
    recentLoading,
    recentRef,
    quickActions,
    fetchRecentBookings,
  };
}

import { LayoutDashboard, ReceiptText, Users, Settings, Clock, CalendarDays, Package, CalendarCog } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AdminTabId = 'dashboard' | 'daily_ops' | 'slips' | 'users' | 'packages' | 'timeslot' | 'holidays' | 'settings';

export type NavGroup = 'Daily Operations' | 'Users & Sales' | 'Configurations';

export interface NavItem {
  id: AdminTabId;
  label: string;
  icon: LucideIcon;
  description: string;
  requiredRole: 'admin' | 'staff';
  group: NavGroup;
}

export const ADMIN_NAV_SCHEMA: NavItem[] = [
  // --- Daily Operations ---
  {
    id: 'dashboard',
    label: 'Dashboard Overview',
    icon: LayoutDashboard,
    description: 'ภาพรวมสถิติรายวันและการเงิน',
    requiredRole: 'admin',
    group: 'Daily Operations',
  },
  {
    id: 'daily_ops',
    label: 'Daily Operations',
    icon: CalendarDays,
    description: 'การจัดการรอบรายวันและการเช็คชื่อ',
    requiredRole: 'staff',
    group: 'Daily Operations',
  },
  {
    id: 'slips',
    label: 'Approve Slips',
    icon: ReceiptText,
    description: 'ตรวจสอบและอนุมัติสลิปโอนเงิน',
    requiredRole: 'admin',
    group: 'Daily Operations',
  },

  // --- Users & Sales ---
  {
    id: 'users',
    label: 'Users & Credits',
    icon: Users,
    description: 'จัดการผู้ปกครอง, นักเรียน, และเครดิต',
    requiredRole: 'admin',
    group: 'Users & Sales',
  },
  {
    id: 'packages',
    label: 'Packages & Pricing',
    icon: Package,
    description: 'ตั้งค่าแพ็กเกจราคา',
    requiredRole: 'admin',
    group: 'Users & Sales',
  },

  // --- Configurations ---
  {
    id: 'timeslot',
    label: 'Time Slots',
    icon: Clock,
    description: 'ตั้งค่าช่วงเวลาเรียน (Time Slots)',
    requiredRole: 'admin',
    group: 'Configurations',
  },
  {
    id: 'holidays',
    label: 'Holidays & Closures',
    icon: CalendarCog,
    description: 'ตั้งค่าวันหยุดยาวและปิดปรับปรุง',
    requiredRole: 'admin',
    group: 'Configurations',
  },
  {
    id: 'settings',
    label: 'System Settings',
    icon: Settings,
    description: 'ตั้งค่าระบบทั่วไป',
    requiredRole: 'admin',
    group: 'Configurations',
  }
];

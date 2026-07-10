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
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'ภาพรวมระบบและการจองล่าสุด',
    requiredRole: 'admin',
    group: 'Daily Operations',
  },
  {
    id: 'daily_ops',
    label: 'Daily Operations',
    icon: CalendarDays,
    description: 'จัดการรอบรายวัน เช็คชื่อ เช็คโควต้า',
    requiredRole: 'staff',
    group: 'Daily Operations',
  },
  {
    id: 'slips',
    label: 'Payments',
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
    description: 'จัดการข้อมูลผู้ปกครอง เด็ก และเครดิต',
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
    description: 'จัดการตั้งค่าช่วงเวลาเรียน (Time Slots)',
    requiredRole: 'admin',
    group: 'Configurations',
  },
  {
    id: 'holidays',
    label: 'Calendar & Holidays',
    icon: CalendarCog,
    description: 'จัดการวันเปิด-ปิด วันหยุด และความจุ Trial',
    requiredRole: 'admin',
    group: 'Configurations',
  },
  {
    id: 'settings',
    label: 'General Settings',
    icon: Settings,
    description: 'ตั้งค่าระบบ Line Alert และ Webhook ต่างๆ',
    requiredRole: 'admin',
    group: 'Configurations',
  }
];

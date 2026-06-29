import { LayoutDashboard, ReceiptText, Users, Settings, Clock, CalendarDays } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AdminTabId = 'dashboard' | 'daily_ops' | 'slips' | 'users' | 'settings' | 'timeslot';

export interface NavItem {
  id: AdminTabId;
  label: string;
  icon: LucideIcon;
  description: string;
  requiredRole: 'admin' | 'staff'; // Example of visibility/permission rules
}

export const ADMIN_NAV_SCHEMA: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard Overview',
    icon: LayoutDashboard,
    description: 'ภาพรวมสถิติรายวันและการเงิน',
    requiredRole: 'admin',
  },
  {
    id: 'daily_ops',
    label: 'Daily Operations',
    icon: CalendarDays,
    description: 'การจัดการรอบรายวันและการเช็คชื่อ',
    requiredRole: 'staff',
  },
  {
    id: 'slips',
    label: 'Approve Slips',
    icon: ReceiptText,
    description: 'ตรวจสอบและอนุมัติสลิปโอนเงิน',
    requiredRole: 'admin',
  },
  {
    id: 'users',
    label: 'Users & Credits',
    icon: Users,
    description: 'จัดการผู้ปกครอง, นักเรียน, และเครดิต',
    requiredRole: 'admin',
  },
  {
    id: 'settings',
    label: 'System Settings',
    icon: Settings,
    description: 'ตั้งค่าระบบ, วันหยุด, และแพ็กเกจ',
    requiredRole: 'admin',
  },
  {
    id: 'timeslot',
    label: 'Time Slots',
    icon: Clock,
    description: 'ตั้งค่าช่วงเวลา (Time Slots)',
    requiredRole: 'admin',
  }
];

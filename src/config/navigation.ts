import { LayoutDashboard, ReceiptText, Users, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AdminTabId = 'dashboard' | 'slips' | 'users' | 'settings';

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
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'ภาพรวมรายวัน การเช็คชื่อ และการจัดการ Walk-in',
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
  }
];

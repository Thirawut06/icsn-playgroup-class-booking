"use client";

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, CreditCard, ReceiptText, CalendarCheck, Loader2 } from 'lucide-react';
import { AdminService, BookingService, PackageService } from '@/lib/supabase';
import { AdminPanel, AdminPanelHeader } from './admin-ui';

interface DashboardStats {
  todayBookings: number;
  todayCapacity: number;
  pendingSlips: number;
  totalChildren: number;
  activePackages: number;
}

export function DashboardTab() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // 1. Today's Bookings
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;
      
      const sessions = await BookingService.getSessions(todayStr, todayStr);
      const todaySession = sessions[0];
      
      // 2. Pending Slips
      const pendingSlips = await AdminService.getPendingSlips();
      
      // 3. Total Children (mock for now if no direct count API, we can fetch all and get length)
      const children = await AdminService.getAllChildren();
      
      // 4. Parents / Packages (we can just show total parents from credits tab)
      const parents = await AdminService.getAllParentsWithCredits();
      
      setStats({
        todayBookings: todaySession?.booked_count || 0,
        todayCapacity: todaySession?.total_capacity || 15,
        pendingSlips: pendingSlips.length,
        totalChildren: children.length,
        activePackages: parents.length,
      });
    } catch (err) {
      console.error('Error fetching dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminPanel className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-icsn-teal" />
      </AdminPanel>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPanelHeader
        icon={LayoutDashboard}
        title="ภาพรวมระบบ (Dashboard Overview)"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Card 1 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">ยอดจองวันนี้</p>
            <h4 className="text-2xl font-bold text-gray-900">
              {stats?.todayBookings} <span className="text-sm font-normal text-gray-500">/ {stats?.todayCapacity} คน</span>
            </h4>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <ReceiptText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">สลิปรอตรวจสอบ</p>
            <h4 className="text-2xl font-bold text-gray-900">
              {stats?.pendingSlips} <span className="text-sm font-normal text-gray-500">รายการ</span>
            </h4>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">จำนวนเด็กในระบบ</p>
            <h4 className="text-2xl font-bold text-gray-900">
              {stats?.totalChildren} <span className="text-sm font-normal text-gray-500">คน</span>
            </h4>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">ครอบครัวที่ใช้งาน</p>
            <h4 className="text-2xl font-bold text-gray-900">
              {stats?.activePackages} <span className="text-sm font-normal text-gray-500">ครอบครัว</span>
            </h4>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-gray-500">
        <LayoutDashboard className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <h3 className="text-lg font-bold text-gray-700">ICSN Playgroup Admin System</h3>
        <p className="text-sm mt-1">เลือกเมนูด้านซ้ายเพื่อเริ่มต้นจัดการข้อมูล</p>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { CalendarDays, Printer, Users, XCircle, Power, LayoutDashboard, CalendarCheck, ReceiptText, CreditCard, Loader2 } from 'lucide-react';
import { CLASS_CONFIG } from '@/config/constants';
import { COPY } from '@/config/copy';
import { AdminEmptyState, AdminFieldLabel, AdminPanel, AdminPanelHeader } from '../admin-ui';
import { formatAgeDisplay, formatThaiFullDate } from '../admin-utils';
import { useDailyAttendance } from '@/hooks/useDailyAttendance';
import { AdminService, BookingService, SettingsService } from '@/lib/supabase';

interface DashboardStats {
  todayBookings: number;
  todayCapacity: number;
  pendingSlips: number;
  totalChildren: number;
  activePackages: number;
}

export function AdminDashboard({ onRefresh }: { onRefresh?: () => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const {
    dailyDate,
    setDailyDate,
    attendance,
    loading,
    walkinPhone,
    setWalkinPhone,
    walkinName,
    setWalkinName,
    walkinFree,
    setWalkinFree,
    walkinLoading,
    capacityEdit,
    setCapacityEdit,
    savingCapacity,
    bookedCount,
    totalCapacity,
    sessionIsActive,
    togglingSession,
    handleWalkin,
    handleCancel,
    handleSaveCapacity,
    handleToggleSession,
  } = useDailyAttendance({ onRefresh });

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyDate]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const sessions = await BookingService.getSessions(dailyDate, dailyDate);
      const todaySession = sessions[0];
      const pendingSlips = await AdminService.getPendingSlips();
      const children = await AdminService.getAllChildren();
      const parents = await AdminService.getAllParentsWithCredits();
      const settings = await SettingsService.getAllSettings();
      const defaultCapacity = settings?.default_capacity || CLASS_CONFIG.DEFAULT_CAPACITY;
      
      setStats({
        todayBookings: todaySession?.booked_count || 0,
        todayCapacity: todaySession?.total_capacity || defaultCapacity,
        pendingSlips: pendingSlips.length,
        totalChildren: children.length,
        activePackages: parents.length,
      });
    } catch (err) {
      console.error('Error fetching dashboard stats', err);
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Top Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarCheck} color="blue" label="ยอดจองวันนี้" description="การจองเรียนใหม่" value={`${stats?.todayBookings || 0} / ${stats?.todayCapacity || CLASS_CONFIG.DEFAULT_CAPACITY} คน`} loading={statsLoading} />
        <StatCard icon={ReceiptText} color="amber" label="สลิปรอตรวจสอบ" description="ยอดโอนรอตรวจสอบ" value={`${stats?.pendingSlips || 0} รายการ`} loading={statsLoading} />
        <StatCard icon={Users} color="emerald" label="จำนวนเด็กในระบบ" description="ยอดนักเรียนรวมทั้งหมดในระบบ" value={`${stats?.totalChildren || 0} คน`} loading={statsLoading} />
        <StatCard icon={CreditCard} color="purple" label="ครอบครัวที่ใช้งาน" description="จำนวนครอบครัวทั้งหมดในระบบ" value={`${stats?.activePackages || 0} ครอบครัว`} loading={statsLoading} />
      </div>

      <AdminPanel className="no-print">
        <AdminPanelHeader icon={LayoutDashboard} title="ภาพรวมรายวัน (Daily Overview)" />

        <div className="p-6 space-y-6">
          {/* Controls */}
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-end border-b border-gray-100 pb-6">
            
            {/* Date Selection */}
            <div className="w-full lg:w-64">
              <AdminFieldLabel>เลือกวันที่</AdminFieldLabel>
              <input
                type="date"
                value={dailyDate}
                onChange={e => setDailyDate(e.target.value)}
                className="block w-full px-4 h-[48px] border border-gray-200 rounded-xl focus:border-icsn-teal focus:ring-1 focus:ring-icsn-teal outline-none bg-white text-gray-800 transition shadow-sm font-semibold cursor-pointer"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-end gap-4 w-full lg:w-auto mt-4 lg:mt-0">
              
              {/* Capacity Control */}
              <div>
                <AdminFieldLabel>ความจุ (ที่นั่ง)</AdminFieldLabel>
                <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-icsn-teal focus-within:border-icsn-teal transition bg-white h-[48px] shadow-sm">
                  <input
                    type="number"
                    min={1}
                    value={capacityEdit}
                    onChange={e => setCapacityEdit(e.target.value)}
                    className="w-16 px-2 text-center font-bold outline-none text-gray-800 border-none bg-transparent"
                    title="จำนวนที่นั่งสูงสุด"
                  />
                  <button 
                    onClick={handleSaveCapacity} 
                    disabled={savingCapacity}
                    className="px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold border-l border-gray-200 transition disabled:opacity-50 cursor-pointer text-sm"
                  >
                    บันทึก
                  </button>
                </div>
              </div>

              {/* Session Control */}
              <div>
                <AdminFieldLabel>สถานะรับจอง</AdminFieldLabel>
                <button
                  onClick={handleToggleSession}
                  disabled={togglingSession}
                  className={`flex items-center justify-center gap-2 px-5 h-[48px] rounded-xl font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 border ${
                    sessionIsActive 
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200' 
                      : 'bg-emerald-500 text-white hover:bg-emerald-600 border-transparent'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  {sessionIsActive ? 'ปิดรับจอง' : 'เปิดรับจอง'}
                </button>
              </div>

              {/* Print Action */}
              <div>
                <AdminFieldLabel>ระบบเอกสาร</AdminFieldLabel>
                <button 
                  onClick={() => window.print()} 
                  className="flex items-center justify-center gap-2 px-5 h-[48px] bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold transition shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-icsn-teal" /> พิมพ์
                </button>
              </div>
            </div>
          </div>

          {!sessionIsActive && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl font-bold flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 bg-rose-200 text-rose-800 rounded-full shrink-0">!</span>
              คลาสวันนี้ถูกปิดรับจองชั่วคราว
            </div>
          )}

          {/* Add Walk-in */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-icsn-teal" /> เพิ่ม Walk-in (หน้างาน)
            </h3>
            <form onSubmit={handleWalkin} className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <input type="text" required value={walkinPhone} onChange={e => setWalkinPhone(e.target.value)} placeholder="เบอร์โทรศัพท์ (08XXXXXXXX)" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-icsn-teal outline-none" />
              </div>
              <div className="flex-1 w-full">
                <input type="text" required value={walkinName} onChange={e => setWalkinName(e.target.value)} placeholder="ชื่อเล่นน้อง" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-icsn-teal outline-none" />
              </div>
              <button type="submit" disabled={walkinLoading} className="w-full md:w-auto px-6 py-3 bg-icsn-navy hover:bg-icsn-navy/90 text-white rounded-xl font-bold shadow-sm transition disabled:opacity-50 cursor-pointer whitespace-nowrap">
                + เพิ่มนักเรียน
              </button>
            </form>
          </div>

          {/* Attendance Table */}
          {loading ? (
            <div className="flex justify-center items-center h-32"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : attendance.length === 0 ? (
            <AdminEmptyState message={COPY.EMPTY_STATES.NO_STUDENTS} />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
              <table className="w-full text-left text-sm bg-white">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
                    <th className="px-4 py-3">ชื่อเล่น (Nickname)</th>
                    <th className="px-4 py-3">อายุ (Age)</th>
                    <th className="px-4 py-3">แพ้อาหาร (Allergies)</th>
                    <th className="px-4 py-3">ผู้ปกครอง (Parent)</th>
                    <th className="px-4 py-3 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendance.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3 font-bold text-gray-900">{row.nickname}</td>
                      <td className="px-4 py-3 text-gray-600">{formatAgeDisplay(row.age)}</td>
                      <td className="px-4 py-3">
                        {row.food_allergy ? <span className="text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded-md text-xs uppercase">{row.food_allergy}</span> : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-800">{row.parent_name}</div>
                        <div className="text-xs text-gray-500">{row.parent_phone}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleCancel(row.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer" title="ยกเลิกจอง">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminPanel>
    </div>
  );
}

function StatCard({ icon: Icon, color, label, description, value, loading }: { icon: any, color: string, label: string, description?: string, value: string | number, loading: boolean }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition duration-300">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide" title={description}>{label}</p>
        <div className="text-xl font-black text-gray-800 mt-0.5">
          {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-300 mt-1" /> : value}
        </div>
        {description && (
          <p className="text-[10px] text-gray-400 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

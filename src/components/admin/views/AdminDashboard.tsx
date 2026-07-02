"use client";

import React, { useState, useEffect } from 'react';
import { Users, CalendarCheck, ReceiptText, Loader2, CalendarOff } from 'lucide-react';
import { CLASS_CONFIG } from '@/config/constants';
import { AdminService, BookingService, SettingsService } from '@/lib/supabase';

interface DashboardStats {
  todayBookings: number;
  todayCapacity: number;
  pendingSlips: number;
  totalChildren: number;
  activePackages: number;
}

export function AdminDashboard({ onRefresh, onNavigate }: { onRefresh?: () => void, onNavigate?: (tab: string) => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const sessions = await BookingService.getSessions(today, today);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={CalendarCheck} color="blue" label="ยอดจองวันนี้" description="การจองเรียนใหม่" value={`${stats?.todayBookings || 0} / ${stats?.todayCapacity || CLASS_CONFIG.DEFAULT_CAPACITY} คน`} loading={statsLoading} />
        <StatCard icon={ReceiptText} color="amber" label="สลิปรอตรวจสอบ" description="ยอดโอนรอตรวจสอบ" value={`${stats?.pendingSlips || 0} รายการ`} loading={statsLoading} />
        <StatCard icon={Users} color="emerald" label="จำนวนเด็กในระบบ" description="ยอดนักเรียนรวมทั้งหมดในระบบ" value={`${stats?.totalChildren || 0} คน`} loading={statsLoading} />
      </div>

      {/* Quick Action Buttons */}
      <div className="mt-8 pt-4">
        <h3 className="text-lg font-bold text-slate-800 mb-4 font-outfit">
          Quick Actions <span className="font-sarabun text-sm font-normal text-slate-500 ml-2">เมนูการจัดการด่วน</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <button onClick={() => onNavigate?.('daily_ops')} className="bg-white border border-slate-200 hover:border-icsn-teal/50 hover:shadow-md transition-all p-5 rounded-2xl flex flex-col items-center justify-center gap-3 text-center group cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-icsn-teal/10 transition-colors">
              <CalendarCheck className="w-6 h-6 text-slate-600 group-hover:text-icsn-teal" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">จัดการรอบเรียนวันนี้</p>
              <p className="text-xs text-slate-500 mt-0.5">เช็คอิน / เพิ่ม Walk-in</p>
            </div>
          </button>

          <button onClick={() => onNavigate?.('slips')} className="bg-white border border-slate-200 hover:border-amber-400/50 hover:shadow-md transition-all p-5 rounded-2xl flex flex-col items-center justify-center gap-3 text-center group cursor-pointer relative">
            {stats?.pendingSlips ? (
              <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center justify-center min-w-[20px] h-5">
                {stats.pendingSlips}
              </span>
            ) : null}
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <ReceiptText className="w-6 h-6 text-slate-600 group-hover:text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">ตรวจสอบสลิปเงิน</p>
              <p className="text-xs text-slate-500 mt-0.5">อนุมัติเครดิตแพ็กเกจใหม่</p>
            </div>
          </button>

          <button onClick={() => onNavigate?.('users')} className="bg-white border border-slate-200 hover:border-blue-400/50 hover:shadow-md transition-all p-5 rounded-2xl flex flex-col items-center justify-center gap-3 text-center group cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
              <Users className="w-6 h-6 text-slate-600 group-hover:text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">ฐานข้อมูลครอบครัว</p>
              <p className="text-xs text-slate-500 mt-0.5">ดูรายชื่อและสถิติการจอง</p>
            </div>
          </button>

          <button onClick={() => onNavigate?.('holidays')} className="bg-white border border-slate-200 hover:border-red-400/50 hover:shadow-md transition-all p-5 rounded-2xl flex flex-col items-center justify-center gap-3 text-center group cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-red-50 transition-colors">
              <CalendarOff className="w-6 h-6 text-slate-600 group-hover:text-red-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">ประกาศวันหยุด</p>
              <p className="text-xs text-slate-500 mt-0.5">ตั้งค่าและแจ้งปิดคลาส</p>
            </div>
          </button>
          
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, color, label, description, value, loading }: { icon: any, color: string, label: string, description?: string, value: string | number, loading: boolean }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-info/10 text-info',
    amber: 'bg-warning/10 text-warning',
    emerald: 'bg-success/10 text-success',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4 hover:shadow-md transition duration-300">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wide" title={description}>{label}</p>
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

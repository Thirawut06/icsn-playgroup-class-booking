"use client";

import React, { useState, useEffect } from 'react';
import { CalendarDays, Users, LayoutDashboard, CalendarCheck, ReceiptText, CreditCard, Loader2 } from 'lucide-react';
import { CLASS_CONFIG } from '@/config/constants';
import { AdminPanel, AdminPanelHeader } from '../admin-ui';
import { AdminService, BookingService, SettingsService } from '@/lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

interface DashboardStats {
  todayBookings: number;
  todayCapacity: number;
  pendingSlips: number;
  totalChildren: number;
  activePackages: number;
}

// Mock Data for Charts
const weeklyAttendanceData = [
  { name: 'Mon', count: 12 },
  { name: 'Tue', count: 15 },
  { name: 'Wed', count: 10 },
  { name: 'Thu', count: 18 },
  { name: 'Fri', count: 14 },
  { name: 'Sat', count: 25 },
  { name: 'Sun', count: 20 },
];

const creditUsageData = [
  { name: 'Week 1', used: 45, purchased: 60 },
  { name: 'Week 2', used: 50, purchased: 40 },
  { name: 'Week 3', used: 55, purchased: 70 },
  { name: 'Week 4', used: 70, purchased: 50 },
];

export function AdminDashboard({ onRefresh }: { onRefresh?: () => void }) {
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminPanel className="no-print h-[400px] flex flex-col">
          <AdminPanelHeader icon={LayoutDashboard} title="แนวโน้มการเข้าเรียน (Weekly Attendance)" />
          <div className="p-4 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#0f766e" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminPanel>

        <AdminPanel className="no-print h-[400px] flex flex-col">
          <AdminPanelHeader icon={CreditCard} title="สรุปการใช้งานเครดิต (Credit Usage)" />
          <div className="p-4 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={creditUsageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="used" name="ใช้งานแล้ว (Used)" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="purchased" name="ซื้อใหม่ (Purchased)" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminPanel>
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

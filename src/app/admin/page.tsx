"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { LogOut, Loader2, Menu } from 'lucide-react';
import dynamic from 'next/dynamic';
import { AdminLoginGate } from '@/components/admin/AdminLoginGate';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminService, supabase } from '@/lib/supabase';
import type { AdminTab } from '@/components/admin/admin-types';
import { isAdminUser } from '@/lib/auth/roles';


const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 animate-spin text-icsn-teal" />
  </div>
);

const AdminDashboard = dynamic(() => import('@/components/admin/views/AdminDashboard').then(mod => mod.AdminDashboard), { loading: LoadingFallback });
const AdminDailyOps = dynamic(() => import('@/components/admin/views/AdminDailyOps').then(mod => mod.AdminDailyOps), { loading: LoadingFallback });
const AdminSlips = dynamic(() => import('@/components/admin/views/AdminSlips').then(mod => mod.AdminSlips), { loading: LoadingFallback });
const AdminUsers = dynamic(() => import('@/components/admin/views/AdminUsers').then(mod => mod.AdminUsers), { loading: LoadingFallback });
const AdminSettings = dynamic(() => import('@/components/admin/views/AdminSettings').then(mod => mod.AdminSettings), { loading: LoadingFallback });
const AdminTimeSlots = dynamic(() => import('@/components/admin/views/AdminTimeSlots').then(mod => mod.AdminTimeSlots), { loading: LoadingFallback });
const AdminPackages = dynamic(() => import('@/components/admin/views/AdminPackages').then(mod => mod.AdminPackages), { loading: LoadingFallback });
const AdminHolidays = dynamic(() => import('@/components/admin/views/AdminHolidays').then(mod => mod.AdminHolidays), { loading: LoadingFallback });

export default function AdminPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [pendingSlipCount, setPendingSlipCount] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    try {
      const slips = await AdminService.getPendingSlips();
      setPendingSlipCount(slips.length);
    } catch {
      setPendingSlipCount(0);
    }
  }, []);

  // Close drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) setIsDrawerOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      setIsAuthChecking(true);
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthorized(isAdminUser(user));
      setIsAuthChecking(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      refreshPendingCount();
    }
  }, [isAuthorized, refreshPendingCount]);

  const logout = async () => {
    await AdminService.invokeAdminAction<{ success: boolean }>('dummy').catch(() => {}); // Just for safety if we need to call edge function
    await supabase.auth.signOut();
    setIsAuthorized(false);
  };

  if (isAuthChecking) {
    return <LoadingFallback />;
  }

  if (!isAuthorized) {
    return (
      <AdminLoginGate
        onSuccess={() => {
          setIsAuthorized(true);
          refreshPendingCount();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col text-gray-800 font-sarabun">
      <header className="bg-white border-b border-gray-100 shadow-xs no-print sticky top-0 z-40">
        <div className="max-w-[1600px] w-full mx-auto px-4 xl:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(prev => !prev)}
              className="xl:hidden p-2 -ml-2 text-icsn-navy hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-12 h-auto shrink-0">
                <Image
                  src="/main-logo-icsn.png"
                  alt="ICSN Admin"
                  width={48}
                  height={48}
                  className="w-full h-auto object-contain"
                />
              </div>
              <div>
                <h1 className="font-bold text-icsn-navy text-sm leading-none sm:text-base font-outfit">
                  Admin Backoffice
                  <br />
                  <span className="text-xs text-gray-500 font-normal mt-0.5 inline-block font-sarabun">
                    ระบบหลังบ้านแอดมิน
                  </span>
                </h1>
                <p className="text-[9px] text-icsn-teal font-bold tracking-wider mt-0.5 font-outfit hidden sm:block">
                  ICSN PLAYGROUP EXCELLENCE
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="hidden sm:inline">Admin Session Active</span>
              <span className="sm:hidden">Active</span>
            </span>
            <button
              type="button"
              onClick={logout}
              className="p-2 border border-gray-200 hover:border-red-200 hover:text-red-600 rounded-xl transition bg-white cursor-pointer"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] w-full mx-auto px-4 xl:px-8 py-4 xl:py-8 flex-1 flex flex-col xl:flex-row gap-4 xl:gap-10 items-start">
        {/* Sidebar: hamburger on mobile/tablet, sticky vertical on desktop */}
        <div className="w-full xl:w-64 shrink-0 sticky top-[65px] xl:top-24 z-50 xl:z-30 bg-gray-100 xl:bg-transparent py-2 xl:py-0 xl:pb-6 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto no-scrollbar">
          <AdminSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            pendingSlipCount={pendingSlipCount}
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 overflow-hidden w-full pb-12">
          {activeTab === 'dashboard' ? <AdminDashboard onRefresh={refreshPendingCount} onNavigate={(tab) => setActiveTab(tab as AdminTab)} /> : null}
          {activeTab === 'daily_ops' ? <AdminDailyOps onRefresh={refreshPendingCount} /> : null}
          {activeTab === 'slips' ? <AdminSlips onRefresh={refreshPendingCount} /> : null}
          {activeTab === 'users' ? <AdminUsers /> : null}
          {activeTab === 'packages' ? <AdminPackages /> : null}
          {activeTab === 'timeslot' ? <AdminTimeSlots /> : null}
          {activeTab === 'holidays' ? <AdminHolidays /> : null}
          {activeTab === 'settings' ? <AdminSettings /> : null}
        </div>
      </main>
    </div>
  );
}

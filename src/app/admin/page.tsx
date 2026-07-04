"use client";

import React, { useCallback, useEffect, useState } from 'react';
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
    <div className="min-h-screen bg-icsn-bg flex font-sarabun text-foreground">
      {/* ── Fixed Sidebar (desktop) + Slide-out Drawer (mobile/tablet) ── */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingSlipCount={pendingSlipCount}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* ── Main content area pushed right by sidebar on desktop ── */}
      <div className="flex-1 flex flex-col min-w-0 xl:ml-64 min-h-screen">

        {/* Sticky Top Header */}
        <header className="bg-background border-b border-border no-print sticky top-0 z-40 h-[64px] flex items-center shrink-0">
          <div className="w-full px-4 xl:px-8 flex items-center justify-between gap-4">

            {/* Left: Hamburger (mobile/tablet only) + page title */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(prev => !prev)}
                className="xl:hidden p-2 -ml-1 text-icsn-navy hover:bg-muted rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <span className="xl:hidden font-bold text-icsn-navy text-sm font-outfit">
                Admin Backoffice
              </span>
            </div>

            {/* Right: Session badge + Logout */}
            <div className="flex items-center gap-2 text-xs ml-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-success/10 text-success border border-success/20 rounded-full font-semibold whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                <span className="hidden sm:inline">Admin Session Active</span>
                <span className="sm:hidden">Active</span>
              </span>
              <button
                type="button"
                onClick={logout}
                className="p-2 border border-border hover:border-error/50 hover:text-error rounded-xl transition bg-background cursor-pointer"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 xl:p-8 overflow-hidden">
          {/* max-w keeps whitespace on ultra-wide screens */}
          <div className="mx-auto w-full max-w-[1400px] pb-12">
            {activeTab === 'dashboard'  && <AdminDashboard onRefresh={refreshPendingCount} onNavigate={(tab) => setActiveTab(tab as AdminTab)} />}
            {activeTab === 'daily_ops' && <AdminDailyOps />}
            {activeTab === 'slips'     && <AdminSlips onRefresh={refreshPendingCount} />}
            {activeTab === 'users'     && <AdminUsers />}
            {activeTab === 'packages'  && <AdminPackages />}
            {activeTab === 'timeslot'  && <AdminTimeSlots />}
            {activeTab === 'holidays'  && <AdminHolidays />}
            {activeTab === 'settings'  && <AdminSettings />}
          </div>
        </main>
      </div>
    </div>
  );
}

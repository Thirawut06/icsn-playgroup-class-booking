"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Menu } from 'lucide-react';
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

  // Sync tab with URL hash on mount and hashchange
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as AdminTab;
      if (hash) {
        setActiveTab(hash);
      }
    };
    
    // Initial check
    handleHashChange();
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

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
    <div className="min-h-[100dvh] bg-icsn-bg flex font-sarabun text-foreground">
      {/* ── Fixed Sidebar (desktop) + Slide-out Drawer (mobile/tablet) ── */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pendingSlipCount={pendingSlipCount}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onLogout={logout}
      />

      {/* ── Main content area pushed right by sidebar on desktop ── */}
      <div className="flex-1 flex flex-col min-w-0 xl:ml-64 min-h-[100dvh]">

        {/* Sticky Top Header (Mobile only) */}
        <header className="xl:hidden bg-background border-b border-border no-print sticky top-0 z-40 h-[64px] flex items-center shrink-0">
          <div className="w-full px-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(prev => !prev)}
              className="p-2 -ml-1 text-icsn-navy hover:bg-muted rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-icsn-navy text-sm font-outfit">
              Admin Backoffice
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 xl:p-8 overflow-y-auto overflow-x-hidden">
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

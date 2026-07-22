"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ParentService, PackageService, BookingService, SettingsService, supabase } from '@/lib/supabase';
import type { Child, Package, Session, PackageOption, Booking } from '@/types';
import type { SystemSettings } from '@/lib/services/settings.service';
import { STORAGE_KEYS } from '@/config/constants';

import { useCachedState } from '@/hooks/useCachedState';

interface BookingContextValue {
  parentId: string;
  parentName: string;
  creditsRemaining: number;
  children: Child[];
  packages: Package[];
  paymentPackages: PackageOption[];
  sessions: Session[];
  myBookings: Booking[];
  closures: import('@/types').SchoolClosure[];
  settings: SystemSettings | null;
  loading: boolean;
  selectedChildId: string;
  setSelectedChildId: (id: string) => void;
  refreshData: (showLoading?: boolean) => Promise<void>;
  mergeSessionsForDate: (dateStr: string, updatedSessions: Session[]) => void;
  hasPendingSlip: boolean;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export function BookingProvider({ children: reactChildren }: { children: React.ReactNode }) {
  const router = useRouter();
  
  const [parentId, setParentId] = useCachedState('book', 'parentId', '');
  const [parentName, setParentName] = useCachedState('book', 'parentName', '');
  const [creditsRemaining, setCreditsRemaining] = useCachedState('book', 'creditsRemaining', 0);
  const [children, setChildren] = useCachedState<Child[]>('book', 'children', []);
  const [packages, setPackages] = useCachedState<Package[]>('book', 'packages', []);
  const [paymentPackages, setPaymentPackages] = useCachedState<PackageOption[]>('book', 'paymentPackages', []);
  const [sessions, setSessions] = useCachedState<Session[]>('book', 'sessions', []);
  const [myBookings, setMyBookings] = useCachedState<Booking[]>('book', 'myBookings', []);
  const [closures, setClosures] = useCachedState<import('@/types').SchoolClosure[]>('book', 'closures', []);
  const [settings, setSettings] = useCachedState<SystemSettings | null>('book', 'settings', null);
  const [loading, setLoading] = useCachedState('book', 'loading', true);
  const [selectedChildId, setSelectedChildId] = useCachedState('book', 'selectedChildId', '');
  const [hasPendingSlip, setHasPendingSlip] = useCachedState('book', 'hasPendingSlip', false);

  const checkPendingSlips = async (pId: string) => {
    try {
      const { data } = await supabase
        .from('slip_uploads')
        .select('id')
        .eq('parent_id', pId)
        .eq('status', 'pending');
      setHasPendingSlip((data || []).length > 0);
    } catch (e) {
      console.error('Error checking pending slips:', e);
    }
  };

  const loadData = async (pId: string, showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      // Phase 1: Fire all independent queries in parallel (no sequential waterfall)
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(today.getFullYear() + 1, today.getMonth(), 0).toISOString().split('T')[0];

      const [
        settingsResult,
        parentResult,
        packagesResult,
        pkgOptionsResult,
        sessionsResult,
        closuresResult,
        bookingsResult,
        slipsResult,
      ] = await Promise.allSettled([
        SettingsService.getAllSettings(),
        ParentService.getParentDetails(pId),
        PackageService.getPackages(pId),
        PackageService.getPackageOptions(),
        BookingService.getSessions(startDate, endDate),
        BookingService.getSchoolClosures(),
        BookingService.getBookings(pId),
        supabase.from('slip_uploads').select('id').eq('parent_id', pId).eq('status', 'pending'),
      ]);

      // Phase 2: Process results (order-independent)
      if (settingsResult.status === 'fulfilled') {
        setSettings(settingsResult.value);
      } else {
        console.error('Failed to load settings:', settingsResult.reason);
      }

      if (parentResult.status === 'fulfilled' && parentResult.value) {
        setParentName(parentResult.value.name);
        setChildren(parentResult.value.children || []);
        if (parentResult.value.children && parentResult.value.children.length > 0) {
          setSelectedChildId(parentResult.value.children[0].id);
        }
      }

      if (packagesResult.status === 'fulfilled') {
        const pkgs = packagesResult.value;
        setPackages(pkgs);
        const totalCredits = pkgs.reduce((sum, pkg) => sum + pkg.credits_remaining, 0);
        setCreditsRemaining(totalCredits);
      }

      if (pkgOptionsResult.status === 'fulfilled') {
        setPaymentPackages(pkgOptionsResult.value);
      }

      if (sessionsResult.status === 'fulfilled') {
        setSessions(sessionsResult.value);
      }

      if (closuresResult.status === 'fulfilled') {
        setClosures(closuresResult.value);
      }

      if (bookingsResult.status === 'fulfilled') {
        setMyBookings(bookingsResult.value);
      }

      if (slipsResult.status === 'fulfilled') {
        const slipData = slipsResult.value.data;
        setHasPendingSlip((slipData || []).length > 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/th/login');
        return;
      }
      setParentId(user.id);
      
      // If we already have this user cached, do a background fetch without showing the loading screen
      // Assuming cache key matches globalCache in useCachedState ('book::parentId')
      const hasCache = !!parentId && parentId === user.id;
      loadData(user.id, !hasCache);
    });
  }, [router]);

  useEffect(() => {
    if (!parentId) return;

    const channel = supabase
      .channel(`realtime-global-changes-${parentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'slip_uploads',
          filter: `parent_id=eq.${parentId}`
        },
        () => {
          checkPendingSlips(parentId);
          loadData(parentId, false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings'
        },
        () => {
          loadData(parentId, false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'school_closures'
        },
        () => {
          loadData(parentId, false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions'
        },
        () => {
          loadData(parentId, false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_templates'
        },
        () => {
          loadData(parentId, false);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Subscribed to booking updates');
        } else if (err) {
          console.error('[Realtime] Subscription error:', status, err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parentId]);

  return (
    <BookingContext.Provider
      value={{
        parentId,
        parentName,
        creditsRemaining,
        children,
        packages,
        paymentPackages,
        sessions,
        myBookings,
        closures,
        settings,
        loading,
        selectedChildId,
        setSelectedChildId,
  refreshData: (showLoading = true) => loadData(parentId, showLoading),
  mergeSessionsForDate: (dateStr: string, updatedSessions: Session[]) => {
    setSessions(prev => [
      ...prev.filter(s => s.session_date !== dateStr),
      ...updatedSessions,
    ]);
  },
  hasPendingSlip,
      }}
    >
      {reactChildren}
    </BookingContext.Provider>
  );
}

export function useBookingContext() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBookingContext must be used within a BookingProvider');
  }
  return context;
}

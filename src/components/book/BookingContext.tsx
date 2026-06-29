"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ParentService, PackageService, BookingService, SettingsService } from '@/lib/supabase';
import type { Child, Package, Session, PackageOption, Booking } from '@/types';
import type { SystemSettings } from '@/lib/services/settings.service';
import { STORAGE_KEYS } from '@/config/constants';

interface BookingContextValue {
  parentId: string;
  parentName: string;
  creditsRemaining: number;
  children: Child[];
  packages: Package[];
  paymentPackages: PackageOption[];
  sessions: Session[];
  myBookings: Booking[];
  blockoutDates: string[];
  settings: SystemSettings | null;
  loading: boolean;
  selectedChildId: string;
  setSelectedChildId: (id: string) => void;
  refreshData: () => Promise<void>;
  mergeSessionsForDate: (dateStr: string, updatedSessions: Session[]) => void;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export function BookingProvider({ children: reactChildren }: { children: React.ReactNode }) {
  const router = useRouter();
  
  const [parentId, setParentId] = useState('');
  const [parentName, setParentName] = useState('');
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [children, setChildren] = useState<Child[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [paymentPackages, setPaymentPackages] = useState<PackageOption[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [blockoutDates, setBlockoutDates] = useState<string[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState('');

  const loadData = async (pId: string) => {
    setLoading(true);
    try {
      const parent = await ParentService.getParentDetails(pId);
      if (parent) {
        setParentName(parent.name);
        setChildren(parent.children || []);
        if (parent.children?.length > 0) {
          setSelectedChildId(parent.children[0].id);
        }
      }

      const pkgs = await PackageService.getPackages(pId);
      setPackages(pkgs);
      const totalCredits = pkgs.reduce((sum, pkg) => sum + pkg.credits_remaining, 0);
      setCreditsRemaining(totalCredits);

      const pkgOptions = await PackageService.getPackageOptions();
      setPaymentPackages(pkgOptions);

      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0];
      const loadedSessions = await BookingService.getSessions(startDate, endDate);
      setSessions(loadedSessions);

      const blockedDates = await BookingService.getBlockoutDates();
      setBlockoutDates(blockedDates);

      const bookings = await BookingService.getBookings(pId);
      setMyBookings(bookings);

      const sysSettings = await SettingsService.getAllSettings();
      setSettings(sysSettings);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const pId = localStorage.getItem(STORAGE_KEYS.PARENT_ID);
    if (!pId) {
      router.push('/login');
      return;
    }
    setParentId(pId);
    loadData(pId);
  }, [router]);

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
        blockoutDates,
        settings,
        loading,
        selectedChildId,
        setSelectedChildId,
  refreshData: () => loadData(parentId),
  mergeSessionsForDate: (dateStr: string, updatedSessions: Session[]) => {
    setSessions(prev => [
      ...prev.filter(s => s.session_date !== dateStr),
      ...updatedSessions,
    ]);
  },
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

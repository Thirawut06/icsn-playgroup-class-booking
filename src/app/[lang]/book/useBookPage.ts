import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { Session } from '@/types';
import { useBookingContext } from '@/components/book/BookingContext';
import { useBookingActions } from '@/hooks/useBookingActions';
import { sessionModule } from '@/lib/domain';
import { supabase } from '@/lib/supabase';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import { ROUTES } from '@/config/routes';
import { useCachedState } from '@/hooks/useCachedState';

export function useBookPage() {
  const router = useRouter();
  const { dict, lang } = useDictionary();

  // ─── Data & State via Custom Hooks ───────────────────────────
  const {
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
    refreshData,
    mergeSessionsForDate,
    hasPendingSlip
  } = useBookingContext();

  const [monthIndex, setMonthIndex] = useCachedState('book', 'monthIndex', 0);

  // Selection State
  const [selectedDates, setSelectedDates] = useCachedState<string[]>('book', 'selectedDates', []);
  const [selectedSessionsMap, setSelectedSessionsMap] = useCachedState<Record<string, Session>>('book', 'selectedSessionsMap', {});

  // Modals / Status State
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showBookingConfirm, setShowBookingConfirm] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);

  const clearSelection = () => {
    setSelectedDates([]);
    setSelectedSessionsMap({});
  };

  const handleBookingSuccess = () => {
    setShowBookingConfirm(false);
    setBookingSuccess(false);
    refreshData();
  };

  const {
    isSubmitting,
    bookingError,
    setBookingError,
    isCancelling,
    cancelError,
    cancelSuccess,
    resetCancelState,
    confirmBookClass,
    executeCancel
  } = useBookingActions({
    parentId,
    selectedChildId,
    selectedDates,
    selectedSessionsMap,
    packages,
    onSuccess: handleBookingSuccess,
    onError: () => refreshData(false),
    clearSelection
  });

  // ─── Event Handlers ──────────────────────────────────────────

  const handleLogout = async () => {
    localStorage.clear();
    await supabase.auth.signOut();
    router.push(ROUTES.LOGIN(lang));
  };

  const handleDateSelect = async (dayObj: any) => {
    setBookingSuccess(false);
    setBookingError('');
    const dateStr = dayObj.dateStr;

    if (selectedDates.includes(dateStr)) {
      // Toggle OFF
      setSelectedDates(prev => prev.filter(d => d !== dateStr));
      setSelectedSessionsMap(prev => {
        const next = { ...prev };
        delete next[dateStr];
        return next;
      });
      return;
    }

    // Toggle ON
    if (creditsRemaining <= 0) {
      toast.error(dict.book.outOfCredits);
      return;
    }

    // 1. Determine which dates will be selected (FIFO logic)
    let updatedDates = [...selectedDates];
    let removedDate: string | null = null;

    if (updatedDates.length >= creditsRemaining) {
      removedDate = updatedDates.shift() || null;
    }

    updatedDates.push(dateStr);
    
    // 2. Fetch or create sessions BEFORE updating state to prevent UI bouncing
    let currentSessions = dayObj.sessions || [];
    try {
      const newSessions = await sessionModule.getOrCreateSessionsForDate(dateStr);
      if (newSessions.length > 0) {
        mergeSessionsForDate(dateStr, newSessions);
        currentSessions = newSessions;
      }
    } catch (err) {
      console.error("Failed to fetch sessions for date", err);
    }

    // 3. Now that sessions are loaded, update all states together
    setSelectedDates(updatedDates);

    if (removedDate) {
      setSelectedSessionsMap(prev => {
        const next = { ...prev };
        if (removedDate) delete next[removedDate];
        return next;
      });
    }

    // 4. Auto-select first available active session that has capacity
    const activePackage = packages
      .filter(p => p.credits_remaining > 0)
      .sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime())[0];
    const isTrialUser = activePackage?.type === 'trial';

    const firstActiveSession = currentSessions?.find((s: Session) => {
      if (!s.is_active) return false;
      const booked = s.booked_count || 0;
      if (booked >= s.total_capacity) return false;
      if (isTrialUser) {
        const trialBooked = s.trial_booked_count || 0;
        const trialCap = s.trial_capacity || 0;
        if (trialBooked >= trialCap) return false;
      }
      return true;
    }) || null;

    if (firstActiveSession) {
      setSelectedSessionsMap(prev => ({ ...prev, [dateStr]: firstActiveSession }));
    }
  };

  const handleBookClass = () => {
    if (selectedDates.length === 0 || !selectedChildId || packages.length === 0) {
      setBookingError(dict.book.selectChildDateCredits);
      return;
    }
    setBookingError('');
    setShowBookingConfirm(true);
  };

  // ─── Derived State ───────────────────────────────────────────
  const selectedChildObj = children.find(c => c.id === selectedChildId);
  const childrenMissingPhotos = children.filter(c => !c.photo_url || !c.parent_photo_url);

  const dateLocale = lang === 'th' ? 'th-TH' : 'en-US';
  const dateLabel = selectedDates.length === 1
    ? new Date(selectedDates[0]).toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' })
    : `${dict.book.allDays} ${selectedDates.length} ${dict.book.daysUnit}`;
  const timeLabel = selectedDates.length === 1
    ? (selectedSessionsMap[selectedDates[0]]?.time_label || '')
    : dict.book.asSelected;

  return {
    // Context State
    parentId,
    parentName,
    creditsRemaining,
    children,
    paymentPackages,
    sessions,
    closures,
    settings,
    loading,
    selectedChildId,
    refreshData,
    hasPendingSlip,
    
    // Page State
    monthIndex,
    setMonthIndex,
    selectedDates,
    selectedSessionsMap,
    setSelectedSessionsMap,
    bookingSuccess,
    showTopUpModal,
    setShowTopUpModal,
    showBookingConfirm,
    setShowBookingConfirm,
    bookingToCancel,
    setBookingToCancel,
    isSubmitting,
    bookingError,
    isCancelling,
    cancelError,
    cancelSuccess,
    resetCancelState,
    
    // Derived
    selectedChildObj,
    childrenMissingPhotos,
    dateLabel,
    timeLabel,
    
    // Handlers
    handleLogout,
    handleDateSelect,
    handleBookClass,
    confirmBookClass,
    executeCancel,
    dict
  };
}

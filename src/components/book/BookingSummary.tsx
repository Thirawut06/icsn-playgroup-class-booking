import React from 'react';
import { CalendarCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import type { Session, SchoolClosure } from '@/types';
import { checkIsBookableDate } from '@/utils/dateUtils';
import { LineSupportCard } from '@/components/ui/LineSupportCard';
import { useBookingContext } from './BookingContext';

interface BookingSummaryProps {
  selectedDates: string[];
  selectedChildObj?: any;
  creditsRemaining: number;
  sessions: Session[];
  selectedSessionsMap: Record<string, Session>;
  onSelectSessionMap: (dateStr: string, session: Session) => void;
  isSubmitting: boolean;
  bookingSuccess: boolean;
  bookingError: string;
  onBookClass: () => void;
  closures: SchoolClosure[];
  operatingDays?: number[];
  cutoffHour: number;
}

export function BookingSummary({
  selectedDates,
  selectedChildObj,
  creditsRemaining,
  sessions,
  selectedSessionsMap,
  onSelectSessionMap,
  isSubmitting,
  bookingSuccess,
  bookingError,
  onBookClass,
  closures,
  operatingDays = [0,1,2,3,4,5,6],
  cutoffHour = 7
}: BookingSummaryProps) {
  const { dict, lang } = useDictionary();
  const { packages } = useBookingContext();

  if (selectedDates.length === 0) return null;

  const sortedDates = [...selectedDates].sort();

  const activePackage = packages
    .filter(p => p.credits_remaining > 0)
    .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())[0];
  const isTrialUser = activePackage?.type === 'trial';

  const dateInfoList = sortedDates.map(dateStr => {
    const sessionsForDate = sessions
      .filter(s => s.session_date === dateStr && s.is_active)
      .sort((a, b) => {
        const timeA = parseFloat(a.time_label?.split('-')[0].trim() || "0");
        const timeB = parseFloat(b.time_label?.split('-')[0].trim() || "0");
        return timeA - timeB;
      });
    
    const getIsDisabled = (session: Session) => {
        const bookedCount = session.booked_count || 0;
        const isFull = bookedCount >= session.total_capacity;
        const trialBookedCount = session.trial_booked_count || 0;
        const isTrialFull = isTrialUser && session.trial_capacity !== undefined && trialBookedCount >= session.trial_capacity;
        return isFull || isTrialFull;
    };

    const firstAvailable = sessionsForDate.find(s => !getIsDisabled(s));
    const selectedSession = selectedSessionsMap[dateStr] || firstAvailable || sessionsForDate[0];
    const isSelectedSessionDisabled = selectedSession ? getIsDisabled(selectedSession) : true;
    
    return {
        dateStr,
        sessionsForDate,
        selectedSession,
        isSelectedSessionDisabled,
        getIsDisabled
    };
  });

  const isAnySessionFull = dateInfoList.some(info => info.isSelectedSessionDisabled);

  return (
    <div className="px-4 py-6 border-t border-border bg-white mt-auto rounded-t-3xl shadow-[0_-10px_20px_rgba(0,0,0,0.03)] relative z-20">
      <h3 className="font-bold text-icsn-navy mb-4 flex items-center gap-1.5 text-base">
        <CalendarCheck className="w-5 h-5 text-icsn-teal" />
        <span>{dict.book.step3}</span>
      </h3>
      
      <div className="space-y-3 mb-6">
        {dateInfoList.map(({ dateStr, sessionsForDate, selectedSession, getIsDisabled }, index) => {
          // Format date based on locale
          const d = new Date(dateStr);
          const locale = lang === 'th' ? 'th-TH' : 'en-US';
          const formattedDate = d.toLocaleDateString(locale, {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
          });

          // Re-evaluate bookability specifically for this date's dropdown
          const isBookable = checkIsBookableDate(dateStr, closures, operatingDays, cutoffHour);

          return (
            <div key={dateStr} className="bg-muted/30 border border-border rounded-xl p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-icsn-navy text-sm">
                  {dict.book.classLabel} {index + 1} : {formattedDate}
                </span>
              </div>
              
              <div className="relative">
                <select 
                  className="w-full text-sm p-2.5 border border-border rounded-lg bg-white focus:outline-none focus:border-icsn-teal appearance-none disabled:bg-muted disabled:text-muted-foreground transition-colors"
                  value={selectedSession?.id || ''}
                  onChange={(e) => {
                    const session = sessionsForDate.find(s => s.id === e.target.value);
                    if (session) onSelectSessionMap(dateStr, session);
                  }}
                  disabled={!isBookable}
                >
                  {!isBookable ? (
                    <option value="">{dict.book.closedBooking}</option>
                  ) : sessionsForDate.length === 0 ? (
                    <option value="default">{lang === 'th' ? 'รอบปกติ (09:00 - 12:00)' : 'Regular Session (09:00 - 12:00)'}</option>
                  ) : (
                    sessionsForDate.map(session => {
                      const isDisabled = getIsDisabled(session);
                      
                      const bookedCount = session.booked_count || 0;
                      const isFull = bookedCount >= session.total_capacity;
                      const trialBookedCount = session.trial_booked_count || 0;
                      const isTrialFull = isTrialUser && session.trial_capacity !== undefined && trialBookedCount >= session.trial_capacity;
                      
                      return (
                        <option key={session.id} value={session.id} disabled={isDisabled}>
                          {session.time_label} {isTrialFull ? (lang === 'th' ? '(ทดลองเรียนเต็ม)' : '(Trial Full)') : isFull ? `(${dict.book.full})` : `(${dict.book.available} ${session.total_capacity - bookedCount})`}
                        </option>
                      );
                    })
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-muted-foreground/70">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-end mb-4 px-1">
        <div>
          <p className="text-sm font-bold text-muted-foreground leading-none mb-1">{dict.book.totalSummary}</p>
          <p className="text-[22px] font-black text-icsn-navy leading-none">
            {selectedDates.length} <span className="text-sm font-bold text-muted-foreground ml-0.5">{dict.book.daysUnit}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-muted-foreground leading-none mb-1">{dict.book.useCredits}</p>
          <p className="text-[22px] font-black text-icsn-teal leading-none">
            {selectedDates.length} <span className="text-sm font-bold text-muted-foreground ml-0.5">{dict.book.credits}</span>
          </p>
        </div>
      </div>

      {bookingError && (
        <div className="mb-4 space-y-2">
          <div className="bg-error/10 text-error p-3 rounded-xl text-sm border border-error/20 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{bookingError}</p>
          </div>
          <LineSupportCard className="!mt-0" />
        </div>
      )}

      {bookingSuccess && (
        <div className="bg-success/10 text-success p-3 rounded-xl text-sm border border-success/20 flex items-start gap-2 mb-4">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="font-medium leading-relaxed">{dict.book.confirmBooking} ✓</p>
        </div>
      )}

      <button
        onClick={onBookClass}
        disabled={isSubmitting || selectedDates.length === 0 || !selectedChildObj || isAnySessionFull}
        className="w-full bg-icsn-teal hover:bg-icsn-teal/90 disabled:bg-foreground/10 disabled:text-muted-foreground disabled:cursor-not-allowed text-white py-4 px-4 rounded-full font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {dict.book.processing}
          </>
        ) : (
          dict.book.confirmBooking
        )}
      </button>

      <p className="mt-5 text-center text-[13px] font-medium text-muted-foreground leading-relaxed">
        {dict.book.noCancelAfterCutoff.replace('{hour}', String(cutoffHour).padStart(2, '0'))}
      </p>
    </div>
  );
}

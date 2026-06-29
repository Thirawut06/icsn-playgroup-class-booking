import React from 'react';
import { ReceiptText, Hand, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { Child, Session } from '@/types';

interface BookingSummaryProps {
  selectedDate: string | null;
  selectedDateAvailable: boolean;
  selectedSessionStatus: string;
  selectedChildObj?: Child;
  creditsRemaining: number;
  selectedChildId: string;
  availableSessions: Session[];
  selectedSession: Session | null;
  onSelectSession: (session: Session | null) => void;
  isSubmitting: boolean;
  bookingSuccess: boolean;
  bookingError: string;
  onBookClass: () => void;
}

import { getThaiMonthMin, formatThaiFullDate } from '@/utils/dateUtils';
import { COPY } from '@/config/copy';

export function BookingSummary({
  selectedDate,
  selectedDateAvailable,
  selectedSessionStatus,
  selectedChildObj,
  creditsRemaining,
  selectedChildId,
  availableSessions = [],
  selectedSession,
  onSelectSession,
  isSubmitting,
  bookingSuccess,
  bookingError,
  onBookClass,
}: BookingSummaryProps) {
  let selectedThaiMonthMin = '';
  let selectedDayNum = '';
  let selectedThaiFullDate = '';

  if (selectedDate) {
    const d = new Date(selectedDate);
    selectedThaiMonthMin = getThaiMonthMin(d);
    selectedDayNum = String(d.getDate());
    selectedThaiFullDate = formatThaiFullDate(d);
  }

  return (
    <div className="pb-10">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-icsn-card space-y-5">
        <h3 className="font-bold text-icsn-navy border-b border-gray-100 pb-3 flex items-center gap-1.5 text-base">
          <ReceiptText className="w-5 h-5 text-icsn-teal" />
          <span>{COPY.BOOKING_FLOW.STEP_3}</span>
        </h3>

        {!selectedDate ? (
          <div className="text-center py-8 text-gray-400 space-y-2">
            <div className="inline-flex p-4 bg-gray-50 text-icsn-teal/40 rounded-full mb-1">
              <Hand className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-gray-500">{COPY.BOOKING_FLOW.SELECT_DATE_HINT}</p>
            <p className="text-xs">{COPY.BOOKING_FLOW.ADVANCE_NOTICE}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Unified Summary Card */}
            <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 space-y-3.5">
              
              {/* Date */}
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-gray-500">{COPY.BOOKING_FLOW.DATE_LABEL}</span>
                <span className="text-base font-bold text-icsn-teal">{selectedDayNum} {selectedThaiMonthMin}</span>
              </div>

              {/* Child */}
              {selectedChildObj && (
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-gray-500">{COPY.BOOKING_FLOW.STUDENT_LABEL}</span>
                  <span className="text-base font-bold text-icsn-navy">{selectedChildObj.nickname}</span>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-gray-500">{COPY.BOOKING_FLOW.STATUS_LABEL}</span>
                <span className={`text-base font-bold inline-flex items-center gap-1.5 ${selectedDateAvailable ? 'text-icsn-teal' : 'text-rose-500'}`}>
                  <span className={`w-2 h-2 rounded-full shadow-sm ${selectedDateAvailable ? 'bg-icsn-teal' : 'bg-rose-500'}`}></span>
                  {selectedSessionStatus}
                </span>
              </div>

              {/* Time Slots */}
              <div className="pt-3.5 border-t border-gray-100">
                <span className="text-base font-medium text-gray-500 block mb-2.5">{COPY.BOOKING_FLOW.SELECT_SESSION_LABEL}</span>
                
                {availableSessions.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {availableSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => onSelectSession(session)}
                        className={`w-full text-left px-4 py-3 rounded-xl border font-bold text-base transition-all flex justify-between items-center ${
                          selectedSession?.id === session.id
                            ? 'bg-icsn-teal text-white border-icsn-teal shadow-md ring-2 ring-icsn-teal/20'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-icsn-teal/50'
                        }`}
                      >
                        <span>{session.time_label || COPY.BOOKING_FLOW.SESSION_MORNING}</span>
                        <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                          selectedSession?.id === session.id 
                            ? 'bg-white/20 text-white' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          ว่าง {Math.max(0, session.total_capacity - (session.booked_count || 0))}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button className="w-full text-left px-4 py-3 rounded-xl font-bold text-base transition-all flex justify-between items-center bg-icsn-teal text-white border border-icsn-teal shadow-md ring-2 ring-icsn-teal/20">
                      <span>{COPY.BOOKING_FLOW.SESSION_MORNING}</span>
                      <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-white/20 text-white">
                        ว่าง 15
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {bookingError && (
              <div className="bg-rose-50 text-rose-700 border border-rose-100 p-4 rounded-2xl text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-bold">{bookingError}</span>
              </div>
            )}


            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={onBookClass}
                disabled={isSubmitting || bookingSuccess || !selectedDateAvailable || creditsRemaining <= 0 || !selectedChildId}
                className="w-full bg-icsn-teal hover:bg-icsn-teal/90 text-white py-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none hover:-translate-y-0.5 active:translate-y-0"
              >
                {!isSubmitting ? (
                  <span>{COPY.BOOKING_FLOW.CONFIRM_BOOKING_BTN}</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                    กำลังทำรายการ...
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


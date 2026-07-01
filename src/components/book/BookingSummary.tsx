import React from 'react';
import { ReceiptText, Hand, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { Child, Session } from '@/types';

interface BookingSummaryProps {
  selectedDates: string[];
  selectedChildObj?: Child;
  creditsRemaining: number;
  sessions: Session[];
  selectedSessionsMap: Record<string, Session>;
  onSelectSessionMap: (dateStr: string, session: Session) => void;
  isSubmitting: boolean;
  bookingSuccess: boolean;
  bookingError: string;
  onBookClass: () => void;
  blockoutDates: string[] | undefined;
  cutoffHour: number;
}

import { getThaiMonthMin, checkIsBookableDate } from '@/utils/dateUtils';
import { COPY } from '@/config/copy';

export function BookingSummary({
  selectedDates,
  selectedChildObj,
  creditsRemaining,
  sessions = [],
  selectedSessionsMap,
  onSelectSessionMap,
  isSubmitting,
  bookingSuccess,
  bookingError,
  onBookClass,
  blockoutDates,
  cutoffHour
}: BookingSummaryProps) {
  
  // Sort selected dates chronologically
  const sortedDates = [...selectedDates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // Check if ALL selected dates have a valid session selected
  const isAllSessionsSelected = sortedDates.length > 0 && sortedDates.every(date => !!selectedSessionsMap[date]);

  return (
    <div className="pb-10">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-icsn-card space-y-5">
        <h3 className="font-bold text-icsn-navy border-b border-gray-100 pb-3 flex items-center gap-1.5 text-base">
          <ReceiptText className="w-5 h-5 text-icsn-teal" />
          <span>{COPY.BOOKING_FLOW.STEP_3}</span>
        </h3>

        {sortedDates.length === 0 ? (
          <div className="text-center py-8 text-gray-400 space-y-2">
            <div className="inline-flex p-4 bg-gray-50 text-icsn-teal/40 rounded-full mb-1">
              <Hand className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-gray-500">{COPY.BOOKING_FLOW.SELECT_DATE_HINT}</p>
            <p className="text-xs">{COPY.BOOKING_FLOW.ADVANCE_NOTICE}</p>
          </div>
        ) : (
          <div className="space-y-4">
            
            <div className="flex items-center justify-between px-1">
               <span className="text-sm font-medium text-gray-500">จำนวนที่เลือก:</span>
               <span className="text-sm font-bold text-icsn-navy">{sortedDates.length} วัน (ใช้ {sortedDates.length} เครดิต)</span>
            </div>

            {/* Render a card for each selected date */}
            {sortedDates.map((dateStr, index) => {
              const d = new Date(dateStr);
              const dayNum = String(d.getDate());
              const monthName = getThaiMonthMin(d);
              
              const dateAvailable = checkIsBookableDate(dateStr, blockoutDates || [], cutoffHour);
              const availableSessions = sessions
                .filter(s => s.session_date === dateStr)
                .sort((a, b) => {
                  const m1 = (a.time_label || '').match(/(\d{1,2})[.:]/);
                  const m2 = (b.time_label || '').match(/(\d{1,2})[.:]/);
                  return (m1 ? parseInt(m1[1], 10) : 0) - (m2 ? parseInt(m2[1], 10) : 0);
                });

              const selectedSession = selectedSessionsMap[dateStr];

              return (
                <div key={dateStr} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3.5 shadow-sm">
                  {/* Header Row */}
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-base font-bold text-gray-800">{dayNum} {monthName}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${dateAvailable ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-600'}`}>
                      {dateAvailable ? `คลาสที่ ${index + 1}` : 'ปิดรับจอง'}
                    </span>
                  </div>

                  {/* Child */}
                  {selectedChildObj && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">{COPY.BOOKING_FLOW.STUDENT_LABEL}</span>
                      <span className="text-sm font-bold text-icsn-navy">{selectedChildObj.nickname}</span>
                    </div>
                  )}

                  {/* Time Slots */}
                  {dateAvailable && (
                    <div className="pt-1">
                      {availableSessions.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {availableSessions.map((session) => {
                            const availableSeats = Math.max(0, session.total_capacity - (session.booked_count || 0));
                            const isFull = availableSeats <= 0;
                            const isDisabled = !session.is_active || isFull;
                            
                            return (
                            <button
                              key={session.id}
                              onClick={() => !isDisabled && onSelectSessionMap(dateStr, session)}
                              disabled={isDisabled}
                              className={`w-full text-left px-4 py-3 rounded-xl border font-bold text-sm transition-all flex justify-between items-center ${isDisabled
                                ? 'bg-muted border-transparent text-muted-foreground cursor-not-allowed'
                                : selectedSession?.id === session.id
                                  ? 'bg-primary border-primary text-primary-foreground shadow-md'
                                  : 'bg-background border-border text-foreground hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                <span>{session.time_label || COPY.BOOKING_FLOW.SESSION_MORNING}</span>
                              </div>
                              <span className={`text-xs font-bold px-3 py-1 rounded-full ${isDisabled
                                ? (isFull && session.is_active ? 'bg-error/10 text-error' : 'bg-slate-200 text-slate-500')
                                : selectedSession?.id === session.id
                                  ? 'bg-background text-primary shadow-sm'
                                  : 'bg-green-100 text-green-800'
                                }`}>
                                {!session.is_active ? (session.theme || 'ปิดรับลงทะเบียน') : isFull ? 'เต็มแล้ว' : `ว่าง ${availableSeats}`}
                              </span>
                            </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-3 text-muted-foreground text-xs border border-dashed border-border rounded-xl">
                          <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-icsn-teal/50" />
                          <p>กำลังโหลดข้อมูล...</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

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
                disabled={isSubmitting || bookingSuccess || sortedDates.length === 0 || creditsRemaining < sortedDates.length || !isAllSessionsSelected}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none hover:-translate-y-0.5 active:translate-y-0"
              >
                {!isSubmitting ? (
                  <span>ยืนยันการจองสิทธิ์ {sortedDates.length > 0 ? `(หัก ${sortedDates.length} Credit)` : ''}</span>
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

      {/* Warning Rule Note */}
      {sortedDates.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 text-warning p-3 rounded-2xl flex items-start gap-2 mt-4">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-warning" />
          <p className="text-xs font-bold leading-relaxed">
            {COPY.RULES.NO_CANCEL_AFTER_7AM}
          </p>
        </div>
      )}
    </div>
  );
}

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
    const thaiMonthsMin = ["เธก.เธ.", "เธ.เธ.", "เธกเธต.เธ.", "เน€เธก.เธข.", "เธ.เธ.", "เธกเธด.เธข.", "เธ.เธ.", "เธช.เธ.", "เธ.เธข.", "เธ•.เธ.", "เธ.เธข.", "เธ.เธ."];
    selectedThaiMonthMin = thaiMonthsMin[d.getMonth()];
    selectedDayNum = String(d.getDate());
    selectedThaiFullDate = d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  return (
    <div className="pb-10">
      <div className="bg-white rounded-[20px] border border-gray-100 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-5">
        <h3 className="font-bold text-[#211551] border-b border-gray-100 pb-3 flex items-center gap-1.5 text-base">
          <ReceiptText className="w-5 h-5 text-[#00B0B9]" />
          <span>3. เธชเธฃเธธเธเธเธฒเธฃเธเธญเธเธชเธดเธ—เธเธดเน</span>
        </h3>

        {!selectedDate ? (
          <div className="text-center py-8 text-gray-400 space-y-2">
            <div className="inline-flex p-4 bg-gray-50 text-[#00B0B9]/40 rounded-full mb-1">
              <Hand className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-gray-500">เธเธฃเธธเธ“เธฒเนเธ•เธฐเน€เธฅเธทเธญเธเธงเธฑเธเธ—เธตเนเนเธเธเธเธดเธ—เธดเธ</p>
            <p className="text-xs">* เธฃเธฐเธเธเนเธชเธ”เธเธฃเธญเธเน€เธฃเธตเธขเธเธฅเนเธงเธเธซเธเนเธฒ 2 เน€เธ”เธทเธญเธ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Unified Summary Card */}
            <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 space-y-3.5">
              
              {/* Date */}
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-gray-500">เธงเธฑเธเธ—เธตเนเน€เธฃเธตเธขเธ:</span>
                <span className="text-base font-bold text-[#00B0B9]">{selectedDayNum} {selectedThaiMonthMin}</span>
              </div>

              {/* Child */}
              {selectedChildObj && (
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-gray-500">เธเธฑเธเน€เธฃเธตเธขเธ:</span>
                  <span className="text-base font-bold text-[#211551]">{selectedChildObj.nickname}</span>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-gray-500">เธชเธ–เธฒเธเธฐ:</span>
                <span className={`text-base font-bold inline-flex items-center gap-1.5 ${selectedDateAvailable ? 'text-[#00B0B9]' : 'text-rose-500'}`}>
                  <span className={`w-2 h-2 rounded-full shadow-sm ${selectedDateAvailable ? 'bg-[#00B0B9]' : 'bg-rose-500'}`}></span>
                  {selectedSessionStatus}
                </span>
              </div>

              {/* Time Slots */}
              <div className="pt-3.5 border-t border-gray-100">
                <span className="text-base font-medium text-gray-500 block mb-2.5">เน€เธฅเธทเธญเธเธฃเธญเธเน€เธงเธฅเธฒ:</span>
                
                {availableSessions.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {availableSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => onSelectSession(session)}
                        className={`w-full text-left px-4 py-3 rounded-xl border font-bold text-base transition-all flex justify-between items-center ${
                          selectedSession?.id === session.id
                            ? 'bg-[#00B0B9] text-white border-[#00B0B9] shadow-md ring-2 ring-[#00B0B9]/20'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#00B0B9]/50'
                        }`}
                      >
                        <span>{session.time_label || 'เน€เธเนเธฒ (09:00 - 12:00)'}</span>
                        <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                          selectedSession?.id === session.id 
                            ? 'bg-white/20 text-white' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          เธงเนเธฒเธ {Math.max(0, session.total_capacity - (session.booked_count || 0))}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button className="w-full text-left px-4 py-3 rounded-xl font-bold text-base transition-all flex justify-between items-center bg-[#00B0B9] text-white border border-[#00B0B9] shadow-md ring-2 ring-[#00B0B9]/20">
                      <span>เน€เธเนเธฒ (09:00 - 12:00)</span>
                      <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-white/20 text-white">
                        เธงเนเธฒเธ 15
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
                className="w-full bg-[#00B0B9] hover:bg-[#00969e] text-white py-4 rounded-[14px] font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none hover:-translate-y-0.5 active:translate-y-0"
              >
                {!isSubmitting ? (
                  <span>เธขเธทเธเธขเธฑเธเธเธฒเธฃเธเธญเธเธชเธดเธ—เธเธดเน (เธซเธฑเธ 1 Credit)</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                    เธเธณเธฅเธฑเธเธ—เธณเธฃเธฒเธขเธเธฒเธฃ...
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


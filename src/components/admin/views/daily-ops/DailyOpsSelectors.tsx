import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminFieldLabel } from '../../admin-ui';
import type { Session } from '@/types';

interface DailyOpsSelectorsProps {
  dailyDate: string;
  setDailyDate: (date: string) => void;
  handlePrevDay: () => void;
  handleNextDay: () => void;
  sessions: Session[];
  selectedSessionId: string;
  setSelectedSessionId: (id: string) => void;
}

export function DailyOpsSelectors({
  dailyDate,
  setDailyDate,
  handlePrevDay,
  handleNextDay,
  sessions,
  selectedSessionId,
  setSelectedSessionId
}: DailyOpsSelectorsProps) {
  return (
    <>
      <section className="bg-white border border-border rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          
          {/* Date picker */}
          <div className="shrink-0">
            <AdminFieldLabel>
              <span className="flex items-baseline gap-2">
                วันที่
                {dailyDate && (
                  <span className="text-sm font-medium text-icsn-teal">
                    {new Date(`${dailyDate}T00:00:00Z`).toLocaleDateString('th-TH', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </span>
                )}
              </span>
            </AdminFieldLabel>
            <div className="flex items-center gap-2 mt-1.5">
              <button 
                type="button" 
                onClick={handlePrevDay} 
                className="flex items-center justify-center h-[44px] w-[44px] bg-white border border-border rounded-lg text-muted-foreground hover:bg-muted hover:text-icsn-navy transition shadow-sm"
                title="วันก่อนหน้า"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <input
                type="date"
                value={dailyDate}
                onChange={e => setDailyDate(e.target.value)}
                className="block px-3 h-[44px] border border-border rounded-lg focus:border-icsn-teal focus:ring-2 focus:ring-icsn-teal/30 outline-none bg-white text-icsn-navy transition shadow-sm font-bold cursor-pointer text-base"
              />
              <button 
                type="button" 
                onClick={handleNextDay} 
                className="flex items-center justify-center h-[44px] w-[44px] bg-white border border-border rounded-lg text-muted-foreground hover:bg-muted hover:text-icsn-navy transition shadow-sm"
                title="วันถัดไป"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Session chips */}
          <div className="flex-1">
            <AdminFieldLabel>รอบเวลา</AdminFieldLabel>
            {sessions.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-1.5">
                {sessions.map(sess => (
                  <button
                    key={sess.id}
                    type="button"
                    onClick={() => setSelectedSessionId(sess.id)}
                    className={`px-5 h-[44px] rounded-lg text-base font-bold transition-all border flex items-center gap-2 cursor-pointer ${
                      selectedSessionId === sess.id
                        ? 'bg-icsn-teal text-white border-icsn-teal ring-2 ring-icsn-teal/20'
                        : 'bg-white text-muted-foreground border-border hover:bg-muted hover:border-muted-foreground/30'
                    }`}
                  >
                    {sess.time_label}
                    <span className={`text-sm px-2 py-0.5 rounded-full ${
                      selectedSessionId === sess.id ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {sess.booked_count || 0}/{sess.total_capacity}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-1.5 text-muted-foreground text-base p-3 bg-muted/50 rounded-lg border border-dashed border-border">
                ไม่มีรอบเรียนในวันนี้ หรือวันนี้เป็นวันหยุด
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Prompt if no session selected */}
      {!selectedSessionId && sessions.length > 0 && (
        <div className="text-center py-8 bg-white/50 border-2 border-dashed border-border rounded-xl">
          <p className="font-bold text-muted-foreground text-base animate-pulse">👆 กรุณาเลือกรอบเวลาด้านบน</p>
        </div>
      )}
    </>
  );
}

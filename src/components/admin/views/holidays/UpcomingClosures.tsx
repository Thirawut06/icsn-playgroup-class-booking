import React from 'react';
import { CalendarX, Trash2 } from 'lucide-react';
import type { SchoolClosure } from '@/types';

interface UpcomingClosuresProps {
  closures: SchoolClosure[];
  handleDeleteClosure: (id: string | string[]) => void;
}

export function UpcomingClosures({ closures, handleDeleteClosure }: UpcomingClosuresProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingClosures = closures
    .filter(c => c.end_date >= todayStr && !c.time_label)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  // Simplify the complex reduce logic from the original file
  const groupedClosures = upcomingClosures.reduce((acc, curr) => {
    if (acc.length === 0) return [{ ...curr }];
    const last = acc[acc.length - 1];
    const diffDays = Math.ceil(
      Math.abs(new Date(curr.start_date).getTime() - new Date(last.end_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1 && last.is_force_open === curr.is_force_open && last.reason === curr.reason) {
      last.end_date = curr.end_date;
      // Combine IDs so we can delete the whole group at once
      if (!last.originalIds) {
        last.originalIds = [last.id];
      }
      last.originalIds.push(curr.id);
    } else {
      acc.push({ ...curr, originalIds: [curr.id] });
    }
    return acc;
  }, [] as (SchoolClosure & { originalIds?: string[] })[]);

  function formatDisplayDateStr(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  }

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-[300px]">
      <div className="p-3 sm:p-4 border-b border-border bg-muted/50">
        <h4 className="font-bold text-icsn-navy text-base sm:text-lg flex items-center justify-between">
          รายการการตั้งค่าพิเศษที่กำลังจะมาถึง
          <span className="bg-icsn-navy text-white text-[10px] px-2 py-0.5 rounded-full">
            {groupedClosures.length} รายการ
          </span>
        </h4>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-muted/10">
        {groupedClosures.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/60 space-y-2">
            <CalendarX className="w-8 h-8 opacity-20" />
            <p className="text-sm">ยังไม่มีการตั้งค่าวันหยุดพิเศษ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupedClosures.map((closure, idx) => (
              <div key={idx} className="bg-white p-3 sm:p-4 rounded-xl border border-border flex items-start justify-between group shadow-sm hover:border-icsn-teal/30 transition-colors">
                <div className="space-y-1 sm:space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${closure.is_force_open ? 'bg-success' : 'bg-error'}`} />
                    <span className="font-bold text-icsn-navy text-xs sm:text-sm">
                      {formatDisplayDateStr(closure.start_date)}
                      {closure.start_date !== closure.end_date && ` - ${formatDisplayDateStr(closure.end_date)}`}
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    <span className={`font-semibold ${closure.is_force_open ? 'text-success/80' : 'text-error/80'} mr-2`}>
                      {closure.is_force_open ? 'เปิดทำการพิเศษ' : 'ปิดทำการ'}
                    </span>
                    {closure.reason && `• ${closure.reason}`}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteClosure(closure.originalIds || closure.id)}
                  className="p-2 text-muted-foreground hover:text-error hover:bg-error/10 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0"
                  title="ลบการตั้งค่านี้"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { getThaiMonthName } from '@/utils/dateUtils';

interface AdminCalendarWidgetProps {
  selectedDate: string;
  onDateSelect: (dateStr: string) => void;
  blockoutDates: string[];
}

export function AdminCalendarWidget({ selectedDate, onDateSelect, blockoutDates }: AdminCalendarWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse selected date
  const selDateObj = new Date(selectedDate);
  const formattedSelected = `${selDateObj.getDate()} ${getThaiMonthName(selDateObj)} ${selDateObj.getFullYear() + 543}`;

  // Current view date
  const currentViewDate = new Date();
  currentViewDate.setMonth(currentViewDate.getMonth() + monthOffset);
  const monthName = getThaiMonthName(currentViewDate);
  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  const handleOutsideClick = (e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Reset offset when opened
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const sel = new Date(selectedDate);
      const diffMonths = (sel.getFullYear() - now.getFullYear()) * 12 + (sel.getMonth() - now.getMonth());
      setMonthOffset(diffMonths);
    }
  }, [isOpen, selectedDate]);

  const getDaysInMonth = () => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push(dateStr);
    }
    return days;
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 h-[48px] border border-border rounded-xl focus:border-icsn-teal focus:ring-1 focus:ring-icsn-teal bg-white text-foreground transition shadow-sm font-semibold cursor-pointer flex items-center justify-between hover:bg-slate-50"
      >
        <span>{formattedSelected}</span>
        <CalendarIcon className="w-5 h-5 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute top-[54px] left-0 z-50 w-[300px] bg-white rounded-2xl border border-border shadow-2xl p-4 animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setMonthOffset(prev => prev - 1)}
              className="p-1.5 hover:bg-muted rounded-xl transition text-icsn-navy"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h4 className="text-sm font-bold text-icsn-navy">
              {monthName} {year + 543}
            </h4>
            <button
              onClick={() => setMonthOffset(prev => prev + 1)}
              className="p-1.5 hover:bg-muted rounded-xl transition text-icsn-navy"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-muted-foreground mb-2">
            <div>อา</div><div>จ</div><div>อ</div><div>พ</div><div>พฤ</div><div>ศ</div><div>ส</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-sm font-bold">
            {getDaysInMonth().map((dateStr, i) => {
              if (!dateStr) return <div key={`empty-${i}`} className="p-2"></div>;

              const isSelected = selectedDate === dateStr;
              const dObj = new Date(dateStr);
              const dayNum = dObj.getDate();
              
              const isBlockout = blockoutDates.includes(dateStr);
              const isPast = dObj < new Date(new Date().setHours(0, 0, 0, 0));

              let btnClass = "hover:bg-muted text-foreground";
              let dotClass = "hidden";

              if (isSelected) {
                btnClass = "bg-icsn-teal text-white shadow-md scale-[1.05]";
              } else if (isBlockout) {
                btnClass = "text-error hover:bg-error/10";
                dotClass = "block bg-error";
              } else if (isPast) {
                btnClass = "text-muted-foreground/50 hover:bg-muted";
              }

              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    onDateSelect(dateStr);
                    setIsOpen(false);
                  }}
                  className={`relative w-8 h-8 mx-auto rounded-full flex items-center justify-center transition-all ${btnClass}`}
                  title={isBlockout ? 'วันหยุด / ปิดทำการ' : ''}
                >
                  {dayNum}
                  {isBlockout && !isSelected && (
                     <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${dotClass}`}></span>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="mt-4 pt-3 border-t flex gap-3 text-xs text-muted-foreground justify-center">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-error"></span> วันหยุด</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-icsn-teal"></span> เลือกอยู่</span>
          </div>
        </div>
      )}
    </div>
  );
}

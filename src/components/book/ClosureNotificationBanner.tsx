"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronDown, ChevronUp, X, Megaphone } from 'lucide-react';

interface Closure {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  time_label: string | null;
  created_at: string;
}

export function ClosureNotificationBanner() {
  const [closures, setClosures] = useState<Closure[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = sessionStorage.getItem('hidden_closures');
    if (stored) {
      try {
        setHiddenIds(new Set(JSON.parse(stored)));
      } catch (e) {
        // ignore JSON parse error
      }
    }

    async function fetchClosures() {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('school_closures')
        .select('*')
        .gte('end_date', today)
        .order('start_date', { ascending: true });
        
      if (!error && data) {
        setClosures(data);
      }
    }
    fetchClosures();
  }, []);

  const handleDismiss = () => {
    const newHidden = new Set(hiddenIds);
    closures.forEach(c => newHidden.add(c.id));
    setHiddenIds(newHidden);
    sessionStorage.setItem('hidden_closures', JSON.stringify(Array.from(newHidden)));
  };

  if (!mounted || closures.length === 0) return null;

  const visibleClosures = closures.filter(c => !hiddenIds.has(c.id));

  if (visibleClosures.length === 0) return null;

  const displayClosures = expanded ? visibleClosures : visibleClosures.slice(0, 1);

  return (
    <div className="mx-4 mb-6 mt-4 py-4 border-y border-slate-200/80 flex flex-col gap-3 relative animate-in fade-in slide-in-from-top-2 duration-300">
      
      {/* Header & Dismiss */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-slate-800">
          <Megaphone className="w-4.5 h-4.5 text-amber-500 shrink-0" />
          <h4 className="font-bold text-sm">ประกาศวันหยุด</h4>
        </div>
        <button 
          onClick={handleDismiss}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Closures List */}
      <div className="flex flex-col gap-2.5 px-2">
        {displayClosures.map((c) => {
          const isFullDay = !c.time_label;
          
          // Format dates simply: "6–10 ก.ค." or "10 ก.ค."
          const formatShortDate = (dateStr: string) => {
            const d = new Date(dateStr);
            return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
          };
          
          const sDate = formatShortDate(c.start_date);
          const eDate = formatShortDate(c.end_date);
          const dateDisplay = c.start_date === c.end_date ? sDate : `${sDate} – ${eDate}`;
          const timeStr = c.time_label ? `หยุดรอบ ${c.time_label}` : 'หยุดทั้งวัน';

          return (
            <div 
              key={c.id} 
              className="text-sm text-slate-700 flex items-start gap-2 py-0.5 leading-relaxed"
            >
              <span className="shrink-0 mt-2 h-1.5 w-1.5 rounded-full bg-slate-400"></span>
              <p className="break-words text-slate-700">
                วันที่ <span className="font-bold text-slate-900">{dateDisplay}</span>{' '}
                <span className="font-bold text-slate-900">{timeStr}</span>{' '}
                เนื่องจาก <span className="text-slate-800">{c.reason}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Expand/Collapse Toggle */}
      {visibleClosures.length > 1 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors mt-1"
        >
          {expanded ? (
            <>ย่อการแจ้งเตือน <ChevronUp className="w-3.5 h-3.5" /></>
          ) : (
            <>แสดงอีก {visibleClosures.length - 1} รายการ <ChevronDown className="w-3.5 h-3.5" /></>
          )}
        </button>
      )}
    </div>
  );
}

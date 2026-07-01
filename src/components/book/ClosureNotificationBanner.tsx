"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';



interface Closure {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
}

export function ClosureNotificationBanner() {
  const [closures, setClosures] = useState<Closure[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchClosures() {
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Fetch upcoming or current full-day closures
      const { data: fullDayData, error: fullDayError } = await supabase
        .from('school_closures')
        .select('*')
        .gte('end_date', today)
        .order('start_date', { ascending: true });
        
      // 2. Fetch upcoming single-session closures
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('id, session_date, theme, time_label')
        .eq('is_active', false)
        .not('theme', 'is', null)
        .gte('session_date', today)
        .order('session_date', { ascending: true });

      let combined: Closure[] = [];
      
      if (!fullDayError && fullDayData) {
        combined = [...fullDayData];
      }
      
      if (!sessionError && sessionData) {
        // Map session data to Closure format
        const mappedSessions = sessionData.map(s => ({
          id: s.id,
          start_date: s.session_date,
          end_date: s.session_date,
          reason: `${s.time_label}: ${s.theme}`
        }));
        combined = [...combined, ...mappedSessions];
      }
      
      // Sort combined array by start_date
      combined.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
      
      setClosures(combined);
    }
    fetchClosures();
  }, []);

  if (closures.length === 0) return null;

  const displayClosures = expanded ? closures : closures.slice(0, 1);

  return (
    <div className="mx-4 mb-4 mt-2">
      <div className="border-l-2 border-error bg-error/5 px-3 py-2.5 rounded-r-lg flex items-start gap-2">
        <span className="text-sm mt-0.5 leading-none">⚠️</span>
        <div className="flex-1 min-w-0">
          <div className="space-y-1">
            {displayClosures.map(c => {
              const sDate = new Date(c.start_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
              const eDate = new Date(c.end_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
              const dateStr = c.start_date === c.end_date ? sDate : `${sDate}\u2013${eDate}`;

              return (
                <p key={c.id} className="text-xs text-muted-foreground leading-normal">
                  <span className="font-bold text-foreground mr-1.5">วันหยุดโรงเรียน ({dateStr}):</span>
                  <span>{c.reason}</span>
                </p>
              );
            })}
          </div>

          {closures.length > 1 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1.5 text-[11px] font-bold text-error/80 hover:text-error transition-colors"
            >
              {expanded ? 'ย่อลง' : `+${closures.length - 1} วันหยุดเพิ่มเติม ▾`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

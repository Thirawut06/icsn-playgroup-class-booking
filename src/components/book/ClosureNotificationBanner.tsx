"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

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
      // Fetch upcoming or current closures
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

  if (closures.length === 0) return null;

  const displayClosures = expanded ? closures : closures.slice(0, 1);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-error/95 text-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] backdrop-blur-md pb-safe border-t border-error-light/30">
      <div className="max-w-[480px] mx-auto w-full px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-1.5 bg-white/20 rounded-full shrink-0">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm mb-1 font-outfit tracking-wide flex items-center justify-between">
              <span>SCHOOL CLOSURE NOTICE</span>
              {closures.length > 1 && (
                <button 
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs font-semibold bg-white/20 hover:bg-white/30 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                >
                  {expanded ? 'Show Less' : `+${closures.length - 1} More`}
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              {displayClosures.map(c => {
                const sDate = new Date(c.start_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
                const eDate = new Date(c.end_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
                const dateStr = c.start_date === c.end_date ? sDate : `${sDate} - ${eDate}`;
                
                return (
                  <div key={c.id} className="text-sm">
                    <span className="font-bold bg-white/20 px-1.5 py-0.5 rounded text-xs mr-2">{dateStr}</span>
                    <span className="opacity-90">{c.reason}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { AdminService } from '@/lib/supabase';
import type { SchoolClosure, Session, SessionTemplate } from '@/types';
import { DailySessionManager } from './DailySessionManager';
import { UpcomingClosures } from './UpcomingClosures';

interface ClosureAndSessionPanelsProps {
  selectionMode: 'range' | 'multi';
  rangeStart: string;
  rangeEnd: string;
  multiDates: string[];
  sessions: Session[];
  closures: SchoolClosure[];
  fetchData: () => Promise<void>;
  handleDeleteClosure: (id: string | string[]) => void;
}

export function ClosureAndSessionPanels({
  selectionMode,
  rangeStart,
  rangeEnd,
  multiDates,
  sessions,
  closures,
  fetchData,
  handleDeleteClosure
}: ClosureAndSessionPanelsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);

  useEffect(() => {
    let targetDate = null;
    if (selectionMode === 'range' && rangeStart && rangeEnd && rangeStart === rangeEnd) targetDate = rangeStart;
    else if (selectionMode === 'multi' && multiDates.length === 1) targetDate = multiDates[0];

    if (targetDate) {
      AdminService.getSessionTemplates().then(data => {
        if (data) setTemplates(data);
      });
      const hasSessions = sessions.some(s => s.session_date === targetDate);
      if (!hasSessions) {
        setIsGenerating(true);
        import('@/lib/domain/adapters/SupabaseSessionAdapter').then(async ({ SupabaseSessionAdapter }) => {
          try {
            const adapter = new SupabaseSessionAdapter();
            const newSessions = await adapter.getOrCreateSessionsForDate(targetDate!);
            if (newSessions.length > 0) {
              await fetchData();
            }
          } catch (e) {
            console.error('Failed to auto-generate sessions:', e);
          } finally {
            setIsGenerating(false);
          }
        });
      } else {
        setIsGenerating(false);
      }
    }
  }, [selectionMode, rangeStart, rangeEnd, multiDates, sessions, fetchData]);

  return (
    <>
      {/* 3. Daily Command Center: Time Slots */}
      {((selectionMode === 'range' && rangeStart && rangeEnd && rangeStart === rangeEnd) ||
        (selectionMode === 'multi' && multiDates.length === 1)) && (() => {
          const targetDate = selectionMode === 'multi' ? multiDates[0] : rangeStart;
          return (
            <DailySessionManager 
              targetDate={targetDate}
              sessions={sessions}
              templates={templates}
              isGenerating={isGenerating}
              fetchData={fetchData}
            />
          );
        })()}

      {/* 4. Upcoming Closures List */}
      <UpcomingClosures 
        closures={closures} 
        handleDeleteClosure={handleDeleteClosure} 
      />
    </>
  );
}

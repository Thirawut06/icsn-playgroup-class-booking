import type { Session } from '@/types';
import { ISessionRepository } from '../ports/ISessionRepository';
import { CLASS_CONFIG } from '@/config/constants';

export class SessionModule {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  /**
   * Reconciles the database state with active session templates for a given date.
   * Ensures that sessions reflect the latest templates, unless a session is already booked.
   */
  async getOrCreateSessionsForDate(dateStr: string): Promise<Session[]> {
    // 1. Fetch active session templates
    const templates = await this.sessionRepository.fetchTemplates();

    // 2. Fetch existing sessions
    const existing = await this.sessionRepository.fetchSessionsForDate(dateStr);

    // Sessions with bookings are "locked" — never touch these
    const lockedSessions = existing.filter(s => (s.booked_count || 0) > 0);

    // If no templates exist, return locked sessions or fallback to default
    if (!templates || templates.length === 0) {
      if (lockedSessions.length > 0) return lockedSessions;

      const newSessions = await this.sessionRepository.insertSessions([{
        session_date: dateStr,
        time_label: CLASS_CONFIG.DEFAULT_TIME_LABEL,
        total_capacity: CLASS_CONFIG.DEFAULT_CAPACITY,
        is_active: true
      }]);
      return newSessions;
    }

    // 3. Delete all empty (no bookings) sessions for this date
    const emptySessions = existing.filter(s => (s.booked_count || 0) === 0);
    if (emptySessions.length > 0) {
      await this.sessionRepository.deleteSessions(emptySessions.map(s => s.id));
    }

    // 4. Determine which templates need new sessions
    const lockedLabels = new Set(lockedSessions.map(s => s.time_label));
    const neededTemplates = templates.filter(t => !lockedLabels.has(t.time_label));

    if (neededTemplates.length === 0) {
      return lockedSessions.sort((a, b) => (a.time_label || '').localeCompare(b.time_label || ''));
    }

    // 5. Insert fresh sessions from current templates
    const sessionsToInsert = neededTemplates.map(t => ({
      session_date: dateStr,
      time_label: t.time_label,
      total_capacity: t.capacity,
      is_active: true
    }));

    const newSessions = await this.sessionRepository.insertSessions(sessionsToInsert);

    // Combine locked + fresh, sort by time
    const allSessions = [...lockedSessions, ...newSessions];
    return allSessions.sort((a, b) => (a.time_label || '').localeCompare(b.time_label || ''));
  }

  async updateSessionCapacity(sessionId: string, totalCapacity: number): Promise<Session> {
    return this.sessionRepository.updateSessionCapacity(sessionId, totalCapacity);
  }

  async toggleSessionActive(sessionId: string, isActive: boolean): Promise<void> {
    return this.sessionRepository.toggleSessionActive(sessionId, isActive);
  }
}


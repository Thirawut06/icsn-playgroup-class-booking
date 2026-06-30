import type { Session, SessionTemplate } from '@/types';

export interface ISessionRepository {
  /**
   * Fetch all active session templates.
   */
  fetchTemplates(): Promise<SessionTemplate[]>;

  /**
   * Fetch all existing sessions for a given date.
   */
  fetchSessionsForDate(dateStr: string): Promise<Session[]>;

  /**
   * Delete empty sessions by their IDs.
   */
  deleteSessions(ids: string[]): Promise<void>;

  /**
   * Insert new sessions.
   */
  insertSessions(sessions: Omit<Session, 'id' | 'booked_count'>[]): Promise<Session[]>;

  /**
   * Toggle session active status.
   */
  toggleSessionActive(sessionId: string, isActive: boolean): Promise<void>;

  /**
   * Update session total capacity.
   */
  updateSessionCapacity(sessionId: string, totalCapacity: number): Promise<Session>;
}

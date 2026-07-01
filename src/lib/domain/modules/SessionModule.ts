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
    return this.sessionRepository.getOrCreateSessionsForDate(dateStr);
  }

  async updateSessionCapacity(sessionId: string, totalCapacity: number): Promise<Session> {
    return this.sessionRepository.updateSessionCapacity(sessionId, totalCapacity);
  }

  async toggleSessionActive(sessionId: string, isActive: boolean): Promise<void> {
    return this.sessionRepository.toggleSessionActive(sessionId, isActive);
  }

  async adminCloseSession(sessionId: string, reason: string): Promise<void> {
    return this.sessionRepository.adminCloseSession(sessionId, reason);
  }
}


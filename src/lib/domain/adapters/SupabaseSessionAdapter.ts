import { supabase } from '../../supabase';
import type { Session, SessionTemplate } from '@/types';
import { ISessionRepository } from '../ports/ISessionRepository';
import { AppError } from '../../utils';

export class SupabaseSessionAdapter implements ISessionRepository {
  async fetchTemplates(): Promise<SessionTemplate[]> {
    const { data, error } = await supabase
      .from('session_templates')
      .select('id, time_label, capacity, is_active, created_at')
      .eq('is_active', true)
      .order('time_label', { ascending: true });
    
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    return data || [];
  }

  async fetchSessionsForDate(dateStr: string): Promise<Session[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('id, session_date, time_label, total_capacity, booked_count, is_active, theme, activity_desc')
      .eq('session_date', dateStr)
      .order('time_label', { ascending: true });
      
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    return data || [];
  }

  async getOrCreateSessionsForDate(dateStr: string): Promise<Session[]> {
    const { data, error } = await supabase.rpc('get_or_create_sessions_for_date', { p_date: dateStr });
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    return data || [];
  }

  async deleteSessions(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const { error } = await supabase
      .from('sessions')
      .delete()
      .in('id', ids);
      
    if (error) throw new AppError(error.message || 'Failed to delete sessions', error.code, error);
  }

  async insertSessions(sessions: Omit<Session, 'id' | 'booked_count'>[]): Promise<Session[]> {
    if (!sessions.length) return [];
    const { data, error } = await supabase
      .from('sessions')
      .insert(sessions)
      .select();
      
    if (error) throw new AppError(error.message || 'Failed to insert sessions', error.code, error);
    return data || [];
  }

  async toggleSessionActive(sessionId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .update({ is_active: isActive })
      .eq('id', sessionId);
    if (error) throw new AppError(error.message || 'Failed to toggle session', error.code, error);
  }

  async updateSessionCapacity(sessionId: string, totalCapacity: number, trialCapacity?: number): Promise<Session> {
    const { data, error } = await supabase.functions.invoke('admin-actions', {
      body: { action: 'update-session', payload: { sessionId, totalCapacity, trialCapacity } }
    });
    
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data.session as Session;
  }

  async adminCloseSession(sessionId: string, reason: string): Promise<void> {
    const { data, error } = await supabase.rpc('admin_close_session', {
      p_session_id: sessionId,
      p_reason: reason
    });
    if (error) throw new AppError(error.message || 'Failed to close session', error.code, error);
    if (data && data.success === false) throw new Error(data.error || 'Failed to close session');
  }
}

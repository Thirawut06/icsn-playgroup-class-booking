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

  async updateSessionCapacity(sessionId: string, totalCapacity: number): Promise<Session> {
    const { data, error } = await supabase.functions.invoke('admin-actions', {
      body: { action: 'update-session', payload: { sessionId, totalCapacity } }
    });
    
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data.session as Session;
  }
}

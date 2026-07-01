import { supabase } from '../supabase';
import { Session } from '../../types';
import { CLASS_CONFIG } from '@/config/constants';
import { AppError } from '../utils';

export const AdminSessionService = {
  async getSessionForDate(dateStr: string, timeLabel: string = CLASS_CONFIG.DEFAULT_TIME_LABEL): Promise<Session | null> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_date', dateStr)
      .eq('time_label', timeLabel)
      .maybeSingle();
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    return data;
  },

  async getBlockoutDates(): Promise<{ id: string; block_date: string; reason: string | null }[]> {
    const { data, error } = await supabase
      .from('blockout_dates')
      .select('*')
      .order('block_date', { ascending: true });
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    return data || [];
  },

  async getSchoolClosures(): Promise<{ id: string; start_date: string; end_date: string; reason: string }[]> {
    const { data, error } = await supabase
      .from('school_closures')
      .select('*')
      .order('start_date', { ascending: true });
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    return data || [];
  },

  async bulkCloseDays(startDate: string, endDate: string, reason: string): Promise<void> {
    const { data, error } = await supabase.rpc('bulk_close_days', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_reason: reason
    });
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    if (data && data.success === false) throw new Error(data.error || 'Bulk close failed');
  },

  async bulkReopenDays(startDate: string, endDate: string): Promise<void> {
    const { error } = await supabase.rpc('bulk_reopen_days', {
      p_start_date: startDate,
      p_end_date: endDate
    });
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
  },

  async addBlockoutDate(blockDate: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('blockout_dates')
      .insert({ block_date: blockDate, reason: reason || null });
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
  },

  async removeBlockoutDate(id: string): Promise<void> {
    const { error } = await supabase
      .from('blockout_dates')
      .delete()
      .eq('id', id);
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
  },

  async toggleSessionActive(sessionId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .update({ is_active: isActive })
      .eq('id', sessionId);
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
  },

  async getSessionTemplates() {
    const { data, error } = await supabase
      .from('session_templates')
      .select('*')
      .order('time_label', { ascending: true });
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    return data;
  },

  async addSessionTemplate(timeLabel: string, capacity: number): Promise<void> {
    const { error } = await supabase
      .from('session_templates')
      .insert([{ time_label: timeLabel, capacity, is_active: true }]);
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
  },

  async updateSessionTemplate(id: string, updates: { time_label?: string; capacity?: number; is_active?: boolean; }): Promise<void> {
    const { error } = await supabase
      .from('session_templates')
      .update(updates)
      .eq('id', id);
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
  },

  async deleteSessionTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('session_templates')
      .delete()
      .eq('id', id);
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
  }
};

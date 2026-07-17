import { supabase } from '../supabase';
import { Session } from '../../types';
import { CLASS_CONFIG } from '@/config/constants';
import { AppError } from '../utils';
import { sessionModule } from '../domain';

export const AdminSessionService = {
  async getSessionForDate(dateStr: string, timeLabel: string = CLASS_CONFIG.DEFAULT_TIME_LABEL): Promise<Session | null> {
    const { data, error } = await supabase
      .from('sessions')
      .select('id, session_date, time_label, total_capacity, booked_count, is_active, theme, activity_desc')
      .eq('session_date', dateStr)
      .eq('time_label', timeLabel)
      .maybeSingle();
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    return data;
  },

  async getSessionsForSpecificDate(dateStr: string): Promise<Session[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('id, session_date, time_label, total_capacity, trial_capacity, booked_count, is_active')
      .eq('session_date', dateStr)
      .order('time_label', { ascending: true });
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    return data || [];
  },

  async createCustomSession(dateStr: string, timeLabel: string, capacity: number): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .insert([
        {
          session_date: dateStr,
          time_label: timeLabel,
          total_capacity: capacity,
          trial_capacity: capacity, // Use same for trial capacity as a default for custom sessions
          is_active: true,
          booked_count: 0,
          trial_booked_count: 0
        }
      ]);
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
  },

  async getBlockoutDates(): Promise<{ id: string; block_date: string; reason: string | null }[]> {
    const { data, error } = await supabase
      .from('blockout_dates')
      .select('id, block_date, reason')
      .order('block_date', { ascending: true });
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    return data || [];
  },

  async getSchoolClosures(): Promise<{ id: string; start_date: string; end_date: string; reason: string; time_label: string | null; is_force_open: boolean }[]> {
    const { data, error } = await supabase
      .from('school_closures')
      .select('id, start_date, end_date, reason, time_label, is_force_open')
      .order('start_date', { ascending: true });
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    return data || [];
  },

  async setDateStatus(startDate: string, endDate: string, isOpen: boolean, reason?: string, timeLabel?: string): Promise<void> {
    const { data, error } = await supabase.rpc('set_date_status', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_is_open: isOpen,
      p_reason: reason || null,
      p_time_label: timeLabel || null
    });
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    if (data && data.success === false) throw new Error(data.error || 'Set date status failed');
  },

  async bulkReopenDays(startDate: string, endDate: string): Promise<void> {
    const { error } = await supabase.rpc('bulk_reopen_days', {
      p_start_date: startDate,
      p_end_date: endDate
    });
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
  },

  async bulkReopenSpecificDays(dates: string[]): Promise<void> {
    if (dates.length === 0) return;
    const { error } = await supabase
      .from('sessions')
      .update({ is_active: true, theme: null })
      .in('session_date', dates);
    if (error) throw new AppError(error.message || 'Failed to update sessions', error.code, error);
  },

  async deleteSchoolClosure(id: string): Promise<void> {
    const { data, error } = await supabase.rpc('delete_school_closure', {
      p_closure_id: id
    });
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    if (data && data.success === false) throw new Error(data.error || 'Delete closure failed');
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
    await sessionModule.toggleSessionActive(sessionId, isActive);
  },

  async updateSessionCapacity(sessionId: string, totalCapacity: number): Promise<void> {
    await sessionModule.updateSessionCapacity(sessionId, totalCapacity);
  },

  async getSessionTemplates() {
    const { data, error } = await supabase
      .from('session_templates')
      .select('id, time_label, capacity, trial_capacity, is_active, created_at')
      .order('time_label', { ascending: true });
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    return data;
  },

  async addSessionTemplate(timeLabel: string, capacity: number, trialCapacity: number): Promise<void> {
    const { error } = await supabase
      .from('session_templates')
      .insert([{ time_label: timeLabel, capacity, trial_capacity: trialCapacity, is_active: true }]);
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
  },

  async updateSessionTemplate(id: string, updates: { time_label?: string; capacity?: number; trial_capacity?: number; is_active?: boolean; }): Promise<void> {
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

import { supabase } from '../supabase';
import { Session, Booking, SessionTemplate, ConfirmedBookingRow } from '../../types';
import { BOOKING_STATUS, CLASS_CONFIG } from '@/config/constants';
import { AppError } from '../utils';

export const BookingService = {
  async getSessions(startDate: string, endDate: string): Promise<Session[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('id, session_date, time_label, total_capacity, trial_capacity, booked_count, is_active, theme, activity_desc')
      .gte('session_date', startDate)
      .lte('session_date', endDate)
      .order('session_date', { ascending: true });
    
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    return data || [];
  },

  async getSchoolClosures(): Promise<import('@/types').SchoolClosure[]> {
    const { data, error } = await supabase
      .from('school_closures')
      .select('id, start_date, end_date, reason, time_label, is_force_open');
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    return data || [];
  },


  async getBookings(parentId: string): Promise<Booking[]> {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, session_id, child_id, parent_id, session_date, status, booking_date, child_name_snapshot, parent_phone_snapshot,
        session:sessions!inner(id, session_date, time_label, total_capacity, booked_count, is_active, theme, activity_desc),
        child:children!inner(id, parent_id, nickname, full_name, dob, age, food_allergy, media_perm, no_photo_perm, parent_photo_url, photo_url, special_info)
      `)
      .eq('parent_id', parentId)
      .eq('status', BOOKING_STATUS.CONFIRMED)
      .gte('session_date', today)
      .order('session_date', { ascending: true });
      
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    return (data as unknown) as Booking[];
  },


  async getConfirmedBookingsForDate(dateStr: string): Promise<ConfirmedBookingRow[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        session_date,
        child:children(nickname),
        parent:parents(name, phone)
      `)
      .eq('session_date', dateStr)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: true });
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);

    return (data || []).map((row: any) => ({
      id: row.id,
      session_date: row.session_date,
      parent_name: row.parent?.name || '-',
      parent_phone: row.parent?.phone || '-',
      child_nickname: row.child?.nickname || '-',
    }));
  },

  async getAllActiveBookings(): Promise<ConfirmedBookingRow[]> {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        session_date,
        child:children!inner(id, nickname),
        parent:parents!inner(id, name, phone)
      `)
      .gte('session_date', today)
      .eq('status', 'confirmed')
      .order('session_date', { ascending: true });

    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    
    return (data || []).map((row: any) => ({
      id: row.id,
      session_date: row.session_date,
      parent_name: row.parent?.name || '-',
      parent_phone: row.parent?.phone || '-',
      child_nickname: row.child?.nickname || '-',
    }));
  },

  async searchActiveBookings(searchTerm: string): Promise<ConfirmedBookingRow[]> {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
    
    const { data: parents } = await supabase
      .from('parents')
      .select('id')
      .ilike('phone', `%${searchTerm}%`);
      
    const { data: children } = await supabase
      .from('children')
      .select('id')
      .ilike('nickname', `%${searchTerm}%`);

    const parentIds = (parents || []).map((p: { id: string }) => p.id);
    const childIds = (children || []).map((c: { id: string }) => c.id);

    if (parentIds.length === 0 && childIds.length === 0) {
      return [];
    }

    let query = supabase
      .from('bookings')
      .select(`
        id,
        session_date,
        child:children!inner(id, nickname),
        parent:parents!inner(id, name, phone)
      `)
      .gte('session_date', today)
      .eq('status', 'confirmed');
      
    if (parentIds.length > 0 && childIds.length > 0) {
      query = query.or(`parent_id.in.(${parentIds.join(',')}),child_id.in.(${childIds.join(',')})`);
    } else if (parentIds.length > 0) {
      query = query.in('parent_id', parentIds);
    } else if (childIds.length > 0) {
      query = query.in('child_id', childIds);
    }

    const { data, error } = await query.order('session_date', { ascending: true });
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);

    return (data || []).map((row: any) => ({
      id: row.id,
      session_date: row.session_date,
      parent_name: row.parent?.name || '-',
      parent_phone: row.parent?.phone || '-',
      child_nickname: row.child?.nickname || '-',
    }));
  }
};

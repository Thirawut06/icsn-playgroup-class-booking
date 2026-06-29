import { supabase } from '../supabase';
import { Session, Booking } from '../../types';
import { BOOKING_STATUS, CLASS_CONFIG } from '@/config/constants';

export const BookingService = {
  async getSessions(startDate: string, endDate: string): Promise<Session[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .gte('session_date', startDate)
      .lte('session_date', endDate)
      .order('session_date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getBlockoutDates(): Promise<string[]> {
    const { data, error } = await supabase
      .from('blockout_dates')
      .select('block_date');
    if (error) throw error;
    return (data || []).map((d: any) => d.block_date);
  },

  async getOrCreateSession(dateStr: string, timeLabel: string = CLASS_CONFIG.DEFAULT_TIME_LABEL): Promise<Session> {
    const { data: existing, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_date', dateStr)
      .eq('time_label', timeLabel)
      .maybeSingle();
      
    if (existing) return existing;

    const { data: newSession, error: insertError } = await supabase
      .from('sessions')
      .insert([{
        session_date: dateStr,
        time_label: timeLabel,
        total_capacity: CLASS_CONFIG.DEFAULT_CAPACITY,
        is_active: true
      }])
      .select()
      .single();

    if (insertError) throw insertError;
    return newSession;
  },

  async hasDuplicateBooking(childId: string, sessionId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', childId)
      .eq('session_id', sessionId)
      .eq('status', BOOKING_STATUS.CONFIRMED);
    if (error) throw error;
    return (count || 0) > 0;
  },

  async getBookings(parentId: string): Promise<Booking[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        session:sessions!inner(*),
        child:children!inner(*)
      `)
      .eq('parent_id', parentId)
      .eq('status', BOOKING_STATUS.CONFIRMED)
      .gte('session_date', today)
      .order('session_date', { ascending: true });
      
    if (error) throw error;
    return data || [];
  },

  async bookClass(parentId: string, childId: string, sessionId: string, packageId?: string): Promise<any> {
    // 1. Fetch snapshot data (fallback to 'Unknown' if missing)
    const { data: child } = await supabase.from('children').select('nickname').eq('id', childId).maybeSingle();
    const { data: parent } = await supabase.from('parents').select('phone').eq('id', parentId).maybeSingle();
    
    // 2. Call the new robust transactional RPC
    const { data, error } = await supabase
      .rpc('book_class_transactionally', {
        p_child_id: childId,
        p_session_id: sessionId,
        p_parent_id: parentId,
        p_child_name: child?.nickname || 'Unknown',
        p_parent_phone: parent?.phone || 'Unknown'
      });
      
    if (error) throw error;
    if (data && data.success === false) throw new Error(data.error || 'Booking failed');
    return data;
  },

  async cancelBooking(bookingId: string, parentId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('parent-cancel', {
      body: {
        bookingId,
        parentId,
        cancelReason: 'Cancelled by parent via web UI',
      }
    });

    if (error) {
      // In some cases, Supabase Edge Functions return an error object directly
      throw new Error(error.message || 'Failed to cancel booking');
    }
    
    if (data && data.error) {
      throw new Error(data.error);
    }
  },

  async getConfirmedBookingsForDate(dateStr: string): Promise<any[]> {
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
    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      session_date: row.session_date,
      parent_name: row.parent?.name || '-',
      parent_phone: row.parent?.phone || '-',
      child_nickname: row.child?.nickname || '-',
    }));
  },

  async getAllActiveBookings(): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];
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

    if (error) throw error;
    
    return (data || []).map((row: any) => ({
      id: row.id,
      session_date: row.session_date,
      parent_name: row.parent?.name || '-',
      parent_phone: row.parent?.phone || '-',
      child_nickname: row.child?.nickname || '-',
    }));
  },

  async searchActiveBookings(searchTerm: string): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: parents } = await supabase
      .from('parents')
      .select('id')
      .ilike('phone', `%${searchTerm}%`);
      
    const { data: children } = await supabase
      .from('children')
      .select('id')
      .ilike('nickname', `%${searchTerm}%`);

    const parentIds = (parents || []).map((p: any) => p.id);
    const childIds = (children || []).map((c: any) => c.id);

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
    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      session_date: row.session_date,
      parent_name: row.parent?.name || '-',
      parent_phone: row.parent?.phone || '-',
      child_nickname: row.child?.nickname || '-',
    }));
  }
};

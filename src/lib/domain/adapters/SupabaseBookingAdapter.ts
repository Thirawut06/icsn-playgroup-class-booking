import { supabase } from '../../supabase';
import { IBookingRepository, BookingResult } from '../ports/IBookingRepository';
import { AppError } from '../../utils';
import { BOOKING_STATUS } from '@/config/constants';

export class SupabaseBookingAdapter implements IBookingRepository {
  async hasDuplicateBooking(childId: string, sessionId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', childId)
      .eq('session_id', sessionId)
      .eq('status', BOOKING_STATUS.CONFIRMED)
      .limit(1);
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    return (count || 0) > 0;
  }

  async bookClass(parentId: string, childId: string, sessionId: string): Promise<BookingResult> {
    // 1. Fetch snapshot data (fallback to 'Unknown' if missing)
    const { data: child } = await supabase.from('children').select('nickname').eq('id', childId).maybeSingle();
    const { data: parent } = await supabase.from('parents').select('phone').eq('id', parentId).maybeSingle();

    const { data, error } = await supabase
      .rpc('book_class_transactionally', {
        p_child_id: childId,
        p_session_id: sessionId,
        p_parent_id: parentId,
        p_child_name: child?.nickname || 'Unknown',
        p_parent_phone: parent?.phone || 'Unknown'
      });
      
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    if (data && data.success === false) throw new Error(data.error || 'Booking failed');
    return data as BookingResult;
  }

  async bookClassesBatch(parentId: string, childId: string, sessionIds: string[]): Promise<BookingResult> {
    const { data: child } = await supabase.from('children').select('nickname').eq('id', childId).maybeSingle();
    const { data: parent } = await supabase.from('parents').select('phone').eq('id', parentId).maybeSingle();

    const { data, error } = await supabase
      .rpc('book_classes_batch', {
        p_child_id: childId,
        p_session_ids: sessionIds,
        p_parent_id: parentId,
        p_child_name: child?.nickname || 'Unknown',
        p_parent_phone: parent?.phone || 'Unknown'
      });
      
    if (error) throw new AppError(error.message || 'An error occurred', error.code, error);
    if (data && data.success === false) throw new Error(data.error || 'Batch booking failed');
    return data as BookingResult;
  }

  async adminBookClass(childId: string, sessionId: string, isFree: boolean): Promise<{ booking_id: string }> {
    const { data, error } = await supabase.rpc('admin_book_class', {
      p_child_id: childId,
      p_session_id: sessionId,
      p_is_free: isFree
    });
    if (error) throw error;
    return data;
  }

  async cancelBooking(bookingId: string, parentId?: string, cancelReason?: string): Promise<void> {
    if (parentId) {
      // Parent cancellation via edge function
      const { data, error } = await supabase.functions.invoke('parent-cancel', {
        body: {
          bookingId,
          parentId,
          cancelReason: cancelReason || 'Cancelled by parent via web UI',
        }
      });
      if (error) throw new Error(error.message || 'Failed to cancel booking');
      if (data && data.error) throw new Error(data.error);
    } else {
      // Admin cancellation via edge function
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: { action: 'cancel-booking', payload: { bookingId, cancelReason: cancelReason || 'Cancelled by admin' } }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    }
  }
}

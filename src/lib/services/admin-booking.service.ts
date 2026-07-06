import { supabase } from '../supabase';
import { DailyAttendanceRow, PendingSlipRow, Session } from '../../types';
import { BOOKING_STATUS } from '@/config/constants';
import { AuthState } from '../auth/rbac';

export const AdminBookingService = {
  async adminAddWalkin(phone: string, childName: string): Promise<{ parent_id: string, child_id: string }> {
    const { data, error } = await supabase.rpc('admin_add_walkin', {
      p_phone: phone,
      p_child_name: childName
    });
    if (error) throw error;
    return data;
  },

  async adminSearchWalkin(phone: string): Promise<any> {
    const { data, error } = await supabase.rpc('admin_search_walkin', { p_phone: phone });
    if (error) throw error;
    return data;
  },

  async adminProcessWalkin(options: {
    phone: string;
    childId: string | null;
    childName: string;
    sessionId: string;
    paymentType: 'deduct' | 'paid' | 'trial' | 'paid_package';
    packageName?: string;
  }): Promise<any> {
    const { phone, childId, childName, sessionId, paymentType, packageName } = options;
    const { data, error } = await supabase.rpc('admin_process_walkin', {
      p_phone: phone,
      p_child_id: childId,
      p_child_name: childName,
      p_session_id: sessionId,
      p_payment_type: paymentType,
      p_package_name: packageName || null
    });
    if (error) throw error;
    return data;
  },

  async getRecentBookings(limit = 10): Promise<{
    id: string;
    created_at: string;
    status: string;
    session_date: string;
    time_label: string | null;
    child_nickname: string;
    parent_name: string;
    parent_phone: string;
  }[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        created_at,
        status,
        child_name_snapshot,
        parent_phone_snapshot,
        session:sessions(session_date, time_label),
        child:children(nickname, full_name),
        parent:parents(name, phone)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      created_at: row.created_at,
      status: row.status,
      session_date: row.session?.session_date || '',
      time_label: row.session?.time_label || null,
      child_nickname: row.child?.nickname || row.child?.full_name || row.child_name_snapshot || '(ไม่มีชื่อ)',
      parent_name: row.parent?.name || '-',
      parent_phone: row.parent?.phone || row.parent_phone_snapshot || '-',
    }));
  },

  async getDailyAttendance(sessionId: string): Promise<DailyAttendanceRow[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        created_at,
        signature_url,
        checkin_at,
        child_name_snapshot,
        parent_phone_snapshot,
        child:children(id, nickname, full_name, age, dob, food_allergy),
        parent:parents(name, phone)
      `)
      .eq('session_id', sessionId)
      .eq('status', BOOKING_STATUS.CONFIRMED)
      .order('created_at', { ascending: true });
    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      nickname: row.child?.nickname || row.child_name_snapshot || '(Deleted User)',
      full_name: row.child?.full_name,
      dob: row.child?.dob,
      age: row.child?.age ?? 0,
      food_allergy: row.child?.food_allergy ?? null,
      parent_name: row.parent?.name || '-',
      parent_phone: row.parent?.phone || row.parent_phone_snapshot || '-',
      created_at: row.created_at,
      signature_url: row.signature_url ?? null,
      checkin_at: row.checkin_at ?? null,
    }));
  },

  async getPendingSlips(): Promise<PendingSlipRow[]> {
    const { data: slips, error } = await supabase
      .from('slip_uploads')
      .select(`
        id,
        parent_id,
        file_url,
        status,
        created_at,
        package_id,
        non_refundable,
        parent:parents(name, phone, children(full_name, nickname))
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Fetch package options to map credits since there is no FK
    const { data: packages } = await supabase.from('package_options').select('id, name, credits');
    const packageMap = new Map((packages || []).map((p: any) => [p.name, p.credits]));

    return (slips || []).map((slip: any) => ({
      id: slip.id,
      parent_id: slip.parent_id,
      file_url: slip.file_url,
      status: slip.status,
      created_at: slip.created_at,
      package_id: slip.package_id,
      non_refundable: slip.non_refundable,
      parent_name: slip.parent?.name || '-',
      parent_phone: slip.parent?.phone || '-',
      child_nickname: slip.parent?.children?.[0]?.nickname || slip.parent?.children?.[0]?.full_name || '-',
      credits_to_add: packageMap.get(slip.package_id) || 0
    }));
  },

  async getTransactionHistory(): Promise<import('@/types').TransactionHistoryRow[]> {
    const { data: slips, error } = await supabase
      .from('slip_uploads')
      .select(`
        id,
        parent_id,
        file_url,
        status,
        created_at,
        package_id,
        reviewed_at,
        parent:parents(name, phone, children(full_name, nickname))
      `)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;

    const { data: packages } = await supabase.from('package_options').select('id, name, credits, price');
    const packageMap = new Map((packages || []).map((p: any) => [p.name, p])); // package_id in slip_uploads is actually the package name

    return (slips || []).map((slip: any) => {
      const pkgInfo = packageMap.get(slip.package_id) || { name: slip.package_id, credits: 0, price: 0 };
      const children = slip.parent?.children || [];
      const childrenNames = children.map((c: any) => c.nickname || c.full_name).filter(Boolean).join(', ');

      return {
        id: slip.id,
        parent_id: slip.parent_id,
        parent_name: slip.parent?.name || '-',
        parent_phone: slip.parent?.phone || '-',
        children_nicknames: childrenNames || '-',
        package_name: pkgInfo.name || '-',
        price: pkgInfo.price,
        credits: pkgInfo.credits,
        file_url: slip.file_url,
        status: slip.status,
        created_at: slip.created_at,
        reviewed_at: slip.reviewed_at || null,
      };
    });
  },

  async invokeAdminAction<T = Record<string, unknown>>(
    actionType: string,
    payload: Record<string, unknown> = {}
  ): Promise<T> {
    const { data, error } = await supabase.functions.invoke('admin-actions', {
      body: { action: actionType, payload }
    });
    
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data as T;
  },

  async adjustCredits(parentId: string, amount: number, reason: string): Promise<number> {
    const result = await this.invokeAdminAction<{ creditsRemaining: number }>('adjust-credits', {
      parentId,
      amount,
      reason,
    });
    return result.creditsRemaining;
  },
};

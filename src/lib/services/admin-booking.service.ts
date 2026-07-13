import { supabase } from '../supabase';
import { DailyAttendanceRow, PendingSlipRow } from '../../types';
import { BOOKING_STATUS } from '@/config/constants';

// --- Shared Types ---
type ChildRelation = { nickname?: string; full_name?: string; age?: number; dob?: string; food_allergy?: string };
type ParentRelation = { name?: string; phone?: string; children?: ChildRelation[] };

type RawBookingRow = {
  id: string;
  created_at: string;
  status: string;
  child_name_snapshot?: string;
  parent_phone_snapshot?: string;
  signature_url?: string;
  checkin_at?: string;
  is_trial?: boolean;
  session?: { session_date?: string; time_label?: string };
  child?: ChildRelation;
  parent?: ParentRelation;
};

type RawSlipRow = {
  id: string;
  parent_id: string;
  file_url: string;
  status: string;
  created_at: string;
  package_id: string;
  non_refundable?: boolean;
  reviewed_at?: string;
  parent?: ParentRelation;
};

// --- Helpers ---
const resolveChildDisplay = (child?: ChildRelation, fallbackName?: string) => 
  child?.nickname || child?.full_name || fallbackName || '(ไม่มีชื่อ)';

const resolveParentName = (parent?: ParentRelation) => parent?.name || '-';
const resolveParentPhone = (parent?: ParentRelation, fallback?: string) => parent?.phone || fallback || '-';

export const AdminBookingService = {
  async adminAddWalkin(phone: string, childName: string): Promise<{ parent_id: string, child_id: string }> {
    const { data, error } = await supabase.rpc('admin_add_walkin', {
      p_phone: phone,
      p_child_name: childName
    });
    if (error) throw error;
    return data;
  },

  // deno-lint-ignore no-explicit-any
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
  }): Promise<Record<string, unknown>> {
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

  async getRecentBookings(limit = 10) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, created_at, status, child_name_snapshot, parent_phone_snapshot,
        session:sessions(session_date, time_label),
        child:children(nickname, full_name),
        parent:parents(name, phone)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return ((data as unknown as RawBookingRow[]) || []).map((row) => ({
      id: row.id,
      created_at: row.created_at,
      status: row.status,
      session_date: row.session?.session_date || '',
      time_label: row.session?.time_label || null,
      child_nickname: resolveChildDisplay(row.child, row.child_name_snapshot),
      parent_name: resolveParentName(row.parent),
      parent_phone: resolveParentPhone(row.parent, row.parent_phone_snapshot),
    }));
  },

  async getDailyAttendance(sessionId: string): Promise<DailyAttendanceRow[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, created_at, signature_url, checkin_at, child_name_snapshot, parent_phone_snapshot, is_trial,
        child:children(id, nickname, full_name, age, dob, food_allergy),
        parent:parents(name, phone)
      `)
      .eq('session_id', sessionId)
      .eq('status', BOOKING_STATUS.CONFIRMED)
      .order('created_at', { ascending: true });
      
    if (error) throw error;

    return ((data as unknown as RawBookingRow[]) || []).map((row) => ({
      id: row.id,
      nickname: resolveChildDisplay(row.child, row.child_name_snapshot) === '(ไม่มีชื่อ)' ? '(Deleted User)' : resolveChildDisplay(row.child, row.child_name_snapshot),
      full_name: row.child?.full_name,
      dob: row.child?.dob,
      age: row.child?.age ?? 0,
      food_allergy: row.child?.food_allergy ?? null,
      parent_name: resolveParentName(row.parent),
      parent_phone: resolveParentPhone(row.parent, row.parent_phone_snapshot),
      created_at: row.created_at,
      signature_url: row.signature_url ?? null,
      checkin_at: row.checkin_at ?? null,
      is_trial: row.is_trial ?? false,
    }));
  },

  async getPendingSlips(): Promise<PendingSlipRow[]> {
    const { data: slips, error } = await supabase
      .from('slip_uploads')
      .select(`
        id, parent_id, file_url, status, created_at, package_id, non_refundable,
        parent:parents(name, phone, children(full_name, nickname))
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const { data: packages } = await supabase.from('package_options').select('id, name, credits');
    const packageMap = new Map((packages as unknown as { name: string; credits: number }[] || []).map((p) => [p.name, p.credits]));

    return ((slips as unknown as RawSlipRow[]) || []).map((slip) => ({
      id: slip.id,
      parent_id: slip.parent_id,
      file_url: slip.file_url,
      status: slip.status,
      created_at: slip.created_at,
      package_id: slip.package_id,
      non_refundable: slip.non_refundable,
      parent_name: resolveParentName(slip.parent),
      parent_phone: resolveParentPhone(slip.parent),
      child_nickname: resolveChildDisplay(slip.parent?.children?.[0], '-'),
      credits_to_add: packageMap.get(slip.package_id) || 0
    }));
  },

  async getTransactionHistory(): Promise<import('@/types').TransactionHistoryRow[]> {
    const { data: slips, error } = await supabase
      .from('slip_uploads')
      .select(`
        id, parent_id, file_url, status, created_at, package_id, reviewed_at,
        parent:parents(name, phone, children(full_name, nickname))
      `)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;

    const { data: packages } = await supabase.from('package_options').select('id, name, credits, price');
    const packageMap = new Map((packages as unknown as { name: string; credits: number; price: number }[] || []).map((p) => [p.name, p])); 

    return ((slips as unknown as RawSlipRow[]) || []).map((slip) => {
      const pkgInfo = packageMap.get(slip.package_id) || { name: slip.package_id, credits: 0, price: 0 };
      const children = slip.parent?.children || [];
      const childrenNames = children.map((c) => c.nickname || c.full_name).filter(Boolean).join(', ') || '-';

      return {
        id: slip.id,
        parent_id: slip.parent_id,
        parent_name: resolveParentName(slip.parent),
        parent_phone: resolveParentPhone(slip.parent),
        children_nicknames: childrenNames,
        package_name: pkgInfo.name || '-',
        price: pkgInfo.price,
        credits: pkgInfo.credits,
        file_url: slip.file_url,
        status: slip.status as 'pending' | 'approved' | 'rejected',
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
    
    if (error) {
      let errMsg = error.message;
      try {
        if (error.context && typeof error.context.json === 'function') {
          const errData = await error.context.json();
          if (errData?.error) errMsg = errData.error;
        }
      } catch {
        // Ignore
      }
      throw new Error(errMsg);
    }
    
    if (data?.error) throw new Error(data.error);
    return data as T;
  },

  async adjustCredits(parentId: string, amount: number, reason: string): Promise<number> {
    const result = await this.invokeAdminAction<{ creditsRemaining: number }>('adjust-credits', { parentId, amount, reason });
    return result.creditsRemaining;
  },
};

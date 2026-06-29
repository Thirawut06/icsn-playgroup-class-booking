import { supabase } from '../supabase';
import { Session, DailyAttendanceRow, PendingSlipRow } from '../../types';
import { BOOKING_STATUS, CLASS_CONFIG } from '@/config/constants';

export const AdminService = {
  async adminAddWalkin(phone: string, childName: string): Promise<{ parent_id: string, child_id: string }> {
    const { data, error } = await supabase.rpc('admin_add_walkin', {
      p_phone: phone,
      p_child_name: childName
    });
    if (error) throw error;
    return data;
  },

  async adminBookClass(childId: string, sessionId: string, isFree: boolean): Promise<{ booking_id: string }> {
    const { data, error } = await supabase.rpc('admin_book_class', {
      p_child_id: childId,
      p_session_id: sessionId,
      p_is_free: isFree
    });
    if (error) throw error;
    return data;
  },

  async adminEditUser(table: 'parents' | 'children', id: string, updateData: Record<string, unknown>): Promise<void> {
    const { error } = await supabase.rpc('admin_edit_user', {
      p_table: table,
      p_id: id,
      p_data: updateData
    });
    if (error) throw error;
  },

  async getSessionForDate(dateStr: string, timeLabel = CLASS_CONFIG.DEFAULT_TIME_LABEL): Promise<Session | null> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_date', dateStr)
      .eq('time_label', timeLabel)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getDailyAttendance(dateStr: string): Promise<DailyAttendanceRow[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        created_at,
        child_name_snapshot,
        parent_phone_snapshot,
        child:children(id, nickname, full_name, age, food_allergy),
        parent:parents(name, phone)
      `)
      .eq('session_date', dateStr)
      .eq('status', BOOKING_STATUS.CONFIRMED)
      .order('created_at', { ascending: true });
    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      nickname: row.child?.nickname || row.child_name_snapshot || '(Deleted User)',
      full_name: row.child?.full_name,
      age: row.child?.age ?? 0,
      food_allergy: row.child?.food_allergy ?? null,
      parent_name: row.parent?.name || '-',
      parent_phone: row.parent?.phone || row.parent_phone_snapshot || '-',
      created_at: row.created_at,
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
    const packageMap = new Map((packages || []).map(p => [p.name, p.credits]));

    return (slips || []).map((slip: any) => {
      const children = slip.parent?.children || [];
      let formattedChildName = '-';
      if (children.length > 0) {
        const firstChild = children[0];
        formattedChildName = firstChild.full_name
          ? `${firstChild.full_name} (${firstChild.nickname})`
          : firstChild.nickname;
      }
      const creditsToAdd = packageMap.get(slip.package_id) || 0;

      return {
        id: slip.id,
        parent_id: slip.parent_id,
        file_url: slip.file_url,
        status: slip.status,
        created_at: slip.created_at,
        package_id: slip.package_id,
        non_refundable: slip.non_refundable,
        parent_name: slip.parent?.name || '-',
        parent_phone: slip.parent?.phone || '-',
        child_nickname: formattedChildName,
        credits_to_add: creditsToAdd
      };
    });
  },

  async invokeAdminAction<T = Record<string, unknown>>(
    actionType: string,
    payload: Record<string, unknown> = {}
  ): Promise<T> {
    let password = '';
    if (typeof window !== 'undefined') {
      password = sessionStorage.getItem('icsn_admin_pwd') || '';
    }
    const { data, error } = await supabase.functions.invoke('admin-actions', {
      body: { action: actionType, password, payload },
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

  async updateSessionCapacity(sessionId: string, totalCapacity: number): Promise<Session> {
    const result = await this.invokeAdminAction<{ session: Session }>('update-session', {
      sessionId,
      totalCapacity,
    });
    return result.session;
  },



  async getAllParentsWithCredits(): Promise<any[]> {
    const { data: parents, error } = await supabase
      .from('parents')
      .select(`
        id,
        name,
        phone,
        created_at,
        children(nickname),
        packages(credits_remaining)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (parents || []).map((p: any) => {
      const children = (p.children as any[]) || [];
      const packages = (p.packages as any[]) || [];
      const totalCredits = packages.reduce((sum, pkg) => sum + (pkg.credits_remaining || 0), 0);

      return {
        id: p.id,
        name: p.name,
        phone: p.phone,
        children_nicknames: children.map((c: any) => c.nickname).join(', '),
        total_credits: totalCredits,
        raw_parent: p
      };
    });
  },

  async searchParentByPhone(phone: string): Promise<any | null> {
    const { data: parent, error } = await supabase
      .from('parents')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();
    if (error) throw error;
    if (!parent) return null;

    const { data: children } = await supabase.from('children').select('*').eq('parent_id', parent.id);
    const { data: packages, error: pkgError } = await supabase
      .from('packages')
      .select('*')
      .eq('parent_id', parent.id);
    if (pkgError) throw pkgError;

    return { ...parent, children: children || [], packages: packages || [] };
  },

  // ===== Blockout Dates =====

  async getBlockoutDates(): Promise<{ id: string; block_date: string; reason: string | null }[]> {
    const { data, error } = await supabase
      .from('blockout_dates')
      .select('*')
      .order('block_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async addBlockoutDate(blockDate: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('blockout_dates')
      .insert({ block_date: blockDate, reason: reason || null });
    if (error) throw error;
  },

  async removeBlockoutDate(id: string): Promise<void> {
    const { error } = await supabase
      .from('blockout_dates')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ===== Session Toggle (Open/Close) =====

  async toggleSessionActive(sessionId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .update({ is_active: isActive })
      .eq('id', sessionId);
    if (error) throw error;
  },

  // ===== Phase 2: User Management =====

  async getAllChildren(): Promise<any[]> {
    // Fetch children along with their parent's name and phone
    const { data, error } = await supabase
      .from('children')
      .select(`
        *,
        parents (
          name,
          phone,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getCreditLogs(parentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateChildProfile(childId: string, updates: any): Promise<void> {
    const { error } = await supabase
      .from('children')
      .update(updates)
      .eq('id', childId);

    if (error) throw error;
  },

  async getExportCSVData(): Promise<any[]> {
    // Dummy implementation to fix TS error.
    return [];
  },
};

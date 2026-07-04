import { supabase } from '../supabase';
import { ClassifiedUser } from '../../types';

export const AdminUserService = {
  async adminEditUser(table: 'parents' | 'children', id: string, updateData: Record<string, unknown>): Promise<void> {
    const { error } = await supabase.rpc('admin_edit_user', {
      p_table: table,
      p_id: id,
      p_data: updateData
    });
    if (error) throw error;
  },

  async getAllUsersClassified(): Promise<ClassifiedUser[]> {
    const { data: parents, error } = await supabase
      .from('parents')
      .select(`
        id,
        name,
        phone,
        email,
        created_at,
        children(nickname, created_at),
        packages(
          credits_remaining,
          type
        ),
        bookings(status)
      `);

    if (error) throw error;

    const mapped = (parents || []).map((p: any) => {
      const children = p.children || [];
      const packages = p.packages || [];
      const bookings = p.bookings || [];

      const totalCredits = packages.reduce((sum: number, pkg: any) => sum + (pkg.credits_remaining || 0), 0);
      const totalBookings = bookings.filter((b: any) => b.status === 'confirmed').length;

      let category: 'payment' | 'trial' | 'walk-in' = 'walk-in';

      if (packages.length > 0) {
        const hasTrial = packages.some((pkg: any) => pkg.type === 'trial');
        const hasNormal = packages.some((pkg: any) => pkg.type !== 'trial');

        if (hasNormal) category = 'payment';
        else if (hasTrial) category = 'trial';
        else category = 'payment';
      }

      // Calculate latest activity to sort properly
      let latestActivity = new Date(p.created_at).getTime();
      children.forEach((c: { nickname: string; created_at?: string }) => {
        if (c.created_at) {
          const childTime = new Date(c.created_at).getTime();
          if (childTime > latestActivity) latestActivity = childTime;
        }
      });

      return {
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        children_nicknames: children.map((c: { nickname: string }) => c.nickname).join(', '),
        total_credits: totalCredits,
        total_bookings: totalBookings,
        category,
        latestActivity,
        raw_parent: p
      };
    });

    // Sort by latest activity descending (newest first)
    return mapped.sort((a: { latestActivity: number }, b: { latestActivity: number }) => b.latestActivity - a.latestActivity);
  },

  async getUserFullDetails(parentId: string): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabase
      .from('parents')
      .select(`
        id, name, phone, email,
        children(id, parent_id, nickname, full_name, dob, age, food_allergy, media_perm, no_photo_perm, parent_photo_url, photo_url),
        packages(id, parent_id, type, credits_remaining, non_refundable, created_at),
        bookings(
          id, session_id, child_id, parent_id, session_date, status, booking_date, child_name_snapshot, parent_phone_snapshot,
          sessions(id, session_date, time_label, total_capacity, booked_count, is_active, theme, activity_desc)
        ),
        credit_transactions(
          id, parent_id, package_id, amount, action_type, notes, created_at
        ),
        slip_uploads(
          id, parent_id, file_url, status, reviewed_at, created_at
        )
      `)
      .eq('id', parentId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateAdminNotes(parentId: string, notes: string): Promise<void> {
    const { error } = await supabase
      .from('parents')
      .update({ admin_notes: notes })
      .eq('id', parentId);
    if (error) throw error;
  },

  async getAllParentsWithCredits(): Promise<Record<string, unknown>[]> {
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
      const children = p.children || [];
      const packages = p.packages || [];
      const totalCredits = packages.reduce((sum: number, pkg: any) => sum + (pkg.credits_remaining || 0), 0);

      return {
        id: p.id,
        name: p.name,
        phone: p.phone,
        children_nicknames: children.map((c: { nickname: string }) => c.nickname).join(', '),
        total_credits: totalCredits,
        raw_parent: p
      };
    });
  },

  async searchParentByPhone(phone: string): Promise<Record<string, unknown> | null> {
    const { data: parent, error } = await supabase
      .from('parents')
      .select(`
        id, name, phone, email,
        children(id, parent_id, nickname, full_name, dob, age, food_allergy, media_perm, no_photo_perm, parent_photo_url, photo_url),
        packages(id, parent_id, type, credits_remaining, non_refundable, created_at)
      `)
      .eq('phone', phone)
      .maybeSingle();
    
    if (error) throw error;
    return parent;
  },

  async getAllChildren(): Promise<Record<string, unknown>[]> {
    const { data, error } = await supabase
      .from('children')
      .select(`
        id, parent_id, nickname, full_name, dob, age, food_allergy, media_perm, no_photo_perm, parent_photo_url, photo_url, special_info, created_at,
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

  async getCreditLogs(parentId: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('id, parent_id, package_id, amount, action_type, notes, created_at')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateChildProfile(childId: string, updates: Record<string, unknown>): Promise<void> {
    const { error } = await supabase
      .from('children')
      .update(updates)
      .eq('id', childId);

    if (error) throw error;
  }
};

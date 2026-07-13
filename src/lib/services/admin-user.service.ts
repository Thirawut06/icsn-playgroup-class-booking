import { supabase } from '../supabase';
import { ClassifiedUser } from '../../types';

// --- Shared Types ---
type RawChild = { nickname: string; full_name?: string; created_at?: string };
type RawPackage = { type?: string; credits_remaining?: number };
type RawBooking = { status: string };

type RawParent = {
  id: string;
  name: string;
  phone: string;
  email: string;
  created_at: string;
  children?: RawChild[];
  packages?: RawPackage[];
  bookings?: RawBooking[];
};

type RawParentSlim = {
  id: string;
  name: string;
  phone: string;
  children?: { nickname: string }[];
  packages?: { credits_remaining?: number }[];
};

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
        id, name, phone, email, created_at,
        children(nickname, full_name, created_at),
        packages(credits_remaining, type),
        bookings(status)
      `);

    if (error) throw error;

    const mapped = ((parents as unknown as RawParent[]) || []).map((p) => {
      const children = p.children || [];
      const packages = p.packages || [];
      const bookings = p.bookings || [];

      const totalCredits = packages.reduce((sum, pkg) => sum + (pkg.credits_remaining || 0), 0);
      const totalBookings = bookings.filter((b) => b.status === 'confirmed').length;
      const category = this._classifyUserCategory(packages, p.email);
      const latestActivity = this._calculateLatestActivity(p.created_at, children);

      return {
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        children_nicknames: children.map((c) => c.nickname).join(', '),
        children_list: children.map((c) => ({ nickname: c.nickname, full_name: c.full_name })),
        total_credits: totalCredits,
        total_bookings: totalBookings,
        category,
        latestActivity,
        raw_parent: p
      };
    });

    return mapped.sort((a, b) => b.latestActivity - a.latestActivity);
  },

  _classifyUserCategory(packages: RawPackage[], email = ''): 'payment' | 'trial' | 'registered' | 'walk-in' {
    if (packages.length === 0) {
      return email?.endsWith('@icsn.local') ? 'walk-in' : 'registered';
    }
    return packages.some((pkg) => pkg.type !== 'trial') ? 'payment' : 'trial';
  },

  _calculateLatestActivity(parentCreatedAt: string, children: { created_at?: string }[]): number {
    let latestActivity = new Date(parentCreatedAt).getTime();
    children.forEach((c) => {
      if (c.created_at) {
        const childTime = new Date(c.created_at).getTime();
        if (childTime > latestActivity) latestActivity = childTime;
      }
    });
    return latestActivity;
  },

  async getUserFullDetails(parentId: string): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabase
      .from('parents')
      .select(`
        id, name, phone, email, admin_notes,
        children(id, parent_id, nickname, full_name, dob, age, food_allergy, media_perm, no_photo_perm, parent_photo_url, photo_url),
        packages(id, parent_id, type, credits_remaining, non_refundable, created_at),
        bookings(
          id, session_id, child_id, parent_id, session_date, status, booking_date, child_name_snapshot, parent_phone_snapshot,
          sessions(id, session_date, time_label, total_capacity, booked_count, is_active, theme, activity_desc)
        ),
        credit_transactions(id, parent_id, package_id, amount, action_type, notes, created_at),
        slip_uploads(id, parent_id, file_url, status, reviewed_at, created_at)
      `)
      .eq('id', parentId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateAdminNotes(parentId: string, notes: string): Promise<void> {
    await this.adminEditUser('parents', parentId, { admin_notes: notes });
  },

  async updateParentName(parentId: string, newName: string): Promise<void> {
    await this.adminEditUser('parents', parentId, { name: newName });
  },

  async updateChildName(childId: string, newFullName: string, newNickname: string): Promise<void> {
    await this.adminEditUser('children', childId, { full_name: newFullName, nickname: newNickname });
  },

  async getAllParentsWithCredits(): Promise<Record<string, unknown>[]> {
    const { data: parents, error } = await supabase
      .from('parents')
      .select(`
        id, name, phone, created_at,
        children(nickname),
        packages(credits_remaining)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return ((parents as unknown as RawParentSlim[]) || []).map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      children_nicknames: (p.children || []).map((c) => c.nickname).join(', '),
      total_credits: (p.packages || []).reduce((sum, pkg) => sum + (pkg.credits_remaining || 0), 0),
      raw_parent: p
    }));
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
        parents(name, phone, email)
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
    await this.adminEditUser('children', childId, updates);
  }
};

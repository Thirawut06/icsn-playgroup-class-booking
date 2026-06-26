import { createClient } from '@supabase/supabase-js';
import type {
  Parent,
  Child,
  Package,
  Session,
  Booking,
  PackageOption,
  DailyAttendanceRow,
  PendingSlipRow,
  ConfirmedBookingRow,
  ExportCSVRow,
  ParentWithDetails,
} from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const createOrGetSupabase = () => {
  if (typeof window === 'undefined') {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  if (!(globalThis as any)._supabaseInstance) {
    (globalThis as any)._supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return (globalThis as any)._supabaseInstance;
};

export const supabase = createOrGetSupabase();

export function getAdminPassword(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('icsn_admin_pwd') || '';
}

export async function invokeAdminAction<T = Record<string, unknown>>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const password = getAdminPassword();
  const { data, error } = await supabase.functions.invoke('admin-actions', {
    body: { action, password, payload },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export const AppDB = {
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

  async getOrCreateSession(dateStr: string, timeLabel: string = 'เช้า (09:00 - 12:00)'): Promise<Session> {
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
        total_capacity: 15,
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
      .eq('status', 'confirmed');
    if (error) throw error;
    return (count || 0) > 0;
  },

  async getPackageOptions(): Promise<PackageOption[]> {
    const { data, error } = await supabase
      .from('package_options')
      .select('*')
      .order('credits', { ascending: false });
      
    if (error) throw error;
    return data || [];
  },

  async getParentByPhone(phone: string): Promise<Parent | null> {
    const { data, error } = await supabase
      .from('parents')
      .select('*')
      .eq('phone', phone)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async loginParent(phone: string): Promise<Parent> {
    const { data, error } = await supabase
      .from('parents')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('ไม่พบเบอร์โทรศัพท์นี้ในระบบ โปรดลงทะเบียนก่อน');
      }
      throw error;
    }
    return data;
  },

  async signUp(email: string, password: string, name: string, phone: string): Promise<Parent> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('อีเมลนี้ถูกใช้ลงทะเบียนไปแล้ว กรุณาไปที่หน้า เข้าสู่ระบบ');
      }
      throw error;
    }
    if (!data?.user) throw new Error('การสมัครสมาชิกไม่สำเร็จ โปรดลองอีกครั้ง');

    const userId = data.user.id;

    // Check if phone exists
    const { data: existingParent } = await supabase
      .from('parents')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (existingParent) {
      throw new Error('เบอร์โทรศัพท์นี้ถูกใช้ลงทะเบียนแล้ว');
    }

    const { data: parentData, error: pError } = await supabase
      .from('parents')
      .insert([{ id: userId, phone, name }])
      .select()
      .single();

    if (pError) throw pError;
    return parentData;
  },

  async signIn(email: string, password: string): Promise<Parent> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    if (!data?.user) throw new Error('เข้าสู่ระบบล้มเหลว');

    const { data: parent, error: pError } = await supabase
      .from('parents')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (pError) throw pError;
    return parent;
  },

  async getParentDetails(parentId: string): Promise<any> {
    const { data, error } = await supabase
      .from('parents')
      .select(`
        *,
        children (*)
      `)
      .eq('id', parentId)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getChildren(parentId: string): Promise<Child[]> {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', parentId);
      
    if (error) throw error;
    return data || [];
  },

  async getPackages(parentId: string): Promise<Package[]> {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('parent_id', parentId)
      .gt('credits_remaining', 0);
      
    if (error) throw error;
    return data || [];
  },

  async getLatestPackage(parentId: string): Promise<Package | null> {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (error) throw error;
    return data;
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
      .eq('status', 'confirmed')
      .gte('session_date', today)
      .order('session_date', { ascending: true });
      
    if (error) throw error;
    return data || [];
  },

  async cancelBooking(bookingId: string, packageId: string): Promise<void> {
    const { error } = await supabase.rpc('cancel_booking', {
      p_booking_id: bookingId,
      p_package_id: packageId,
      p_cancelled_by: 'parent',
      p_cancel_reason: null,
    });
    if (error) throw error;
  },

  async uploadFile(bucket: string, file: File, path: string): Promise<string> {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  },

  async submitNewChild(parentId: string, childName: string, childNickname: string, childDob: string, childPhotoFile: File | null, parentPhotoFile: File | null, allergy: string, info: string, mediaPerm: boolean, noPhotoPerm: boolean): Promise<Child> {
    let actualPhotoUrl = "";
    if (childPhotoFile) {
      try {
        const ext = childPhotoFile.name.split('.').pop() || 'jpg';
        const fileName = `${parentId}_child_${Date.now()}.${ext}`;
        actualPhotoUrl = await this.uploadFile('profiles', childPhotoFile, fileName);
      } catch (e) {
        console.error("Storage child photo upload failed", e);
      }
    }

    let actualParentPhotoUrl = "";
    if (parentPhotoFile) {
      try {
        const ext = parentPhotoFile.name.split('.').pop() || 'jpg';
        const fileName = `${parentId}_parent_${Date.now()}.${ext}`;
        actualParentPhotoUrl = await this.uploadFile('profiles', parentPhotoFile, fileName);
      } catch (e) {
        console.error("Storage parent photo upload failed", e);
      }
    }

    // Calculate age rough estimate (required by schema)
    let ageYears = 3;
    if (childDob) {
      const birthDate = new Date(childDob);
      const diff = Date.now() - birthDate.getTime();
      ageYears = Math.max(0, Math.floor(diff / 31557600000));
    }

    const { data, error } = await supabase
      .from('children')
      .insert([{
        parent_id: parentId,
        full_name: childName,
        nickname: childNickname,
        dob: childDob || null,
        age: ageYears,
        food_allergy: allergy,
        special_info: info,
        media_perm: mediaPerm,
        no_photo_perm: noPhotoPerm,
        photo_url: actualPhotoUrl,
        parent_photo_url: actualParentPhotoUrl
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async grantTrialPackage(parentId: string): Promise<void> {
    const { data: existing } = await supabase
      .from('packages')
      .select('id')
      .eq('parent_id', parentId)
      .eq('type', 'trial')
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase
        .from('packages')
        .insert([{
          parent_id: parentId,
          type: 'trial',
          credits_remaining: 1,
          non_refundable: true
        }]);
      if (error) throw error;
    }
  },

  async submitTopUp(parentId: string, packageType: string, slipFile: File | null, nonRefundable: boolean): Promise<any> {
    let actualSlipUrl = "";
    if (slipFile) {
      const ext = slipFile.name.split('.').pop() || 'jpg';
      const fileName = `${parentId}_${Date.now()}.${ext}`;
      actualSlipUrl = await this.uploadFile('slips', slipFile, fileName);
    }

    const { data, error } = await supabase
      .from('slip_uploads')
      .insert([{
        parent_id: parentId,
        package_id: packageType,
        non_refundable: nonRefundable,
        file_url: actualSlipUrl,
        status: 'pending'
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async bookClass(parentId: string, childId: string, sessionId: string, packageId: string): Promise<Booking> {
    // In a real scenario, this requires an RPC call to ensure transaction safety
    // For simplicity, we implement the direct inserts/updates here
    const { data, error } = await supabase
      .rpc('book_class', {
        p_parent_id: parentId,
        p_child_id: childId,
        p_session_id: sessionId,
        p_package_id: packageId
      });
      
    if (error) throw error;
    return data;
  },


  // --- Admin Functions ---

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

  async getSessionForDate(dateStr: string, timeLabel = 'เช้า (09:00 - 12:00)'): Promise<Session | null> {
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
        child:children(id, nickname, full_name, age, food_allergy),
        parent:parents(name, phone)
      `)
      .eq('session_date', dateStr)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: true });
    if (error) throw error;

    return (data || []).map((row: {
      id: string;
      created_at: string;
      child: { nickname: string; full_name?: string; age: number; food_allergy: string | null } | null;
      parent: { name: string; phone: string } | null;
    }) => ({
      id: row.id,
      nickname: row.child?.nickname || '-',
      full_name: row.child?.full_name,
      age: row.child?.age ?? 0,
      food_allergy: row.child?.food_allergy ?? null,
      parent_name: row.parent?.name || '-',
      parent_phone: row.parent?.phone || '-',
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
        parent:parents(name, phone)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const packageOptions = await this.getPackageOptions();
    const optionByName = new Map(packageOptions.map(o => [o.name, o.credits]));

    const rows: PendingSlipRow[] = [];
    for (const slip of slips || []) {
      const parent = slip.parent as { name: string; phone: string } | null;
      const { data: children } = await supabase
        .from('children')
        .select('nickname')
        .eq('parent_id', slip.parent_id)
        .limit(1);
      const childNickname = children?.[0]?.nickname || '-';

      let creditsToAdd = 10;
      if (slip.package_id && optionByName.has(slip.package_id)) {
        creditsToAdd = optionByName.get(slip.package_id)!;
      } else if (slip.file_url?.includes('||credits:')) {
        const parts = slip.file_url.split('||credits:');
        if (parts.length > 1) {
          creditsToAdd = parseInt(parts[1].split('||')[0], 10) || 10;
        }
      }

      rows.push({
        id: slip.id,
        parent_id: slip.parent_id,
        file_url: slip.file_url,
        status: slip.status,
        created_at: slip.created_at,
        package_id: slip.package_id,
        parent_name: parent?.name || '-',
        parent_phone: parent?.phone || '-',
        child_nickname: childNickname,
        credits_to_add: creditsToAdd,
      });
    }
    return rows;
  },

  async searchParentByPhone(phone: string): Promise<ParentWithDetails | null> {
    const { data: parent, error } = await supabase
      .from('parents')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();
    if (error) throw error;
    if (!parent) return null;

    const children = await this.getChildren(parent.id);
    const { data: packages, error: pkgError } = await supabase
      .from('packages')
      .select('*')
      .eq('parent_id', parent.id);
    if (pkgError) throw pkgError;

    return { ...parent, children, packages: packages || [] };
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
    if (error) throw error;

    return (data || []).map((row: {
      id: string;
      session_date: string;
      child: { nickname: string } | null;
      parent: { name: string; phone: string } | null;
    }) => ({
      id: row.id,
      session_date: row.session_date,
      parent_name: row.parent?.name || '-',
      parent_phone: row.parent?.phone || '-',
      child_nickname: row.child?.nickname || '-',
    }));
  },

  async searchActiveBookings(searchTerm: string): Promise<ConfirmedBookingRow[]> {
    // Search active (confirmed) bookings from today onwards by parent phone or child nickname
    const today = new Date().toISOString().split('T')[0];
    
    // First find matching parents by phone (exact or partial)
    const { data: parents } = await supabase
      .from('parents')
      .select('id')
      .ilike('phone', `%${searchTerm}%`);
      
    // Find matching children by nickname
    const { data: children } = await supabase
      .from('children')
      .select('id')
      .ilike('nickname', `%${searchTerm}%`);

    const parentIds = (parents || []).map((p: { id: string }) => p.id);
    const childIds = (children || []).map((c: { id: string }) => c.id);

    if (parentIds.length === 0 && childIds.length === 0) {
      return []; // No matches found
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
  },

  async getExportCSVData(): Promise<ExportCSVRow[]> {
    const { data: parents, error } = await supabase
      .from('parents')
      .select(`
        id,
        name,
        phone,
        created_at,
        children(nickname, age, food_allergy),
        packages(credits_remaining)
      `)
      .order('created_at', { ascending: true });
    if (error) throw error;

    const rows: ExportCSVRow[] = [];
    for (const p of parents || []) {
      const children = (p.children as { nickname: string; age: number; food_allergy: string | null }[]) || [];
      const packages = (p.packages as { credits_remaining: number }[]) || [];
      const firstChild = children[0];
      const totalCredits = packages.reduce((sum, pkg) => sum + (pkg.credits_remaining || 0), 0);

      const { data: bookings } = await supabase
        .from('bookings')
        .select('session_date')
        .eq('parent_id', p.id)
        .eq('status', 'confirmed')
        .order('session_date', { ascending: true });

      const bookingDates = (bookings || [])
        .map((b: { session_date: string }) => b.session_date)
        .filter((d: string, i: number, arr: string[]) => arr.indexOf(d) === i)
        .join('; ');

      rows.push({
        parent_name: p.name,
        phone: p.phone,
        child_nickname: firstChild?.nickname || '-',
        age: firstChild?.age ?? '-',
        food_allergy: firstChild?.food_allergy || '-',
        credits_remaining: totalCredits,
        booking_dates: bookingDates,
        registration_date: p.created_at?.split('T')[0] || '',
      });
    }
    return rows;
  },

  async adjustCredits(parentId: string, amount: number, reason: string): Promise<number> {
    const result = await invokeAdminAction<{ creditsRemaining: number }>('adjust-credits', {
      parentId,
      amount,
      reason,
    });
    return result.creditsRemaining;
  },

  async updateSessionCapacity(sessionId: string, totalCapacity: number): Promise<Session> {
    const result = await invokeAdminAction<{ session: Session }>('update-session', {
      sessionId,
      totalCapacity,
    });
    return result.session;
  },
};

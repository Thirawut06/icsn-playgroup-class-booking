import { createClient } from '@supabase/supabase-js';
import type { Parent, Child, Package, Session, Booking, PackageOption, SlipUpload } from '../types';

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
      p_package_id: packageId
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

  async adminEditUser(table: 'parents' | 'children', id: string, updateData: any): Promise<void> {
    const { error } = await supabase.rpc('admin_edit_user', {
      p_table: table,
      p_id: id,
      p_data: updateData
    });
    if (error) throw error;
  }
};

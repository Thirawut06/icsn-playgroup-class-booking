import { createClient } from '@supabase/supabase-js';
import type { Parent, Child, Package, Session, Booking, PackageOption, SlipUpload } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

  async getBookedCountForSession(sessionId: string): Promise<number> {
    const { count, error } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('status', 'confirmed');
      
    if (error) throw error;
    return count || 0;
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
        throw new Error('ไม่พบเบอร์โทรศัพท์นี้ในระบบ โปรดลงทะเบียนก่อนค่ะ');
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
    if (error) throw error;
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

  async getBookings(parentId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        session:sessions!inner(*),
        child:children!inner(*)
      `)
      .eq('parent_id', parentId)
      .eq('status', 'confirmed')
      .order('booking_date', { ascending: true });
      
    if (error) throw error;
    return data || [];
  },

  async submitNewChild(parentId: string, childName: string, childNickname: string, childDob: string, childPhotoBase64: string, allergy: string, mediaPerm: boolean, noPhotoPerm: boolean): Promise<Child> {
    // Implement edge function call for child photo
    let actualPhotoUrl = "";
    if (childPhotoBase64) {
      try {
        const payload = {
          form_type: 'trial',
          childName,
          childPhoto: childPhotoBase64
        };
        const { data, error } = await supabase.functions.invoke('forward-webhook', { body: payload });
        if (!error && data?.driveLinks) {
          actualPhotoUrl = data.driveLinks.childPhoto || "";
        }
      } catch (e) {
        console.error("Webhook forwarding failed", e);
      }
    }

    const { data, error } = await supabase
      .from('children')
      .insert([{
        parent_id: parentId,
        full_name: childName,
        nickname: childNickname,
        dob: childDob || null,
        food_allergy: allergy,
        media_perm: mediaPerm,
        no_photo_perm: noPhotoPerm,
        photo_url: actualPhotoUrl
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async submitTopUp(parentId: string, packageType: string, fileUrlWithCredits: string): Promise<SlipUpload> {
    const { data, error } = await supabase
      .from('slip_uploads')
      .insert([{
        parent_id: parentId,
        file_url: fileUrlWithCredits,
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
  
  async cancelBooking(bookingId: string, packageId: string): Promise<void> {
    const { error } = await supabase
      .rpc('cancel_booking', {
        p_booking_id: bookingId,
        p_package_id: packageId
      });
      
    if (error) throw error;
  }
};

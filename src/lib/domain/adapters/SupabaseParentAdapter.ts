import { supabase } from '../../supabase';
import { Parent, Child, ParentWithDetails, SubmitChildPayload } from '@/types';
import { IParentRepository } from '../ports/IParentRepository';

export class SupabaseParentAdapter implements IParentRepository {
  async getParentByPhone(phone: string): Promise<Parent | null> {
    const { data, error } = await supabase
      .from('parents')
      .select('id, name, phone, email')
      .eq('phone', phone)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async loginParent(phone: string): Promise<Parent> {
    const { data, error } = await supabase
      .from('parents')
      .select('id, name, phone, email')
      .eq('phone', phone)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('ไม่พบเบอร์โทรศัพท์นี้ในระบบ โปรดลงทะเบียนก่อน');
      }
      throw error;
    }
    return data;
  }

  async signUp(email: string, password: string, name: string, phone: string): Promise<Parent> {
    const { data: existingParent } = await supabase
      .from('parents')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existingParent) {
      throw new Error('เบอร์โทรศัพท์นี้ถูกใช้ลงทะเบียนแล้ว กรุณาไปที่หน้า "เข้าสู่ระบบ" หรือใช้เบอร์อื่น');
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists')) {
        throw new Error('อีเมลนี้ถูกใช้ลงทะเบียนไปแล้ว กรุณาไปที่หน้า "เข้าสู่ระบบ"');
      }
      if (msg.includes('password should be at least') || msg.includes('valid password')) {
        throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร');
      }
      throw error;
    }
    if (!data?.user) throw new Error('การสมัครสมาชิกไม่สำเร็จ โปรดลองอีกครั้ง');

    const userId = data.user.id;

    const { data: parentData, error: pError } = await supabase
      .from('parents')
      .insert([{ id: userId, phone, name, email }])
      .select()
      .single();

    if (pError) {
      // ROLLBACK: Delete the auth user if profile creation failed to prevent orphaned accounts
      await supabase.rpc('self_delete_auth_user');
      
      // We must sign out the local session because the auth user was deleted
      await supabase.auth.signOut();
      
      throw new Error(`ไม่สามารถสร้างโปรไฟล์ได้: ${pError.message || pError.code}`);
    }
    
    return parentData;
  }

  async signIn(email: string, password: string): Promise<Parent> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
      throw error;
    }
    if (!data?.user) throw new Error('เข้าสู่ระบบล้มเหลว');

    const { data: parent, error: pError } = await supabase
      .from('parents')
      .select('id, name, phone, email')
      .eq('id', data.user.id)
      .maybeSingle();

    if (pError) throw pError;
    
    if (!parent) {
      throw new Error('PROFILE_MISSING');
    }

    return parent;
  }

  async completeProfile(userId: string, name: string, phone: string): Promise<Parent> {
    const { data: existingParent } = await supabase
      .from('parents')
      .select('id')
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
  }

  async getParentDetails(parentId: string): Promise<ParentWithDetails | null> {
    const { data, error } = await supabase
      .from('parents')
      .select(`
        id, name, phone, email, admin_notes, created_at,
        children (id, parent_id, nickname, full_name, dob, age, food_allergy, media_perm, no_photo_perm, parent_photo_url, photo_url, special_info, created_at)
      `)
      .eq('id', parentId)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getChildren(parentId: string): Promise<Child[]> {
    const { data, error } = await supabase
      .from('children')
      .select('id, parent_id, nickname, full_name, dob, age, food_allergy, media_perm, no_photo_perm, parent_photo_url, photo_url, special_info')
      .eq('parent_id', parentId);
      
    if (error) throw error;
    return data || [];
  }

  async uploadFile(bucket: string, file: File, path: string): Promise<string> {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  }

  async submitNewChild(payload: SubmitChildPayload): Promise<Child> {
    const {
      parentId,
      childName,
      childNickname,
      childDob,
      childPhotoFile,
      parentPhotoFile,
      allergy,
      info,
      mediaPerm,
      noPhotoPerm
    } = payload;

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

    // Background sync to Google Drive is now handled by Database Webhooks automatically.

    return data;
  }
}

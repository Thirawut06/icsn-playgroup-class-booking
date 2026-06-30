import { supabase } from '../../supabase';
import { Package, PackageOption } from '@/types';
import { IPackageRepository } from '../ports/IPackageRepository';
import { ParentService } from '../../services/parent.service';

export class SupabasePackageAdapter implements IPackageRepository {
  async getPackageOptions(): Promise<PackageOption[]> {
    const { data, error } = await supabase
      .from('package_options')
      .select('*')
      .order('credits', { ascending: false });
      
    if (error) throw error;
    return data || [];
  }

  async getPackages(parentId: string): Promise<Package[]> {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('parent_id', parentId)
      .gt('credits_remaining', 0);
      
    if (error) throw error;
    return data || [];
  }

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
  }

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
  }

  async submitTopUp(parentId: string, packageType: string, slipFile: File | null, nonRefundable: boolean): Promise<Record<string, unknown> | null> {
    let actualSlipUrl = "";
    if (slipFile) {
      const ext = slipFile.name.split('.').pop() || 'jpg';
      const fileName = `${parentId}_${Date.now()}.${ext}`;
      // Call ParentService to handle upload, maintaining current dependency injection behavior
      actualSlipUrl = await ParentService.uploadFile('slips', slipFile, fileName);
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
  }
}

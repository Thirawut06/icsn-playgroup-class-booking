import { useState, useCallback, useEffect } from 'react';
import { AdminService, supabase } from '@/lib/supabase';
import type { PendingSlipRow } from '@/types';
import toast from 'react-hot-toast';
import { COPY } from '@/config/copy';
interface UsePendingSlipsOptions {
  onRefresh?: () => void;
}


export function usePendingSlips({ onRefresh }: UsePendingSlipsOptions = {}) {
  const [slips, setSlips] = useState<PendingSlipRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [previewSlip, setPreviewSlip] = useState<PendingSlipRow | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadSlips = useCallback(async () => {
    setLoading(true);
    try {
      const data = await AdminService.getPendingSlips();
      setSlips(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    loadSlips();
  }, [loadSlips]);

  const handleApprove = async (slip: PendingSlipRow, overrideCredits: number) => {
    setIsProcessing(true);
    try {
      const result = await AdminService.invokeAdminAction<{ creditsAdded: number; childNickname: string }>('approve-slip', {
        slipId: slip.id,
        creditsOverride: overrideCredits,
      });
      await loadSlips();
      onRefresh?.();
      setPreviewSlip(null);
      toast.success(COPY.ALERTS.APPROVE_SLIP_SUCCESS(result.creditsAdded, result.childNickname));
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (slipId: string) => {
    setIsProcessing(true);
    try {
      await AdminService.invokeAdminAction('reject-slip', { slipId });
      await loadSlips();
      onRefresh?.();
      setPreviewSlip(null);
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadMissingSlip = async (slipId: string, file: File) => {
    setIsProcessing(true);
    try {
      const ext = file.name.split('.').pop();
      const filename = `${slipId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('slips')
        .upload(`walkins/${filename}`, file, { upsert: true });
        
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage
        .from('slips')
        .getPublicUrl(`walkins/${filename}`);
        
      const { error: dbError } = await supabase
        .from('slip_uploads')
        .update({
          file_url: publicUrlData.publicUrl,
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', slipId);
        
      if (dbError) throw dbError;
      
      // Trigger background upload to Google Drive for evidence
      fetch('/api/google/upload-evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: slips.find(s => s.id === slipId)?.parent_id || slipId.split('_')[0],
          fileUrl: publicUrlData.publicUrl,
          fileName: `admin_uploaded_slip_${Date.now()}.jpg`
        })
      }).catch(console.error);

      toast.success("อัปโหลดสลิปย้อนหลังเรียบร้อยแล้ว!");
      await loadSlips();
      onRefresh?.();
      setPreviewSlip(null);
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    slips,
    loading,
    previewSlip,
    setPreviewSlip,
    isProcessing,
    handleApprove,
    handleReject,
    handleUploadMissingSlip,
    refreshSlips: loadSlips,
  };
}

import React from 'react';
import { X, Check } from 'lucide-react';
import type { PendingSlipRow } from '@/types';

interface SlipPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  slip: PendingSlipRow | null;
  onApprove: (slip: PendingSlipRow, overrideCredits: number) => Promise<void>;
  onReject: (slipId: string) => Promise<void>;
  onUploadMissingSlip?: (slipId: string, file: File) => Promise<void>;
  isProcessing: boolean;
}

export function SlipPreviewModal({
  isOpen,
  onClose,
  slip,
  onApprove,
  onReject,
  onUploadMissingSlip,
  isProcessing,
}: SlipPreviewModalProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Reset file selection when slip changes
    setSelectedFile(null);
    setPreviewUrl(null);
  }, [slip]);

  if (!isOpen || !slip) return null;

  const isMissingSlip = slip.file_url === 'PENDING_WALKIN_PAYMENT';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/10/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-foreground">ตรวจสอบสลิปโอนเงิน</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted/80 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted flex flex-col md:flex-row gap-6 items-start">
          {/* Image Preview (Left) */}
          <div className="flex-1 w-full bg-black/5 rounded-xl border border-border overflow-hidden flex flex-col items-center justify-center min-h-[300px] p-4 relative">
            {isMissingSlip ? (
              <div className="w-full flex flex-col items-center justify-center space-y-4">
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" loading="lazy" className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-sm" />
                    <button 
                      onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                      className="text-error font-bold text-sm hover:underline"
                    >
                      ยกเลิกและเลือกใหม่
                    </button>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full max-w-sm h-64 border-2 border-dashed border-icsn-teal/50 rounded-2xl cursor-pointer hover:bg-icsn-teal/5 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 text-icsn-teal mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                      <p className="mb-2 text-sm text-foreground font-bold">คลิกเพื่ออัปโหลดรูปภาพสลิป</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, JPEG</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                )}
              </div>
            ) : slip.file_url ? (
              <img
                src={slip.file_url}
                alt="Payment slip"
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm"
              />
            ) : (
              <div className="text-muted-foreground/70 font-medium">ไม่พบรูปภาพสลิป</div>
            )}
          </div>

          {/* Action Panel (Right) */}
          <div className="w-full md:w-80 bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col shrink-0 text-sm">
            <h4 className="font-bold text-icsn-navy text-base mb-3 border-b border-border pb-2">ข้อมูลการสั่งซื้อ</h4>
            
            <div className="space-y-2.5 mb-5 flex-1">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground font-medium">ผู้ปกครอง:</span>
                <span className="font-bold text-foreground">{slip.parent_name}</span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground font-medium">เบอร์โทร:</span>
                <span className="font-bold text-foreground">{slip.parent_phone}</span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground font-medium">นักเรียน:</span>
                <span className="font-bold text-foreground">{slip.child_nickname}</span>
              </div>

              <div className="border-t border-border pt-2">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground font-medium">แพ็กเกจ:</span>
                  <span className="font-bold text-foreground">{slip.package_id || 'Custom Package'}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground font-medium">เครดิต:</span>
                <span className="text-lg font-black text-success">+{slip.credits_to_add} Credits</span>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-border">
              {isMissingSlip ? (
                <button
                  type="button"
                  onClick={() => onUploadMissingSlip?.(slip.id, selectedFile!)}
                  disabled={isProcessing || !selectedFile}
                  className="w-full flex items-center justify-center gap-2 bg-icsn-navy hover:bg-icsn-navy/90 text-white py-3 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  <Check className="w-5 h-5" />
                  บันทึกรูปภาพสลิป
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onApprove(slip, slip.credits_to_add)}
                    disabled={isProcessing || slip.credits_to_add < 1}
                    className="w-full flex items-center justify-center gap-2 bg-icsn-teal hover:bg-icsn-teal/90 text-white py-2.5 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    อนุมัติ
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => onReject(slip.id)}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 bg-white border-2 border-error/20 text-error hover:bg-error/10 hover:border-error/30 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    ปฏิเสธ
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

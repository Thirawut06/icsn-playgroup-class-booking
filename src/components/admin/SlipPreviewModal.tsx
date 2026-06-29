import React from 'react';
import { X, Check } from 'lucide-react';
import type { PendingSlipRow } from '@/types';

interface SlipPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  slip: PendingSlipRow | null;
  onApprove: (slip: PendingSlipRow, overrideCredits: number) => Promise<void>;
  onReject: (slipId: string) => Promise<void>;
  isProcessing: boolean;
}

export function SlipPreviewModal({
  isOpen,
  onClose,
  slip,
  onApprove,
  onReject,
  isProcessing,
}: SlipPreviewModalProps) {
  React.useEffect(() => {
    // No longer need to manage credits state locally
  }, [slip]);

  if (!isOpen || !slip) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">ตรวจสอบสลิปโอนเงิน</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col md:flex-row gap-6 items-start">
          {/* Image Preview (Left) */}
          <div className="flex-1 w-full bg-black/5 rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center min-h-[300px] p-2">
            {slip.file_url ? (
              <img
                src={slip.file_url}
                alt="Payment slip"
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm"
              />
            ) : (
              <div className="text-gray-400 font-medium">ไม่พบรูปภาพสลิป</div>
            )}
          </div>

          {/* Action Panel (Right) */}
          <div className="w-full md:w-80 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col shrink-0 text-sm">
            <h4 className="font-bold text-icsn-navy text-base mb-3 border-b border-gray-100 pb-2">ข้อมูลการสั่งซื้อ</h4>
            
            <div className="space-y-2.5 mb-5 flex-1">
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-500 font-medium">ผู้ปกครอง:</span>
                <span className="font-bold text-gray-950">{slip.parent_name}</span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-500 font-medium">เบอร์โทร:</span>
                <span className="font-bold text-gray-950">{slip.parent_phone}</span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-500 font-medium">นักเรียน:</span>
                <span className="font-bold text-gray-950">{slip.child_nickname}</span>
              </div>

              <div className="border-t border-gray-100 pt-2">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-500 font-medium">แพ็กเกจ:</span>
                  <span className="font-bold text-gray-950">{slip.package_id || 'Custom Package'}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-500 font-medium">เครดิต:</span>
                <span className="text-lg font-black text-emerald-600">+{slip.credits_to_add} Credits</span>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-gray-100">
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
                onClick={() => {
                  if (confirm('แน่ใจหรือไม่ว่าต้องการปฏิเสธสลิปนี้?')) {
                    onReject(slip.id);
                  }
                }}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-white border-2 border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                ปฏิเสธ
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

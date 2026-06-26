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
  const [credits, setCredits] = React.useState<number>(0);

  React.useEffect(() => {
    if (slip) {
      setCredits(slip.credits_to_add);
    }
  }, [slip]);

  if (!isOpen || !slip) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">ตรวจสอบสลิปโอนเงิน</h3>
            <p className="text-sm text-gray-500">
              {slip.parent_name} ({slip.parent_phone}) — น้อง{slip.child_nickname}
            </p>
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
          <div className="w-full md:w-80 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-5 shrink-0">
            <div>
              <h4 className="font-bold text-gray-900 mb-1">ข้อมูลแพ็กเกจ</h4>
              <p className="text-sm text-gray-600">{slip.package_id || 'Top-up / Custom'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                เครดิตที่ต้องการเพิ่มให้ผู้ปกครอง <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={credits}
                  onChange={(e) => setCredits(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-icsn-teal focus:ring-1 focus:ring-icsn-teal outline-none transition font-bold text-lg text-center"
                />
                <span className="text-gray-500 font-bold shrink-0">สิทธิ์</span>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                * ระบบคำนวณอัตโนมัติจากรูปสลิป คุณสามารถปรับแก้ได้ถ้าตัวเลขไม่ถูกต้อง
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={() => onApprove(slip, credits)}
                disabled={isProcessing || credits < 1}
                className="w-full flex items-center justify-center gap-2 bg-icsn-teal hover:bg-[#00969e] text-white py-3 rounded-xl font-bold transition disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
                อนุมัติสลิป (+{credits} สิทธิ์)
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (confirm('แน่ใจหรือไม่ว่าต้องการปฏิเสธสลิปนี้?')) {
                    onReject(slip.id);
                  }
                }}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 py-3 rounded-xl font-bold transition disabled:opacity-50"
              >
                <X className="w-5 h-5" />
                ปฏิเสธสลิป
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

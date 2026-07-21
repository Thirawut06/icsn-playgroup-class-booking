import React from 'react';
import { Minus, Plus, Save, Loader2 } from 'lucide-react';

interface AdjustCreditsTabProps {
  creditAmount: number | string;
  setCreditAmount: React.Dispatch<React.SetStateAction<number | string>>;
  creditReason: string;
  setCreditReason: (val: string) => void;
  isSaving: boolean;
  handleAdjustCredits: () => void;
}

export function AdjustCreditsTab({
  creditAmount,
  setCreditAmount,
  creditReason,
  setCreditReason,
  isSaving,
  handleAdjustCredits
}: AdjustCreditsTabProps) {
  return (
    <div className="space-y-6">
      
      {/* Stepper */}
      <div>
        <label className="block text-base font-bold text-foreground mb-3 text-center">ปรับจำนวนเครดิต</label>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setCreditAmount(prev => (typeof prev === 'string' ? parseInt(prev) || 0 : prev) - 1)}
            className="w-14 h-14 rounded-full bg-error/10 text-error hover:bg-error hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <Minus className="w-8 h-8" />
          </button>
          
          <div className="w-32 relative">
            <input 
              type="number" 
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              className="w-full px-2 py-3 bg-white border-2 border-border rounded-xl focus:outline-none focus:border-icsn-teal transition-all text-3xl font-bold text-center"
            />
          </div>

          <button
            onClick={() => setCreditAmount(prev => (typeof prev === 'string' ? parseInt(prev) || 0 : prev) + 1)}
            className="w-14 h-14 rounded-full bg-success/10 text-success hover:bg-success hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-3">
          เลขบวก = เพิ่มเครดิต / เลขติดลบ = หักเครดิต
        </p>
      </div>

      <div>
        <label className="block text-sm font-bold text-foreground mb-2">เหตุผล / หมายเหตุ (ไม่ระบุก็ได้)</label>
        <textarea 
          value={creditReason}
          onChange={(e) => setCreditReason(e.target.value)}
          className="w-full px-4 py-2 bg-muted/30 border-2 border-border rounded-xl focus:outline-none focus:border-icsn-teal transition-all text-sm resize-none h-20"
          placeholder="เช่น ชดเชยคลาสที่ยกเลิก, หักเครดิตย้อนหลัง..."
        />
      </div>

      <button
        onClick={handleAdjustCredits}
        disabled={isSaving}
        className="w-full py-3 px-4 rounded-xl font-bold text-white bg-icsn-teal hover:bg-icsn-teal/90 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 text-lg"
      >
        {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
        ยืนยันการปรับปรุงเครดิต
      </button>
    </div>
  );
}

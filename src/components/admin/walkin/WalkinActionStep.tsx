import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface WalkinActionStepProps {
  phone: string;
  searchResult: any;
  selectedChildId: string;
  setSelectedChildId: (val: string) => void;
  newChildName: string;
  setNewChildName: (val: string) => void;
  showPackageSelect: boolean;
  setShowPackageSelect: (val: boolean) => void;
  packageOptions: {name: string, price: number}[];
  selectedPackage: string;
  setSelectedPackage: (val: string) => void;
  isProcessing: boolean;
  handleProcess: (paymentType: 'deduct' | 'paid' | 'trial' | 'paid_package') => void;
  handleReset: () => void;
}

export function WalkinActionStep({
  phone,
  searchResult,
  selectedChildId,
  setSelectedChildId,
  newChildName,
  setNewChildName,
  showPackageSelect,
  setShowPackageSelect,
  packageOptions,
  selectedPackage,
  setSelectedPackage,
  isProcessing,
  handleProcess,
  handleReset
}: WalkinActionStepProps) {
  return (
    <div className="space-y-6">
      
      {/* Search Result Header */}
      <div className={`p-4 rounded-xl border ${searchResult?.found ? 'bg-success/10 border-success/20' : 'bg-muted border-border'}`}>
        <div className="flex items-center gap-3 mb-2">
          {searchResult?.found ? (
            <CheckCircle2 className="w-5 h-5 text-success" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-warning" />
          )}
          <span className="font-bold text-foreground">
            {searchResult?.found ? 'พบข้อมูลผู้ปกครอง' : 'ลูกค้าใหม่ (ไม่พบในระบบ)'}
          </span>
        </div>
        <p className="text-sm text-muted-foreground font-medium">เบอร์โทร: <span className="text-foreground font-bold">{phone}</span></p>
        
        {searchResult?.found && (
          <>
            <p className="text-sm text-muted-foreground font-medium">ชื่อ: <span className="text-foreground font-bold">{searchResult.parent_name}</span></p>
            <p className="text-sm text-muted-foreground font-medium mt-2">
              เครดิตคงเหลือ: <span className={`font-black text-lg ${searchResult.credits > 0 ? 'text-success' : 'text-error'}`}>{searchResult.credits}</span> สิทธิ์
            </p>
          </>
        )}
      </div>

      {/* Child Selection */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-muted-foreground block">เลือกนักเรียน (Select Child)</label>
        
        {searchResult?.found && searchResult.children?.length > 0 && (
          <select 
            className="w-full h-[54px] px-4 rounded-xl border border-border bg-white font-bold outline-none focus:border-icsn-teal"
            value={selectedChildId}
            onChange={(e) => {
              setSelectedChildId(e.target.value);
              if (e.target.value !== 'NEW') setNewChildName('');
            }}
          >
            <option value="" disabled>-- เลือกน้องที่เคยมาเรียน --</option>
            {searchResult.children.map((c: any) => (
              <option key={c.id} value={c.id}>{c.nickname} {c.full_name ? `(${c.full_name})` : ''}</option>
            ))}
            <option value="NEW">+ เพิ่มน้องคนใหม่ (New Child)</option>
          </select>
        )}

        {(!searchResult?.found || selectedChildId === 'NEW') && (
          <input
            type="text"
            required
            placeholder="ชื่อเล่นน้อง (Nickname)"
            value={newChildName}
            onChange={(e) => setNewChildName(e.target.value)}
            className="w-full h-[54px] px-4 rounded-xl border border-border focus:border-icsn-teal outline-none transition font-bold"
            autoFocus
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <label className="text-sm font-bold text-muted-foreground block">ชำระเงินและเช็คอิน (Check-in)</label>
        
        {!showPackageSelect ? (
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleProcess('deduct')}
              disabled={isProcessing || !searchResult?.found || searchResult.credits <= 0}
              className="w-full h-[54px] bg-icsn-teal text-white rounded-xl font-bold hover:bg-icsn-teal/90 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-between px-5"
            >
              <span>ตัด 1 สิทธิ์แพ็คเกจเดิม (Deduct Credit)</span>
              {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowPackageSelect(true)}
                className="w-full h-[48px] bg-white border-2 border-icsn-navy text-icsn-navy rounded-xl font-bold hover:bg-icsn-navy hover:text-white transition"
              >
                ซื้อแพ็คเกจหน้างาน
              </button>
              <button
                onClick={() => handleProcess('trial')}
                disabled={isProcessing}
                className="w-full h-[48px] bg-white border-2 border-success text-success rounded-xl font-bold hover:bg-success hover:text-white transition disabled:opacity-50"
              >
                ให้สิทธิ์ทดลองฟรี
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-muted p-4 rounded-xl border border-border space-y-3">
            <label className="text-sm font-bold text-foreground block">เลือกแพ็คเกจที่ซื้อ</label>
            <select
              className="w-full h-[48px] px-4 rounded-xl border border-border bg-white font-bold outline-none focus:border-icsn-teal"
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
            >
              <option value="" disabled>-- เลือกแพ็คเกจ --</option>
              {packageOptions.map(pkg => (
                <option key={pkg.name} value={pkg.name}>{pkg.name} (฿{pkg.price.toLocaleString()})</option>
              ))}
            </select>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleProcess('paid_package')}
                disabled={isProcessing || !selectedPackage}
                className="flex-1 h-[48px] bg-icsn-navy text-white rounded-xl font-bold hover:bg-icsn-navy/90 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'รับเงินแล้ว (รออัปสลิปทีหลัง)'}
              </button>
              <button
                onClick={() => setShowPackageSelect(false)}
                disabled={isProcessing}
                className="px-4 h-[48px] bg-white border border-border rounded-xl font-bold hover:bg-muted transition text-sm"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}
        
        <button 
          onClick={handleReset} 
          className="w-full text-center py-2 text-sm text-muted-foreground font-bold hover:text-foreground transition underline mt-2"
        >
          ย้อนกลับไปค้นหาใหม่
        </button>
      </div>
      
    </div>
  );
}

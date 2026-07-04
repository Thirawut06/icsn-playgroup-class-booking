import React, { useState, useEffect } from 'react';
import { Search, Loader2, UserPlus, CheckCircle2, X } from 'lucide-react';
import { AdminService, PackageService, supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AdminWalkinModalProps {
  isOpen: boolean;
  sessionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminWalkinModal({ isOpen, sessionId, onClose, onSuccess }: AdminWalkinModalProps) {
  const [step, setStep] = useState<1 | 2>(1); // 1: Search, 2: Action
  const [phone, setPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Search Results
  const [searchResult, setSearchResult] = useState<any>(null);
  
  // Form state
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [newChildName, setNewChildName] = useState('');
  
  // Package Options
  const [packageOptions, setPackageOptions] = useState<{name: string, price: number}[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [showPackageSelect, setShowPackageSelect] = useState(false);

  useEffect(() => {
    if (isOpen) {
      PackageService.getPackageOptions()
        .then((data) => setPackageOptions(data || []));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep(1);
    setPhone('');
    setSearchResult(null);
    setSelectedChildId('');
    setNewChildName('');
    setShowPackageSelect(false);
    setSelectedPackage('');
  };

  const closeAndReset = () => {
    handleReset();
    onClose();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 9) return toast.error("กรุณากรอกเบอร์โทรศัพท์ให้ครบ");
    
    setIsSearching(true);
    try {
      const res = await AdminService.adminSearchWalkin(phone);
      setSearchResult(res);
      setStep(2);
      
      if (res?.found && res.children?.length > 0) {
        setSelectedChildId(res.children[0].id);
      } else {
        setSelectedChildId('');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSearching(false);
    }
  };

  const handleProcess = async (paymentType: 'deduct' | 'paid' | 'trial' | 'paid_package') => {
    if (searchResult?.found && searchResult.children?.length > 0 && !selectedChildId && !newChildName) {
      return toast.error("กรุณาเลือกเด็ก หรือพิมพ์ชื่อเด็กคนใหม่");
    }
    if (!searchResult?.found && !newChildName.trim()) {
      return toast.error("กรุณากรอกชื่อเล่นเด็ก");
    }
    if (paymentType === 'paid_package' && !selectedPackage) {
      return toast.error("กรุณาเลือกแพ็คเกจที่ลูกค้าชำระเงิน");
    }

    setIsProcessing(true);
    try {
      if (!sessionId) {
        throw new Error('กรุณาเลือกรอบเวลาก่อนทำรายการ');
      }

      const finalChildId = selectedChildId === 'NEW' || !selectedChildId ? null : selectedChildId;
      const finalChildName = finalChildId ? '' : newChildName;

      await AdminService.adminProcessWalkin({
        phone,
        childId: finalChildId,
        childName: finalChildName,
        sessionId,
        paymentType,
        packageName: paymentType === 'paid_package' ? selectedPackage : undefined
      });
      
      toast.success("บันทึก Walk-in สำเร็จ!");
      if (paymentType === 'paid_package') {
        toast.success("สร้างรายการรออัปสลิปไว้ใน Pending Slips แล้ว");
      }
      onSuccess();
      closeAndReset();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-3xl p-6 w-full max-w-[450px] shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-icsn-navy flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-icsn-teal" /> 
            Walk-in หน้าเคาน์เตอร์
          </h3>
          <button onClick={closeAndReset} className="text-muted-foreground hover:bg-muted p-2 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 && (
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground block">เบอร์โทรศัพท์ผู้ปกครอง (Phone Number)</label>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="tel"
                  required
                  autoFocus
                  placeholder="08XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-12 pr-4 h-[54px] rounded-xl border border-border focus:border-icsn-teal focus:ring-1 focus:ring-icsn-teal outline-none transition font-bold"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isSearching || !phone}
              className="w-full h-[54px] bg-icsn-teal text-white rounded-xl font-bold shadow-sm hover:bg-icsn-teal/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ค้นหาข้อมูล'}
            </button>
          </form>
        )}

        {step === 2 && (
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
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { X, Wallet, ChevronRight, UploadCloud, Loader2 } from 'lucide-react';
import type { PackageOption } from '@/types';
import { AppDB } from '@/lib/supabase';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId: string;
  paymentPackages: PackageOption[];
}

export function TopUpModal({ isOpen, onClose, parentId, paymentPackages }: TopUpModalProps) {
  const [packageType, setPackageType] = useState('');
  const [paymentSlipData, setPaymentSlipData] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("ขนาดไฟล์ต้องไม่เกิน 10MB");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => setPaymentSlipData(evt.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submitTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageType || !paymentSlipData) return;
    setIsSubmitting(true);
    try {
      // Pass a default 'false' or let the page nonRefundable state be requested. 
      // Wait, in book/page.tsx, the nonRefundable field was NOT in the top up modal previously. 
      // It was only in apply/page.tsx. Let's pass true or change AppDB signature. 
      // AppDB.submitTopUp expects (parentId, packageId, file/data, nonRefundable = true).
      await AppDB.submitTopUp(parentId, packageType, paymentSlipData, true);
      alert("ส่งสลิปสำเร็จ รอเจ้าหน้าที่ตรวจสอบ");
      setPaymentSlipData('');
      setPackageType('');
      onClose();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#211551]/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[420px] rounded-[32px] p-8 relative shadow-2xl">
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 p-2 bg-gray-50 text-gray-400 hover:text-[#211551] hover:bg-gray-100 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="mb-6 text-center">
          <div className="w-16 h-16 bg-[#00B0B9]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-[#00B0B9]" />
          </div>
          <h2 className="text-2xl font-black text-[#211551]">Top Up Credits</h2>
          <p className="text-[13px] text-gray-500 mt-2 font-medium">เพิ่มสิทธิ์เพื่อจองคลาสเรียนเพลย์กรุ๊ป</p>
        </div>

        <form onSubmit={submitTopUp} className="space-y-5">
          <div>
            <label className="block text-[14px] font-bold text-[#211551] mb-2">Select Package</label>
            <div className="relative">
              <select 
                value={packageType} 
                onChange={e => setPackageType(e.target.value)} 
                className="w-full p-4 text-[15px] font-bold border border-gray-200 rounded-2xl bg-gray-50 focus:ring-2 focus:ring-[#00B0B9] focus:outline-none appearance-none cursor-pointer text-[#211551]" 
                required
              >
                <option value="">-- เลือกแพ็กเกจ --</option>
                {paymentPackages.map(p => (
                  <option key={p.id} value={p.name}>{p.name} - {p.price} บาท ({p.credits} Credits)</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-center p-8 border-2 border-dashed border-[#00B0B9]/30 bg-[#00B0B9]/5 rounded-2xl cursor-pointer hover:bg-[#00B0B9]/10 transition">
              <UploadCloud className="w-10 h-10 text-[#00B0B9] mx-auto mb-3" />
              <span className="text-[15px] font-bold text-[#00B0B9] block">อัปโหลดสลิปโอนเงิน</span>
              <span className="text-[12px] text-gray-500 font-medium mt-1.5 block">รองรับไฟล์รูปภาพ JPG, PNG</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} required />
            </label>
            {paymentSlipData && (
              <div className="mt-4 p-2 border border-gray-100 rounded-2xl relative shadow-sm bg-white">
                 <img src={paymentSlipData} alt="Slip" className="h-48 w-full rounded-xl object-contain bg-gray-50" />
                 <button type="button" onClick={() => setPaymentSlipData('')} className="absolute top-4 right-4 bg-rose-500 text-white p-1.5 rounded-full shadow-md hover:bg-rose-600 transition hover:scale-110">
                   <X className="w-4 h-4" />
                 </button>
              </div>
            )}
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full bg-[#211551] text-white py-4 rounded-2xl font-bold text-[16px] flex justify-center shadow-lg hover:bg-[#2d1d6e] transition-all disabled:opacity-50 mt-4 hover:-translate-y-0.5 active:translate-y-0"
          >
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}

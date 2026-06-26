import React, { useState } from 'react';
import { X, Wallet, ChevronRight, UploadCloud, Loader2, CheckCircle2 } from 'lucide-react';
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
  const [paymentSlipFile, setPaymentSlipFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setPaymentSlipData('');
    setPaymentSlipFile(null);
    setPackageType('');
    setIsSuccess(false);
    onClose();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("ขนาดไฟล์ต้องไม่เกิน 10MB");
        e.target.value = "";
        return;
      }
      setPaymentSlipFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => setPaymentSlipData(evt.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submitTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageType || !paymentSlipFile) return;
    setIsSubmitting(true);
    try {
      await AppDB.submitTopUp(parentId, packageType, paymentSlipFile, true);
      setIsSuccess(true);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#211551]/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[420px] max-h-[90vh] overflow-y-auto rounded-[28px] p-5 relative shadow-2xl">
        {!isSuccess && (
          <button
            onClick={resetAndClose}
            className="absolute top-4 right-4 p-2 bg-gray-50 text-gray-400 hover:text-[#211551] hover:bg-gray-100 rounded-full transition z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-[#211551] mb-2">Submitted!</h2>
            <p className="text-[14px] text-gray-500 font-medium mb-6 leading-relaxed">
              ส่งหลักฐานการชำระเงินเรียบร้อยแล้ว<br />
              กรุณารอเจ้าหน้าที่ตรวจสอบและอัปเดตเครดิต<br />
            </p>
            <button
              onClick={resetAndClose}
              className="w-full bg-[#00B0B9] text-white py-3.5 rounded-xl font-bold text-[15px] shadow-sm hover:bg-[#00969e] transition-all"
            >
              รับทราบ / ปิดหน้าต่าง
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3 pr-8">
              <div className="w-9 h-9 bg-[#00B0B9]/10 rounded-full flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-[#00B0B9]" />
              </div>
              <div className="text-left">
                <h2 className="text-[17px] font-black text-[#211551] leading-tight">Top Up Credits</h2>
                <p className="text-[11px] text-gray-500 font-medium">เพิ่มสิทธิ์เพื่อจองคลาสเรียนเพลย์กรุ๊ป</p>
              </div>
            </div>

            <form onSubmit={submitTopUp} className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-[#211551] mb-1.5">Select Package</label>
                <div className="relative">
                  <select
                    value={packageType}
                    onChange={e => setPackageType(e.target.value)}
                    className="w-full px-4 py-3 text-[14px] font-bold border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#00B0B9] focus:outline-none appearance-none cursor-pointer text-[#211551]"
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
                <label className="block text-[13px] font-bold text-[#211551] mb-1.5">Payment Method</label>
                <div className="mb-2 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <img src="/payment-method.jpg" alt="Payment Method" className="w-full h-auto" />
                </div>

                <label className="flex items-center gap-3 p-3 border-2 border-dashed border-[#00B0B9]/30 bg-[#00B0B9]/5 rounded-xl cursor-pointer hover:bg-[#00B0B9]/10 transition">
                  <UploadCloud className="w-7 h-7 text-[#00B0B9] shrink-0" />
                  <div>
                    <span className="text-[13px] font-bold text-[#00B0B9] block">อัปโหลดสลิปโอนเงิน</span>
                    <span className="text-[11px] text-gray-500 font-medium">{paymentSlipFile ? paymentSlipFile.name : 'JPG, PNG, HEIC — ไม่เกิน 10MB'}</span>
                  </div>
                  <input type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleFile} required />
                </label>

                {paymentSlipData && (
                  <div className="mt-2 flex items-center gap-2 p-2 border border-gray-100 rounded-xl bg-white">
                    <img src={paymentSlipData} alt="Slip" className="h-10 w-10 rounded-lg object-cover bg-gray-50 shrink-0" />
                    <span className="text-[12px] text-gray-600 flex-1 truncate">{paymentSlipFile?.name}</span>
                    <button type="button" onClick={() => { setPaymentSlipData(''); setPaymentSlipFile(null); }} className="bg-rose-500 text-white p-1 rounded-full hover:bg-rose-600 transition shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#211551] text-white py-3.5 rounded-xl font-bold text-[15px] flex justify-center shadow-md hover:bg-[#2d1d6e] transition-all disabled:opacity-50 mt-2 hover:-translate-y-0.5 active:translate-y-0"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Payment'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { X, Wallet, ChevronRight, UploadCloud, Loader2, CheckCircle2 } from 'lucide-react';
import type { PackageOption } from '@/types';
import { PackageService } from '@/lib/supabase';
import { APP_CONFIG } from '@/config/appConfig';
import { COPY } from '@/config/copy';
import toast from 'react-hot-toast';

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
      if (file.size > APP_CONFIG.MAX_UPLOAD_SIZE_BYTES) {
        toast.error(COPY.ALERTS.FILE_TOO_LARGE(APP_CONFIG.MAX_UPLOAD_SIZE_MB));
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
      await PackageService.submitTopUp(parentId, packageType, paymentSlipFile, true);
      setIsSuccess(true);
    } catch (e: unknown) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(e instanceof Error ? e.message : String(e)));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-icsn-navy/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[420px] max-h-[90vh] overflow-y-auto rounded-3xl p-5 relative shadow-2xl">
        {!isSuccess && (
          <button
            onClick={resetAndClose}
            className="absolute top-4 right-4 p-2 bg-muted text-muted-foreground/70 hover:text-icsn-navy hover:bg-muted/80 rounded-full transition z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-2xl font-black text-icsn-navy mb-2">Submitted!</h2>
            <p className="text-base text-muted-foreground font-medium mb-6 leading-relaxed">
              ส่งหลักฐานการชำระเงินเรียบร้อยแล้ว<br />
              กรุณารอเจ้าหน้าที่ตรวจสอบและอัปเดตเครดิต<br />
            </p>
            <button
              onClick={resetAndClose}
              className="w-full bg-icsn-teal text-white py-3.5 rounded-xl font-bold text-base shadow-sm hover:bg-icsn-teal/90 transition-all"
            >
              รับทราบ / ปิดหน้าต่าง
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3 pr-8">
              <div className="w-9 h-9 bg-icsn-teal/10 rounded-full flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-icsn-teal" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-black text-icsn-navy leading-tight">Top Up Credits</h2>
                <p className="text-xs text-muted-foreground font-medium">{COPY.APPLY_FLOW.TOPUP_TITLE}</p>
              </div>
            </div>

            <form onSubmit={submitTopUp} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-icsn-navy mb-1.5">Select Package</label>
                <div className="relative">
                  <select
                    value={packageType}
                    onChange={e => setPackageType(e.target.value)}
                    className="w-full px-4 py-3 text-base font-bold border border-border rounded-xl bg-muted focus:ring-2 focus:ring-icsn-teal focus:outline-none appearance-none cursor-pointer text-icsn-navy"
                    required
                  >
                    <option value="">{COPY.APPLY_FLOW.SELECT_PACKAGE}</option>
                    {paymentPackages.map(p => (
                      <option key={p.id} value={p.name}>{p.name} - {p.price} บาท ({p.credits} Credits)</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-muted-foreground/70">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-icsn-navy mb-1.5">Payment Method</label>
                <div className="mb-2 rounded-xl overflow-hidden border border-border shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/payment-method.jpg" alt="Payment Method" className="w-full h-auto" />
                </div>

                <label className="flex items-center gap-3 p-3 border-2 border-dashed border-icsn-teal/30 bg-icsn-teal/5 rounded-xl cursor-pointer hover:bg-icsn-teal/10 transition">
                  <UploadCloud className="w-7 h-7 text-icsn-teal shrink-0" />
                  <div>
                    <span className="text-sm font-bold text-icsn-teal block">{COPY.APPLY_FLOW.UPLOAD_SLIP}</span>
                    <span className="text-xs text-muted-foreground font-medium">{paymentSlipFile ? paymentSlipFile.name : COPY.RULES.UPLOAD_LIMIT_HINT(APP_CONFIG.SUPPORTED_IMAGE_TYPES, APP_CONFIG.MAX_UPLOAD_SIZE_MB)}</span>
                  </div>
                  <input type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleFile} required />
                </label>

                {paymentSlipData && (
                  <div className="mt-2 flex items-center gap-2 p-2 border border-border rounded-xl bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={paymentSlipData} alt="Slip" className="h-10 w-10 rounded-lg object-cover bg-muted shrink-0" />
                    <span className="text-sm text-muted-foreground flex-1 truncate">{paymentSlipFile?.name}</span>
                    <button type="button" onClick={() => { setPaymentSlipData(''); setPaymentSlipFile(null); }} className="bg-error text-white p-1 rounded-full hover:bg-error transition shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-icsn-navy text-white py-3.5 rounded-xl font-bold text-base flex justify-center shadow-md hover:bg-icsn-navy/90 transition-all disabled:opacity-50 mt-2 hover:-translate-y-0.5 active:translate-y-0"
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


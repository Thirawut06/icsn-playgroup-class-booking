import React from 'react';
import type { PackageOption } from '@/types';
import { COPY } from '@/config/copy';

interface PaymentSectionProps {
  path: 'trial' | 'payment' | null;
  paymentPackages: PackageOption[];
  packageType: string;
  setPackageType: (val: string) => void;
  paymentSlipData: string;
  setPaymentSlipData: (val: string) => void;
  setPaymentSlipFile: (file: File | null) => void;
  handleFile: (e: React.ChangeEvent<HTMLInputElement>, setData: React.Dispatch<React.SetStateAction<string>>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => void;
}

export function PaymentSection({
  path,
  paymentPackages,
  packageType,
  setPackageType,
  paymentSlipData,
  setPaymentSlipData,
  setPaymentSlipFile,
  handleFile
}: PaymentSectionProps) {
  if (path !== 'payment') return null;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pt-4 border-t border-border mb-2">
        <h3 className="text-lg font-bold text-icsn-pink">Payment Confirmation</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{COPY.APPLY_FLOW.TRANSFER_INSTRUCTION}</p>
      </div>

      {/* Package Selection (Radio) */}
      <div>
        <label className="block mb-3">
          <span className="text-base font-bold text-foreground">Please choose a package of your payment <span className="text-error">*</span></span>
          <span className="block text-sm text-muted-foreground -mt-0.5">กรุณาเลือกแพ็กเกจการชำระเงินของท่าน</span>
        </label>
        <div className="space-y-2.5">
          {paymentPackages.map(pkg => (
            <label
              key={pkg.id}
              className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-colors ${packageType === pkg.name ? 'border-icsn-pink bg-icsn-pink/5' : 'border-border hover:bg-muted/80'}`}
            >
              <input
                type="radio"
                value={pkg.name}
                checked={packageType === pkg.name}
                onChange={() => setPackageType(pkg.name)}
                className="custom-radio-pink"
              />
              <span className="text-sm font-semibold text-foreground leading-relaxed">{pkg.name} - {pkg.price} บาท</span>
            </label>
          ))}
        </div>
      </div>

      {/* Payment Method Image */}
      <div>
        <label className="block mb-1.5">
          <span className="text-base font-bold text-foreground">Payment Method : Please upload your payment evident <span className="text-error">*</span></span>
          <span className="block text-sm text-muted-foreground -mt-0.5">ขั้นตอนการชำระเงิน: กรุณาแนบหลักฐานการชำระเงิน</span>
        </label>
        <div className="mb-4 max-w-sm mx-auto">
          <img src="/payment-method.jpg" alt="Payment Method Instruction" className="w-full h-auto rounded-xl border border-border shadow-sm" />
        </div>
        <input
          type="file"
          accept="image/*,.heic,.heif"
          onChange={(e) => handleFile(e, setPaymentSlipData as any, setPaymentSlipFile as any)}
          required
          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-icsn-pink/10 file:text-icsn-pink hover:file:bg-icsn-pink/20 border border-border rounded-xl bg-white mb-1.5 cursor-pointer outline-none"
        />
        <span className="block text-xs text-muted-foreground/70 mb-2">{COPY.APPLY_FLOW.UPLOAD_LIMIT}</span>
        {paymentSlipData && (
          <div className="mt-2 w-32 rounded-xl overflow-hidden border border-border bg-muted">
            <img src={paymentSlipData} alt="Preview" className="w-full h-auto object-contain" />
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Wallet, Loader2, AlertCircle } from 'lucide-react';
import { PackageService, supabase } from '@/lib/supabase';
import { FILE_UPLOAD } from '@/config/constants';
import type { PackageOption } from '@/types';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import { useBookingContext } from './BookingContext';
import { LineSupportCard } from '@/components/ui/LineSupportCard';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId: string;
  paymentPackages: PackageOption[];
}

export function TopUpModal({ isOpen, onClose, parentId, paymentPackages }: TopUpModalProps) {
  const { dict } = useDictionary();
  const { refreshData } = useBookingContext();
  const [packageType, setPackageType] = useState('');
  const [paymentSlipData, setPaymentSlipData] = useState('');
  const [paymentSlipFile, setPaymentSlipFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fileToast, setFileToast] = useState('');

  // Auto-dismiss toast
  useEffect(() => {
    if (fileToast) {
      const timer = setTimeout(() => setFileToast(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [fileToast]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileToast('');
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > FILE_UPLOAD.MAX_SIZE_BYTES) {
        setFileToast(dict.apply.fileTooLarge.replace('{mb}', String(FILE_UPLOAD.MAX_SIZE_MB)));
        e.target.value = "";
        return;
      }
      setPaymentSlipFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => setPaymentSlipData(evt.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!packageType || !paymentSlipFile) {
      setErrorMsg(dict.apply.uploadSlipRequired);
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg('');
    
    try {
      const result = await PackageService.submitTopUp(parentId, packageType, paymentSlipFile, true);
      // Snapshot sync is now handled automatically via database triggers (pg_net)
      
      // Fire and forget appending to Google Sheets
      try {
        const formDataPayload = {
          form_type: 'manual',
          parentId: parentId,
          transactionId: result && typeof result.slipId === 'string' ? result.slipId : parentId
        };
        
        supabase.functions.invoke('append-to-sheets', {
          body: formDataPayload
        }).catch(err => console.error("Error appending to sheets:", err));
      } catch (err) {
        console.error("Failed to invoke append-to-sheets", err);
      }
        
      await refreshData(false);
      setShowSuccess(true);
    } catch (e: any) {
      setErrorMsg(e.message || dict.apply.genericError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPackageType('');
    setPaymentSlipData('');
    setPaymentSlipFile(null);
    setShowSuccess(false);
    setErrorMsg('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose}></div>
      
      {/* Floating File Size Error */}
      {fileToast && (
        <div className="fixed top-6 left-1/2 z-[200] max-w-[400px] w-[calc(100%-48px)]" style={{ transform: 'translateX(-50%)', animation: 'toastIn 0.25s ease-out' }}>
          <div className="bg-error text-white px-5 py-4 rounded-2xl shadow-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="font-bold text-sm leading-snug flex-1">{fileToast}</p>
            <button onClick={() => setFileToast('')} className="text-white/70 hover:text-white shrink-0">
              <span className="text-lg leading-none">&times;</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-[480px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-icsn-bg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-icsn-navy/10 text-icsn-navy flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-icsn-navy">{dict.topUp.heading}</h3>
          </div>
          <button onClick={handleClose} className="p-2 -mr-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {showSuccess ? (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-icsn-navy mb-2">{dict.topUp.submitted}</h4>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {dict.topUp.submittedMsg}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                {dict.topUp.title}
              </p>
              
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">{dict.topUp.selectPackage} <span className="text-error">*</span></label>
                <div className="relative">
                  <select 
                    value={packageType} 
                    onChange={e => setPackageType(e.target.value)}
                    className="w-full h-12 px-4 border border-border rounded-xl bg-white focus:border-icsn-teal focus:outline-none appearance-none font-medium text-foreground transition-colors cursor-pointer"
                  >
                    <option value="" disabled>{dict.topUp.selectPackagePlaceholder}</option>
                    {paymentPackages.map(pkg => (
                      <option key={pkg.id} value={pkg.name}>
                        {pkg.name} - {pkg.price} {dict.common.baht}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">{dict.topUp.paymentMethod} <span className="text-error">*</span></label>
                <img src="/New_Kbank_QR_acc-no.png" alt="Payment details" className="w-full rounded-xl shadow-md" />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">{dict.topUp.uploadSlip} <span className="text-error">*</span></label>
                <input 
                  type="file" 
                  accept="image/*,.heic,.heif" 
                  onChange={handleFile}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-icsn-navy/10 file:text-icsn-navy hover:file:bg-icsn-navy/20 border border-border rounded-xl bg-white mb-1.5 cursor-pointer outline-none"
                />
                <span className="block text-xs text-muted-foreground/70 mb-3">{dict.apply.uploadLimit}</span>
                {paymentSlipData && (
                  <div className="w-24 h-auto rounded-xl overflow-hidden border border-border bg-white shadow-sm">
                    <img src={paymentSlipData} alt="Slip Preview" className="w-full h-auto object-contain" />
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="bg-error/10 text-error px-4 py-3 rounded-xl text-sm font-medium border border-error/20 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  {errorMsg}
                </div>
              )}

              <div className="pt-2">
                <LineSupportCard className="!mt-0" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-icsn-bg">
          {showSuccess ? (
            <button 
              onClick={handleClose}
              className="w-full bg-icsn-navy hover:bg-icsn-navy/90 text-white font-bold h-12 rounded-xl transition-all shadow-sm flex items-center justify-center text-[15px]"
            >
              {dict.topUp.acknowledgeClose}
            </button>
          ) : (
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !packageType || !paymentSlipFile}
              className="w-full bg-icsn-navy hover:bg-icsn-navy/90 disabled:bg-foreground/10 disabled:text-muted-foreground disabled:cursor-not-allowed text-white font-bold h-12 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-[15px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {dict.apply.submitting}
                </>
              ) : (
                dict.topUp.confirmPayment
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

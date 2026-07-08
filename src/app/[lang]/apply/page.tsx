"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ParentService, PackageService, supabase } from '@/lib/supabase';
import { FILE_UPLOAD } from '@/config/constants';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { PackageOption } from '@/types';
import { Button } from '@/components/ui/button';
import { ApplyHeader } from '@/components/apply/ApplyHeader';
import { PathSelector } from '@/components/apply/PathSelector';
import { SuccessScreen } from '@/components/apply/SuccessScreen';
import { ParentInfoSection } from '@/components/apply/ParentInfoSection';
import { ChildInfoSection } from '@/components/apply/ChildInfoSection';
import { PhotoUploadSection } from '@/components/apply/PhotoUploadSection';
import { PaymentSection } from '@/components/apply/PaymentSection';
import { AgreementsSection } from '@/components/apply/AgreementsSection';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import { ROUTES } from '@/config/routes';

const applyCache: Record<string, any> = {};

function useCachedState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (key in applyCache) {
      return applyCache[key];
    }
    return defaultValue;
  });

  useEffect(() => {
    applyCache[key] = state;
  }, [key, state]);

  return [state, setState];
}

export default function Apply() {
  const router = useRouter();
  const { dict, lang } = useDictionary();
  const [path, setPath] = useCachedState<'trial' | 'payment' | null>('path', null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fileToast, setFileToast] = useState('');

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (fileToast) {
      const timer = setTimeout(() => setFileToast(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [fileToast]);

  // Parent fields
  const [parentEmail, setParentEmail] = useCachedState('parentEmail', '');
  const [parentName, setParentName] = useCachedState('parentName', '');
  const [parentPhone, setParentPhone] = useCachedState('parentPhone', '');
  const [isReturningParent, setIsReturningParent] = useCachedState('isReturningParent', false);

  // Child fields
  const [childName, setChildName] = useCachedState('childName', '');
  const [childNickname, setChildNickname] = useCachedState('childNickname', '');
  const [childDob, setChildDob] = useCachedState('childDob', '');
  const [allergy, setAllergy] = useCachedState('allergy', '');
  const [info, setInfo] = useCachedState('info', '');

  // File uploads
  const [parentPhotoData, setParentPhotoData] = useCachedState('parentPhotoData', '');
  const [parentPhotoFile, setParentPhotoFile] = useCachedState<File | null>('parentPhotoFile', null);
  const [childPhotoData, setChildPhotoData] = useCachedState('childPhotoData', '');
  const [childPhotoFile, setChildPhotoFile] = useCachedState<File | null>('childPhotoFile', null);
  const [paymentSlipData, setPaymentSlipData] = useCachedState('paymentSlipData', '');
  const [paymentSlipFile, setPaymentSlipFile] = useCachedState<File | null>('paymentSlipFile', null);

  // Agreements & Permissions
  const [mediaPerm, setMediaPerm] = useCachedState<string>('mediaPerm', ''); // 'Yes' or 'No'
  const [noPhotoPerm, setNoPhotoPerm] = useCachedState('noPhotoPerm', false);
  const [nonRefundable, setNonRefundable] = useCachedState('nonRefundable', false);

  // Payment
  const [paymentPackages, setPaymentPackages] = useCachedState<PackageOption[]>('paymentPackages', []);
  const [packageType, setPackageType] = useCachedState('packageType', '');

  const todayStr = new Date().toISOString().split('T')[0];

  // Clear form data when going back to path selector
  useEffect(() => {
    if (!path) {
      setParentPhotoData('');
      setParentPhotoFile(null);
      setChildPhotoData('');
      setChildPhotoFile(null);
      setPaymentSlipData('');
      setPaymentSlipFile(null);
      setPackageType('');
    }
  }, [path]);

  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push(ROUTES.LOGIN(lang, 'signup'));
        return;
      }
      setParentId(user.id);
      
      ParentService.getParentDetails(user.id).then(parent => {
        if (parent) {
          setParentEmail(parent.email || '');
          setParentName(parent.name || '');
          setParentPhone(parent.phone || '');

          if (parent.name) setIsReturningParent(true);

          if (parent.children && parent.children.length > 0) {
            const params = new URLSearchParams(window.location.search);
            if (params.get('addChild') !== 'true') {
              router.push(ROUTES.BOOK(lang));
            }
          }
        }
      });
    });

    PackageService.getPackageOptions().then(setPaymentPackages).catch(console.error);
  }, [router, lang]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, setData: React.Dispatch<React.SetStateAction<string>>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => {
    setFileToast('');
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > FILE_UPLOAD.MAX_SIZE_BYTES) {
        setFileToast(dict.apply.fileTooLarge.replace('{mb}', String(FILE_UPLOAD.MAX_SIZE_MB)));
        e.target.value = "";
        return;
      }
      setFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => setData(evt.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (!parentId) throw new Error(dict.apply.parentNotFound);

      // Validate media permission
      if (!mediaPerm) {
        throw new Error(dict.apply.selectMediaPerm);
      }
      if (!noPhotoPerm) {
        throw new Error(dict.apply.confirmNoPhoto);
      }

      if (path === 'trial' && !allergy.trim()) {
        throw new Error("กรุณากรอกข้อมูลการแพ้อาหาร (หากไม่มีกรุณากรอกว่า 'ไม่มี' หรือ 'None')");
      }

      await ParentService.submitNewChild({
        parentId,
        childName,
        childNickname,
        childDob,
        childPhotoFile,
        parentPhotoFile,
        allergy: allergy || '-',
        info: info || '',
        mediaPerm: mediaPerm === 'Yes',
        noPhotoPerm
      });

      let transactionId = parentId; // Default to parentId for Trial

      if (path === 'payment') {
        if (!paymentSlipFile || !packageType) {
          throw new Error(dict.apply.uploadSlipRequired);
        }
        if (!nonRefundable) {
          throw new Error(dict.apply.confirmNonRefundable);
        }
        const result = await PackageService.submitTopUp(parentId, packageType, paymentSlipFile, nonRefundable);
        if (result && result.id) {
          transactionId = result.id;
        }
      } else if (path === 'trial') {
        await PackageService.grantTrialPackage(parentId);
      }

      // Fire and forget appending to Google Sheets
      try {
        const formDataPayload = {
          form_type: path,
          parentId: parentId,
          transactionId: transactionId
        };
        
        supabase.functions.invoke('append-to-sheets', {
          body: formDataPayload
        }).catch(err => console.error("Error appending to sheets:", err));
      } catch (err) {
        console.error("Failed to invoke append-to-sheets", err);
      }


      setShowSuccess(true);
      // Clear cache so next visit is fresh
      for (const key in applyCache) {
        delete applyCache[key];
      }
    } catch (error: any) {
      setErrorMessage(error.message || dict.apply.genericError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-icsn-bg min-h-screen font-sarabun">
      <div className="max-w-[480px] mx-auto bg-white min-h-screen shadow-sm flex flex-col relative overflow-hidden pb-10">

        {/* Floating Toast Notification */}
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

        {/* Header */}
        <ApplyHeader showSuccess={showSuccess} path={path} setPath={setPath} />

        {/* Step Selector */}
        {!path && !showSuccess && (
          <PathSelector setPath={setPath} />
        )}

        {/* Success */}
        {showSuccess && (
          <SuccessScreen path={path} />
        )}

        {/* Form */}
        {path && !showSuccess && (
          <div className="px-6 pb-10 mt-6 relative z-10">
            <div className="flex items-center justify-center pb-6 mb-6 border-b border-border">
              <h2 className="text-lg font-bold text-icsn-navy text-center">
                {path === 'trial' ? dict.apply.trialFormTitle : dict.apply.paymentFormTitle}
              </h2>
            </div>

            <form onSubmit={submitForm} className="space-y-6">
              <input type="hidden" value={parentEmail} />

              <ParentInfoSection
                path={path}
                parentName={parentName}
                setParentName={setParentName}
                parentPhone={parentPhone}
                setParentPhone={setParentPhone}
                isReturningParent={isReturningParent}
              />

              <ChildInfoSection
                path={path}
                childName={childName}
                setChildName={setChildName}
                childNickname={childNickname}
                setChildNickname={setChildNickname}
                childDob={childDob}
                setChildDob={setChildDob}
                allergy={allergy}
                setAllergy={setAllergy}
                info={info}
                setInfo={setInfo}
                todayStr={todayStr}
              />

              <PhotoUploadSection
                path={path}
                parentPhotoData={parentPhotoData}
                setParentPhotoData={setParentPhotoData}
                setParentPhotoFile={setParentPhotoFile}
                childPhotoData={childPhotoData}
                setChildPhotoData={setChildPhotoData}
                setChildPhotoFile={setChildPhotoFile}
                handleFile={handleFile}
              />

              <PaymentSection
                path={path}
                paymentPackages={paymentPackages}
                packageType={packageType}
                setPackageType={setPackageType}
                paymentSlipData={paymentSlipData}
                setPaymentSlipData={setPaymentSlipData}
                setPaymentSlipFile={setPaymentSlipFile}
                handleFile={handleFile}
              />

              <AgreementsSection
                path={path}
                mediaPerm={mediaPerm}
                setMediaPerm={setMediaPerm}
                noPhotoPerm={noPhotoPerm}
                setNoPhotoPerm={setNoPhotoPerm}
                nonRefundable={nonRefundable}
                setNonRefundable={setNonRefundable}
              />

              {/* Error Message */}
              {errorMessage && (
                <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-base font-medium flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{errorMessage}</p>
                </div>
              )}

              {/* Submit */}
              <div className="pt-2 pb-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-icsn-teal hover:bg-icsn-teal/90 disabled:bg-foreground/10 disabled:cursor-not-allowed text-white py-3.5 px-4 rounded-full font-bold shadow-md h-[52px] flex items-center justify-center gap-2 cursor-pointer text-lg"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSubmitting ? dict.apply.submitting : dict.apply.submitRegistration}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

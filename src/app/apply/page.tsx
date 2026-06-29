"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ParentService, PackageService } from '@/lib/supabase';
import { STORAGE_KEYS } from '@/config/constants';
import { Ticket, Wallet, ChevronRight, Check, ArrowLeft, Loader2, UploadCloud, AlertCircle } from 'lucide-react';
import type { PackageOption } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApplyHeader } from '@/components/apply/ApplyHeader';
import { PathSelector } from '@/components/apply/PathSelector';
import { SuccessScreen } from '@/components/apply/SuccessScreen';
import { ParentInfoSection } from '@/components/apply/ParentInfoSection';
import { ChildInfoSection } from '@/components/apply/ChildInfoSection';
import { PhotoUploadSection } from '@/components/apply/PhotoUploadSection';
import { PaymentSection } from '@/components/apply/PaymentSection';
import { AgreementsSection } from '@/components/apply/AgreementsSection';

export default function Apply() {
  const router = useRouter();
  const [path, setPath] = useState<'trial' | 'payment' | null>(null);
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
  const [parentEmail, setParentEmail] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [isReturningParent, setIsReturningParent] = useState(false);

  // Child fields
  const [childName, setChildName] = useState('');
  const [childNickname, setChildNickname] = useState('');
  const [childDob, setChildDob] = useState('');
  const [allergy, setAllergy] = useState('');
  const [info, setInfo] = useState('');

  // File uploads
  const [parentPhotoData, setParentPhotoData] = useState('');
  const [parentPhotoFile, setParentPhotoFile] = useState<File | null>(null);
  const [childPhotoData, setChildPhotoData] = useState('');
  const [childPhotoFile, setChildPhotoFile] = useState<File | null>(null);
  const [paymentSlipData, setPaymentSlipData] = useState('');
  const [paymentSlipFile, setPaymentSlipFile] = useState<File | null>(null);

  // Agreements & Permissions
  const [mediaPerm, setMediaPerm] = useState<string>(''); // 'Yes' or 'No'
  const [noPhotoPerm, setNoPhotoPerm] = useState(false);
  const [nonRefundable, setNonRefundable] = useState(false);

  // Payment
  const [paymentPackages, setPaymentPackages] = useState<PackageOption[]>([]);
  const [packageType, setPackageType] = useState('');

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

  useEffect(() => {
    const parentId = localStorage.getItem(STORAGE_KEYS.PARENT_ID);
    if (!parentId) {
      router.push('/login?tab=signup');
      return;
    }

    ParentService.getParentDetails(parentId).then(parent => {
      if (parent) {
        setParentEmail(parent.email || localStorage.getItem(STORAGE_KEYS.PARENT_EMAIL) || '');
        setParentName(parent.name || localStorage.getItem(STORAGE_KEYS.PARENT_NAME) || '');
        setParentPhone(parent.phone || localStorage.getItem(STORAGE_KEYS.PARENT_PHONE) || '');

        // Check if parent name/phone already stored (returning user = disabled fields)
        if (localStorage.getItem(STORAGE_KEYS.PARENT_NAME)) setIsReturningParent(true);

        if (parent.children && parent.children.length > 0) {
          const params = new URLSearchParams(window.location.search);
          if (params.get('addChild') !== 'true') {
            router.push('/book');
          }
        }
      }
    });

    PackageService.getPackageOptions().then(setPaymentPackages).catch(console.error);
  }, [router]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, setData: React.Dispatch<React.SetStateAction<string>>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => {
    setFileToast('');
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        setFileToast(`ไฟล์มีขนาด ${sizeMB}MB — ขนาดไฟล์ต้องไม่เกิน 10MB`);
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
      const parentId = localStorage.getItem(STORAGE_KEYS.PARENT_ID);
      if (!parentId) throw new Error("ไม่พบข้อมูลผู้ปกครอง");

      // Validate media permission
      if (!mediaPerm) {
        throw new Error("กรุณาเลือก Media Permission (Yes/No)");
      }
      if (!noPhotoPerm) {
        throw new Error("กรุณายืนยันข้อตกลงการไม่ถ่ายรูปนักเรียนคนอื่น");
      }

      await ParentService.submitNewChild(
        parentId,
        childName,
        childNickname,
        childDob,
        childPhotoFile,
        parentPhotoFile,
        allergy || '-',
        info || '',
        mediaPerm === 'Yes',
        noPhotoPerm
      );

      if (path === 'payment') {
        if (!paymentSlipFile || !packageType) {
          throw new Error("กรุณาอัปโหลดสลิปและเลือกแพ็กเกจ");
        }
        if (!nonRefundable) {
          throw new Error("กรุณายืนยันข้อตกลง Non-refundable");
        }
        await PackageService.submitTopUp(parentId, packageType, paymentSlipFile, nonRefundable);
      } else if (path === 'trial') {
        await PackageService.grantTrialPackage(parentId);
      }

      setShowSuccess(true);
    } catch (error: any) {
      setErrorMessage(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sarabun">
      <div className="max-w-[480px] mx-auto bg-white min-h-screen shadow-sm flex flex-col relative overflow-hidden pb-10">

        {/* Floating Toast Notification */}
        {fileToast && (
          <div className="fixed top-6 left-1/2 z-[200] max-w-[400px] w-[calc(100%-48px)]" style={{ transform: 'translateX(-50%)', animation: 'toastIn 0.25s ease-out' }}>
            <div className="bg-rose-600 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-start gap-3">
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
            <div className="flex items-center justify-center pb-6 mb-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-icsn-navy text-center">
                {path === 'trial' ? 'แบบฟอร์มลงทะเบียนทดลองเรียน (Trial)' : 'แบบฟอร์มซื้อแพ็กเกจ (Payment)'}
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
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-base font-medium flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{errorMessage}</p>
                </div>
              )}

              {/* Submit */}
              <div className="pt-2 pb-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-icsn-teal hover:bg-icsn-teal/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3.5 px-4 rounded-full font-bold shadow-md h-[52px] flex items-center justify-center gap-2 cursor-pointer text-lg"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSubmitting ? 'Submitting (กำลังดำเนินการ...)' : 'Submit Registration (ส่งข้อมูลลงทะเบียน)'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}


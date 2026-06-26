"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppDB } from '@/lib/supabase';
import { Ticket, Wallet, ChevronRight, Check, ArrowLeft, Loader2, UploadCloud, AlertCircle } from 'lucide-react';
import type { PackageOption } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApplyHeader } from '@/components/apply/ApplyHeader';
import { PathSelector } from '@/components/apply/PathSelector';
import { SuccessScreen } from '@/components/apply/SuccessScreen';

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
    const parentId = localStorage.getItem('icsn_parent_id');
    if (!parentId) {
      router.push('/login?tab=signup');
      return;
    }

    AppDB.getParentDetails(parentId).then(parent => {
      if (parent) {
        setParentEmail(parent.email || localStorage.getItem('icsn_parent_email') || '');
        setParentName(parent.name || localStorage.getItem('icsn_parent_name') || '');
        setParentPhone(parent.phone || localStorage.getItem('icsn_parent_phone') || '');

        // Check if parent name/phone already stored (returning user = disabled fields)
        if (localStorage.getItem('icsn_parent_name')) setIsReturningParent(true);

        if (parent.children && parent.children.length > 0) {
          const params = new URLSearchParams(window.location.search);
          if (params.get('addChild') !== 'true') {
            router.push('/book');
          }
        }
      }
    });

    AppDB.getPackageOptions().then(setPaymentPackages).catch(console.error);
  }, [router]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, setData: React.Dispatch<React.SetStateAction<string>>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => {
    setFileToast('');
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        setFileToast(`เนเธเธฅเนเธกเธตเธเธเธฒเธ” ${sizeMB}MB โ€” เธเธเธฒเธ”เนเธเธฅเนเธ•เนเธญเธเนเธกเนเน€เธเธดเธ 10MB`);
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
      const parentId = localStorage.getItem("icsn_parent_id");
      if (!parentId) throw new Error("เนเธกเนเธเธเธเนเธญเธกเธนเธฅเธเธนเนเธเธเธเธฃเธญเธ");

      // Validate media permission
      if (!mediaPerm) {
        throw new Error("เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธ Media Permission (Yes/No)");
      }
      if (!noPhotoPerm) {
        throw new Error("เธเธฃเธธเธ“เธฒเธขเธทเธเธขเธฑเธเธเนเธญเธ•เธเธฅเธเธเธฒเธฃเนเธกเนเธ–เนเธฒเธขเธฃเธนเธเธเธฑเธเน€เธฃเธตเธขเธเธเธเธญเธทเนเธ");
      }

      await AppDB.submitNewChild(
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
          throw new Error("เธเธฃเธธเธ“เธฒเธญเธฑเธเนเธซเธฅเธ”เธชเธฅเธดเธเนเธฅเธฐเน€เธฅเธทเธญเธเนเธเนเธเน€เธเธ");
        }
        if (!nonRefundable) {
          throw new Error("เธเธฃเธธเธ“เธฒเธขเธทเธเธขเธฑเธเธเนเธญเธ•เธเธฅเธ Non-refundable");
        }
        await AppDB.submitTopUp(parentId, packageType, paymentSlipFile, nonRefundable);
      } else if (path === 'trial') {
        await AppDB.grantTrialPackage(parentId);
      }

      setShowSuccess(true);
    } catch (error: any) {
      setErrorMessage(error.message || "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”");
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
              <h2 className="text-lg font-bold text-[#211551] text-center">
                {path === 'trial' ? 'เนเธเธเธเธญเธฃเนเธกเธฅเธเธ—เธฐเน€เธเธตเธขเธเธ—เธ”เธฅเธญเธเน€เธฃเธตเธขเธ (Trial)' : 'เนเธเธเธเธญเธฃเนเธกเธเธทเนเธญเนเธเนเธเน€เธเธ (Payment)'}
              </h2>
            </div>

            <form onSubmit={submitForm} className="space-y-6">
              {/* Hidden Email */}
              <input type="hidden" value={parentEmail} />

              {/* Section Header */}
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-lg font-bold text-[#211551]">
                  {path === 'trial' ? 'Further Information' : 'Personal Information'}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  {path === 'trial' ? 'เธเนเธญเธกเธนเธฅเน€เธเธดเนเธกเน€เธ•เธดเธก' : 'เธเนเธญเธกเธนเธฅเธชเนเธงเธเธเธธเธเธเธฅ'}
                </p>
              </div>

              {/* Parent Name */}
              <div>
                <label className="block mb-1.5">
                  <span className="text-base font-bold text-gray-800">Parent&apos;s full name <span className="text-red-500">*</span></span>
                  <span className="block text-sm text-gray-500 -mt-0.5">เธเธทเนเธญ-เธเธฒเธกเธชเธเธธเธฅเธเธนเนเธเธเธเธฃเธญเธ</span>
                </label>
                <Input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  required
                  disabled={isReturningParent}
                  className="w-full h-12 rounded-xl bg-gray-50/50 disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>

              {/* Parent Phone */}
              <div>
                <label className="block mb-1.5">
                  <span className="text-base font-bold text-gray-800">Parent&apos;s telephone number <span className="text-red-500">*</span></span>
                  <span className="block text-sm text-gray-500 -mt-0.5">เธซเธกเธฒเธขเน€เธฅเธเนเธ—เธฃเธจเธฑเธเธ—เนเธเธนเนเธเธเธเธฃเธญเธ</span>
                </label>
                <Input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  required
                  disabled={isReturningParent}
                  className="w-full h-12 rounded-xl bg-gray-50/50 disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>

              {/* Parent Photo (Trial Only) */}
              {path === 'trial' && (
                <div>
                  <label className="block mb-1.5">
                    <span className="text-base font-bold text-gray-800">Individual Parent&apos;s Photo <span className="text-red-500">*</span></span>
                    <span className="block text-sm text-gray-500 -mt-0.5">เธฃเธนเธเธ–เนเธฒเธขเธเธนเนเธเธเธเธฃเธญเธเน€เธ”เธตเนเธขเธงเธเธฑเธ”เน€เธเธ</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*,.heic,.heif"
                    onChange={(e) => handleFile(e, setParentPhotoData, setParentPhotoFile)}
                    required
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#00B0B9]/10 file:text-[#00B0B9] hover:file:bg-[#00B0B9]/20 border border-gray-200 rounded-xl bg-white mb-1.5 cursor-pointer outline-none"
                  />
                  <span className="block text-xs text-gray-400">เธญเธฑเธเนเธซเธฅเธ”เนเธเธฅเนเธ—เธตเนเธฃเธญเธเธฃเธฑเธ 1 เธฃเธฒเธขเธเธฒเธฃ เธเธเธฒเธ”เธชเธนเธเธชเธธเธ” 10 MB</span>
                  {parentPhotoData && (
                    <div className="mt-2 w-28 h-28 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                      <img src={parentPhotoData} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}

              {/* Child Name */}
              <div>
                <label className="block mb-1.5">
                  <span className="text-base font-bold text-gray-800">Child&apos;s full name <span className="text-red-500">*</span></span>
                  <span className="block text-sm text-gray-500 -mt-0.5">เธเธทเนเธญ-เธเธฒเธกเธชเธเธธเธฅเธเธธเธ•เธฃเธซเธฅเธฒเธ</span>
                </label>
                <Input type="text" value={childName} onChange={(e) => setChildName(e.target.value)} required className="w-full h-12 rounded-xl bg-gray-50/50" />
              </div>

              {/* Child Nickname */}
              <div>
                <label className="block mb-1.5">
                  <span className="text-base font-bold text-gray-800">Child nickname <span className="text-red-500">*</span></span>
                  <span className="block text-sm text-gray-500 -mt-0.5">เธเธทเนเธญเน€เธฅเนเธเธเธธเธ•เธฃเธซเธฅเธฒเธ</span>
                </label>
                <Input type="text" value={childNickname} onChange={(e) => setChildNickname(e.target.value)} required className="w-full h-12 rounded-xl bg-gray-50/50" />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block mb-1.5">
                  <span className="text-base font-bold text-gray-800">Date of birth <span className="text-red-500">*</span></span>
                  <span className="block text-sm text-gray-500 -mt-0.5">เธงเธฑเธเน€เธ”เธทเธญเธเธเธตเน€เธเธดเธ”</span>
                </label>
                <Input type="date" value={childDob} max={todayStr} onChange={(e) => setChildDob(e.target.value)} required className="w-full h-12 rounded-xl bg-gray-50/50" />
              </div>

              {/* ====== TRIAL ONLY FIELDS ====== */}
              {path === 'trial' && (
                <div className="space-y-6">
                  {/* Child Photo */}
                  <div>
                    <label className="block mb-1.5">
                      <span className="text-base font-bold text-gray-800">Individual Child&apos;s Photo <span className="text-red-500">*</span></span>
                      <span className="block text-sm text-gray-500 -mt-0.5">เธฃเธนเธเธ–เนเธฒเธขเธเธธเธ•เธฃเธซเธฅเธฒเธเน€เธ”เธตเนเธขเธงเธเธฑเธ”เน€เธเธ (เนเธกเนเนเธชเนเนเธงเนเธเธเธฑเธเนเธ”เธ”เธซเธฃเธทเธญเธซเธกเธงเธ)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*,.heic,.heif"
                      onChange={(e) => handleFile(e, setChildPhotoData, setChildPhotoFile)}
                      required
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#00B0B9]/10 file:text-[#00B0B9] hover:file:bg-[#00B0B9]/20 border border-gray-200 rounded-xl bg-white mb-1.5 cursor-pointer outline-none"
                    />
                    <span className="block text-xs text-gray-400">เธญเธฑเธเนเธซเธฅเธ”เนเธเธฅเนเธ—เธตเนเธฃเธญเธเธฃเธฑเธ 1 เธฃเธฒเธขเธเธฒเธฃ เธเธเธฒเธ”เธชเธนเธเธชเธธเธ” 10 MB</span>
                    {childPhotoData && (
                      <div className="mt-2 w-28 h-28 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                        <img src={childPhotoData} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Allergy */}
                  <div>
                    <label className="block mb-1.5">
                      <span className="text-base font-bold text-gray-800">Allergy (if any) <span className="text-red-500">*</span></span>
                      <span className="block text-sm text-gray-500 -mt-0.5">เธกเธตเธเนเธญเธกเธนเธฅเธเธฒเธฃเนเธเนเธญเธฒเธซเธฒเธฃเธซเธฃเธทเธญเธชเธดเนเธเธญเธทเนเธเธซเธฃเธทเธญเนเธกเน</span>
                    </label>
                    <Input
                      type="text"
                      value={allergy}
                      onChange={(e) => setAllergy(e.target.value)}
                      required
                      placeholder="เธฃเธฐเธเธธเธญเธฒเธเธฒเธฃเนเธเนเน€เธเธทเนเธญเธเธงเธฒเธกเธเธฅเธญเธ”เธ เธฑเธข (เธซเธฒเธเนเธกเนเธกเธตเธเธฃเธธเธ“เธฒเธฃเธฐเธเธธ เนเธกเนเธกเธต)"
                      className="w-full h-12 rounded-xl bg-gray-50/50"
                    />
                  </div>

                  {/* Special Info / Concerns */}
                  <div>
                    <label className="block mb-1.5">
                      <span className="text-base font-bold text-gray-800">Any information or concerns regarding your child that you would like to share with the school?</span>
                      <span className="block text-sm text-gray-500 -mt-0.5">เธกเธตเธเนเธญเธกเธนเธฅเธซเธฃเธทเธญเธเนเธญเธเธฑเธเธงเธฅเน€เธเธตเนเธขเธงเธเธฑเธเธเธธเธ•เธฃเธซเธฅเธฒเธเธเธญเธเธ—เนเธฒเธเธ—เธตเนเธ•เนเธญเธเธเธฒเธฃเนเธเนเธเนเธซเนเนเธฃเธเน€เธฃเธตเธขเธเธ—เธฃเธฒเธเธซเธฃเธทเธญเนเธกเน</span>
                    </label>
                    <textarea
                      value={info}
                      onChange={(e) => setInfo(e.target.value)}
                      rows={3}
                      placeholder="เธฃเธฐเธเธธเธเธคเธ•เธดเธเธฃเธฃเธกเธเธดเน€เธจเธฉ เธซเธฃเธทเธญ เธชเธธเธเธ เธฒเธเธ—เธตเนเธ—เธฒเธเธเธธเธ“เธเธฃเธนเธเธงเธฃเธ”เธนเนเธฅเธญเธขเนเธฒเธเนเธเธฅเนเธเธดเธ”"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50/50 outline-none resize-none focus:border-[#00B0B9] transition-all"
                    />
                  </div>

                  {/* Trial Agreements */}
                  <div className="space-y-5 pt-4 border-t border-gray-100">
                    {/* Media Permission */}
                    <div>
                      <span className="block text-[13.5px] font-bold text-gray-800 leading-relaxed mb-2">
                        I give permission for ICSN to use photos or videos (i.e. &quot;media&quot;) taken of my child in school-related academic and social activities. I understand and agree that this media may be used for promotional and marketing purposes without compensation. <span className="text-red-500">*</span><br/>
                        <span className="text-xs text-gray-600 font-normal mt-1 block leading-relaxed">
                          เธเนเธฒเธเน€เธเนเธฒเธญเธเธธเธเธฒเธ•เนเธซเน ICSN เนเธเนเธฃเธนเธเธ–เนเธฒเธขเธซเธฃเธทเธญเธงเธดเธ”เธตเนเธญ (เธซเธฃเธทเธญเธ—เธตเนเน€เธฃเธตเธขเธเธงเนเธฒ &quot;เธชเธทเนเธญ&quot;) เธ—เธตเนเธ–เนเธฒเธขเธเธฒเธเธเธดเธเธเธฃเธฃเธกเธ—เธฒเธเธเธฒเธฃเธจเธถเธเธฉเธฒเนเธฅเธฐเธชเธฑเธเธเธกเธเธญเธเธเธธเธ•เธฃเธซเธฅเธฒเธเธเนเธฒเธเน€เธเนเธฒเนเธเนเธฃเธเน€เธฃเธตเธขเธ เธเนเธฒเธเน€เธเนเธฒเธ—เธฃเธฒเธเนเธฅเธฐเธขเธญเธกเธฃเธฑเธเธงเนเธฒเธชเธทเนเธญเธ”เธฑเธเธเธฅเนเธฒเธงเธญเธฒเธเธ–เธนเธเธเธณเนเธเนเธเนเน€เธเธทเนเธญเธเธฒเธฃเธเธฃเธฐเธเธฒเธชเธฑเธกเธเธฑเธเธเนเนเธฅเธฐเธเธฒเธฃเธ•เธฅเธฒเธ”เนเธ”เธขเนเธกเนเธเธญเธเนเธฒเธ•เธญเธเนเธ—เธ
                        </span>
                      </span>
                      <div className="flex gap-6 mt-2 pb-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" value="Yes" checked={mediaPerm === 'Yes'} onChange={() => setMediaPerm('Yes')} className="w-[18px] h-[18px] accent-[#00B0B9]" />
                          <span className="text-[13.5px] font-medium text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" value="No" checked={mediaPerm === 'No'} onChange={() => setMediaPerm('No')} className="w-[18px] h-[18px] accent-[#00B0B9]" />
                          <span className="text-[13.5px] font-medium text-gray-700">No</span>
                        </label>
                      </div>
                    </div>

                    {/* No Photo Permission */}
                    <div>
                      <label className="flex items-start gap-3 cursor-pointer p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <input
                          type="checkbox"
                          checked={noPhotoPerm}
                          onChange={(e) => setNoPhotoPerm(e.target.checked)}
                          className="mt-1 w-[18px] h-[18px] accent-[#00B0B9] rounded border-gray-300"
                        />
                        <div>
                          <span className="block text-sm font-bold text-gray-800 leading-relaxed">
                            By checking the box, I agree not to take pictures of other students in the school for posting on social media. <span className="text-red-500">*</span>
                          </span>
                          <span className="block text-xs text-gray-600 mt-1 leading-relaxed">
                            เนเธ”เธขเธเธฒเธฃเน€เธฅเธทเธญเธเธเนเธญเธเธเธตเน เธเนเธฒเธเน€เธเนเธฒเธขเธดเธเธขเธญเธกเนเธกเนเธ–เนเธฒเธขเธฃเธนเธเธเธฑเธเน€เธฃเธตเธขเธเธเธเธญเธทเนเธเธ เธฒเธขเนเธเนเธฃเธเน€เธฃเธตเธขเธเน€เธเธทเนเธญเนเธเธชเธ•เนเนเธเธชเธทเนเธญเนเธเน€เธเธตเธขเธฅ
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ====== PAYMENT ONLY FIELDS ====== */}
              {path === 'payment' && (
                <div className="space-y-6">
                  {/* Section Header */}
                  <div className="pt-4 border-t border-gray-100 mb-2">
                    <h3 className="text-lg font-bold text-[#CC3366]">Payment Confirmation</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mt-0.5">เธเธฃเธธเธ“เธฒเนเธญเธเน€เธเธดเธเธเธณเธฃเธฐเนเธเธขเธฑเธเธเธฑเธเธเธตเนเธ”เธเธฑเธเธเธตเธซเธเธถเนเธเธเธญเธเนเธฃเธเน€เธฃเธตเธขเธเนเธฅเธฐเนเธเธเธซเธฅเธฑเธเธเธฒเธเธเธฒเธฃเนเธญเธเธ”เนเธฒเธเธฅเนเธฒเธเธเธตเน</p>
                  </div>

                  {/* Package Selection (Radio) */}
                  <div>
                    <label className="block mb-3">
                      <span className="text-base font-bold text-gray-800">Please choose a package of your payment <span className="text-red-500">*</span></span>
                      <span className="block text-sm text-gray-500 -mt-0.5">เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธเนเธเนเธเน€เธเธเธเธฒเธฃเธเธณเธฃเธฐเน€เธเธดเธเธเธญเธเธ—เนเธฒเธ</span>
                    </label>
                    <div className="space-y-2.5">
                      {paymentPackages.map(pkg => (
                        <label
                          key={pkg.id}
                          className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-colors ${packageType === pkg.name ? 'border-[#CC3366] bg-[#CC3366]/5' : 'border-gray-200 hover:bg-gray-50'}`}
                        >
                          <input
                            type="radio"
                            value={pkg.name}
                            checked={packageType === pkg.name}
                            onChange={() => setPackageType(pkg.name)}
                            className="w-[18px] h-[18px] accent-[#CC3366]"
                          />
                          <span className="text-sm font-semibold text-gray-800 leading-relaxed">{pkg.name} - {pkg.price} เธเธฒเธ—</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method Image */}
                  <div>
                    <label className="block mb-1.5">
                      <span className="text-base font-bold text-gray-800">Payment Method : Please upload your payment evident <span className="text-red-500">*</span></span>
                      <span className="block text-sm text-gray-500 -mt-0.5">เธเธฑเนเธเธ•เธญเธเธเธฒเธฃเธเธณเธฃเธฐเน€เธเธดเธ: เธเธฃเธธเธ“เธฒเนเธเธเธซเธฅเธฑเธเธเธฒเธเธเธฒเธฃเธเธณเธฃเธฐเน€เธเธดเธ</span>
                    </label>
                    <div className="mb-4 max-w-sm mx-auto">
                      <img src="/payment-method.jpg" alt="Payment Method Instruction" className="w-full h-auto rounded-xl border border-gray-200 shadow-sm" />
                    </div>
                    <input
                      type="file"
                      accept="image/*,.heic,.heif"
                      onChange={(e) => handleFile(e, setPaymentSlipData, setPaymentSlipFile)}
                      required
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#CC3366]/10 file:text-[#CC3366] hover:file:bg-[#CC3366]/20 border border-gray-200 rounded-xl bg-white mb-1.5 cursor-pointer outline-none"
                    />
                    <span className="block text-xs text-gray-400 mb-2">เธญเธฑเธเนเธซเธฅเธ”เนเธเธฅเนเธ—เธตเนเธฃเธญเธเธฃเธฑเธ 1 เธฃเธฒเธขเธเธฒเธฃ เธเธเธฒเธ”เธชเธนเธเธชเธธเธ” 10 MB</span>
                    {paymentSlipData && (
                      <div className="mt-2 w-32 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                        <img src={paymentSlipData} alt="Preview" className="w-full h-auto object-contain" />
                      </div>
                    )}
                  </div>

                  {/* Payment Agreements */}
                  <div className="space-y-5 pt-4 border-t border-gray-100">
                    {/* Media Permission */}
                    <div>
                      <span className="block text-[13.5px] font-bold text-gray-800 leading-relaxed mb-2">
                        I give permission for ICSN to use photos or videos (i.e. &quot;media&quot;) taken of my child in school-related academic and social activities. I understand and agree that this media may be used for promotional and marketing purposes without compensation. <span className="text-red-500">*</span><br/>
                        <span className="text-xs text-gray-600 font-normal mt-1 block leading-relaxed">
                          เธเนเธฒเธเน€เธเนเธฒเธญเธเธธเธเธฒเธ•เนเธซเน ICSN เนเธเนเธฃเธนเธเธ–เนเธฒเธขเธซเธฃเธทเธญเธงเธดเธ”เธตเนเธญ (เธซเธฃเธทเธญเธ—เธตเนเน€เธฃเธตเธขเธเธงเนเธฒ &quot;เธชเธทเนเธญ&quot;) เธ—เธตเนเธ–เนเธฒเธขเธเธฒเธเธเธดเธเธเธฃเธฃเธกเธ—เธฒเธเธเธฒเธฃเธจเธถเธเธฉเธฒเนเธฅเธฐเธชเธฑเธเธเธกเธเธญเธเธเธธเธ•เธฃเธซเธฅเธฒเธเธเนเธฒเธเน€เธเนเธฒเนเธเนเธฃเธเน€เธฃเธตเธขเธ เธเนเธฒเธเน€เธเนเธฒเธ—เธฃเธฒเธเนเธฅเธฐเธขเธญเธกเธฃเธฑเธเธงเนเธฒเธชเธทเนเธญเธ”เธฑเธเธเธฅเนเธฒเธงเธญเธฒเธเธ–เธนเธเธเธณเนเธเนเธเนเน€เธเธทเนเธญเธเธฒเธฃเธเธฃเธฐเธเธฒเธชเธฑเธกเธเธฑเธเธเนเนเธฅเธฐเธเธฒเธฃเธ•เธฅเธฒเธ”เนเธ”เธขเนเธกเนเธเธญเธเนเธฒเธ•เธญเธเนเธ—เธ
                        </span>
                      </span>
                      <div className="flex gap-6 mt-2 pb-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" value="Yes" checked={mediaPerm === 'Yes'} onChange={() => setMediaPerm('Yes')} className="w-[18px] h-[18px] accent-[#CC3366]" />
                          <span className="text-[13.5px] font-medium text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" value="No" checked={mediaPerm === 'No'} onChange={() => setMediaPerm('No')} className="w-[18px] h-[18px] accent-[#CC3366]" />
                          <span className="text-[13.5px] font-medium text-gray-700">No</span>
                        </label>
                      </div>
                    </div>

                    {/* Non-refundable */}
                    <div>
                      <label className="flex items-start gap-3 cursor-pointer p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <input
                          type="checkbox"
                          checked={nonRefundable}
                          onChange={(e) => setNonRefundable(e.target.checked)}
                          className="mt-1 w-[18px] h-[18px] accent-[#CC3366] rounded border-gray-300"
                        />
                        <div>
                          <span className="block text-sm font-bold text-gray-800 leading-relaxed">
                            By checking this box, you agree that this payment is non-refundable. <span className="text-red-500">*</span>
                          </span>
                          <span className="block text-xs text-gray-600 mt-1 leading-relaxed">
                            เนเธ”เธขเธเธฒเธฃเธ—เธณเน€เธเธฃเธทเนเธญเธเธซเธกเธฒเธขเนเธเธเนเธญเธเธเธตเน เธ–เธทเธญเธงเนเธฒเธ—เนเธฒเธเธขเธญเธกเธฃเธฑเธเธงเนเธฒเธเธฒเธฃเธเธณเธฃเธฐเน€เธเธดเธเธเธตเนเนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธเธญเธเธทเธเนเธ”เน
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* No Photo Permission */}
                    <div>
                      <label className="flex items-start gap-3 cursor-pointer p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <input
                          type="checkbox"
                          checked={noPhotoPerm}
                          onChange={(e) => setNoPhotoPerm(e.target.checked)}
                          className="mt-1 w-[18px] h-[18px] accent-[#CC3366] rounded border-gray-300"
                        />
                        <div>
                          <span className="block text-sm font-bold text-gray-800 leading-relaxed">
                            By checking the box, I agree not to take pictures of other students in the school for posting on social media. <span className="text-red-500">*</span>
                          </span>
                          <span className="block text-xs text-gray-600 mt-1 leading-relaxed">
                            เนเธ”เธขเธเธฒเธฃเน€เธฅเธทเธญเธเธเนเธญเธเธเธตเน เธเนเธฒเธเน€เธเนเธฒเธขเธดเธเธขเธญเธกเนเธกเนเธ–เนเธฒเธขเธฃเธนเธเธเธฑเธเน€เธฃเธตเธขเธเธเธเธญเธทเนเธเธ เธฒเธขเนเธเนเธฃเธเน€เธฃเธตเธขเธเน€เธเธทเนเธญเนเธเธชเธ•เนเนเธเธชเธทเนเธญเนเธเน€เธเธตเธขเธฅ
                          </span>
                          <span className="block text-[12.5px] font-bold text-gray-700 mt-1">Yes</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

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
                  className="w-full bg-[#00B0B9] hover:bg-[#00969e] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3.5 px-4 rounded-full font-bold shadow-md h-[52px] flex items-center justify-center gap-2 cursor-pointer text-lg"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSubmitting ? 'Submitting (เธเธณเธฅเธฑเธเธ”เธณเน€เธเธดเธเธเธฒเธฃ...)' : 'Submit Registration (เธชเนเธเธเนเธญเธกเธนเธฅเธฅเธเธ—เธฐเน€เธเธตเธขเธ)'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}


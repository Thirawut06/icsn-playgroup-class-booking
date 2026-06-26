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
      const parentId = localStorage.getItem("icsn_parent_id");
      if (!parentId) throw new Error("ไม่พบข้อมูลผู้ปกครอง");

      // Validate media permission
      if (!mediaPerm) {
        throw new Error("กรุณาเลือก Media Permission (Yes/No)");
      }
      if (!noPhotoPerm) {
        throw new Error("กรุณายืนยันข้อตกลงการไม่ถ่ายรูปนักเรียนคนอื่น");
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
          throw new Error("กรุณาอัปโหลดสลิปและเลือกแพ็กเกจ");
        }
        if (!nonRefundable) {
          throw new Error("กรุณายืนยันข้อตกลง Non-refundable");
        }
        await AppDB.submitTopUp(parentId, packageType, paymentSlipFile, nonRefundable);
      } else if (path === 'trial') {
        await AppDB.grantTrialPackage(parentId);
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
              <p className="font-bold text-[13px] leading-snug flex-1">{fileToast}</p>
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
                {path === 'trial' ? 'แบบฟอร์มลงทะเบียนทดลองเรียน (Trial)' : 'แบบฟอร์มซื้อแพ็กเกจ (Payment)'}
              </h2>
            </div>

            <form onSubmit={submitForm} className="space-y-6">
              {/* Hidden Email */}
              <input type="hidden" value={parentEmail} />

              {/* Section Header */}
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-[17px] font-bold text-[#211551]">
                  {path === 'trial' ? 'Further Information' : 'Personal Information'}
                </h3>
                <p className="text-[12px] text-gray-500 font-medium">
                  {path === 'trial' ? 'ข้อมูลเพิ่มเติม' : 'ข้อมูลส่วนบุคคล'}
                </p>
              </div>

              {/* Parent Name */}
              <div>
                <label className="block mb-1.5">
                  <span className="text-[14px] font-bold text-gray-800">Parent&apos;s full name <span className="text-red-500">*</span></span>
                  <span className="block text-[12px] text-gray-500 -mt-0.5">ชื่อ-นามสกุลผู้ปกครอง</span>
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
                  <span className="text-[14px] font-bold text-gray-800">Parent&apos;s telephone number <span className="text-red-500">*</span></span>
                  <span className="block text-[12px] text-gray-500 -mt-0.5">หมายเลขโทรศัพท์ผู้ปกครอง</span>
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
                    <span className="text-[14px] font-bold text-gray-800">Individual Parent&apos;s Photo <span className="text-red-500">*</span></span>
                    <span className="block text-[12px] text-gray-500 -mt-0.5">รูปถ่ายผู้ปกครองเดี่ยวชัดเจน</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFile(e, setParentPhotoData, setParentPhotoFile)}
                    required
                    className="block w-full text-[13px] text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[13px] file:font-semibold file:bg-[#00B0B9]/10 file:text-[#00B0B9] hover:file:bg-[#00B0B9]/20 border border-gray-200 rounded-xl bg-white mb-1.5 cursor-pointer outline-none"
                  />
                  <span className="block text-[11px] text-gray-400">อัปโหลดไฟล์ที่รองรับ 1 รายการ ขนาดสูงสุด 10 MB</span>
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
                  <span className="text-[14px] font-bold text-gray-800">Child&apos;s full name <span className="text-red-500">*</span></span>
                  <span className="block text-[12px] text-gray-500 -mt-0.5">ชื่อ-นามสกุลบุตรหลาน</span>
                </label>
                <Input type="text" value={childName} onChange={(e) => setChildName(e.target.value)} required className="w-full h-12 rounded-xl bg-gray-50/50" />
              </div>

              {/* Child Nickname */}
              <div>
                <label className="block mb-1.5">
                  <span className="text-[14px] font-bold text-gray-800">Child nickname <span className="text-red-500">*</span></span>
                  <span className="block text-[12px] text-gray-500 -mt-0.5">ชื่อเล่นบุตรหลาน</span>
                </label>
                <Input type="text" value={childNickname} onChange={(e) => setChildNickname(e.target.value)} required className="w-full h-12 rounded-xl bg-gray-50/50" />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block mb-1.5">
                  <span className="text-[14px] font-bold text-gray-800">Date of birth <span className="text-red-500">*</span></span>
                  <span className="block text-[12px] text-gray-500 -mt-0.5">วันเดือนปีเกิด</span>
                </label>
                <Input type="date" value={childDob} onChange={(e) => setChildDob(e.target.value)} required className="w-full h-12 rounded-xl bg-gray-50/50" />
              </div>

              {/* ====== TRIAL ONLY FIELDS ====== */}
              {path === 'trial' && (
                <div className="space-y-6">
                  {/* Child Photo */}
                  <div>
                    <label className="block mb-1.5">
                      <span className="text-[14px] font-bold text-gray-800">Individual Child&apos;s Photo <span className="text-red-500">*</span></span>
                      <span className="block text-[12px] text-gray-500 -mt-0.5">รูปถ่ายบุตรหลานเดี่ยวชัดเจน (ไม่ใส่แว่นกันแดดหรือหมวก)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFile(e, setChildPhotoData, setChildPhotoFile)}
                      required
                      className="block w-full text-[13px] text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[13px] file:font-semibold file:bg-[#00B0B9]/10 file:text-[#00B0B9] hover:file:bg-[#00B0B9]/20 border border-gray-200 rounded-xl bg-white mb-1.5 cursor-pointer outline-none"
                    />
                    <span className="block text-[11px] text-gray-400">อัปโหลดไฟล์ที่รองรับ 1 รายการ ขนาดสูงสุด 10 MB</span>
                    {childPhotoData && (
                      <div className="mt-2 w-28 h-28 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                        <img src={childPhotoData} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Allergy */}
                  <div>
                    <label className="block mb-1.5">
                      <span className="text-[14px] font-bold text-gray-800">Allergy (if any) <span className="text-red-500">*</span></span>
                      <span className="block text-[12px] text-gray-500 -mt-0.5">มีข้อมูลการแพ้อาหารหรือสิ่งอื่นหรือไม่</span>
                    </label>
                    <Input
                      type="text"
                      value={allergy}
                      onChange={(e) => setAllergy(e.target.value)}
                      required
                      placeholder="ระบุอาการแพ้เพื่อความปลอดภัย (หากไม่มีกรุณาระบุ ไม่มี)"
                      className="w-full h-12 rounded-xl bg-gray-50/50"
                    />
                  </div>

                  {/* Special Info / Concerns */}
                  <div>
                    <label className="block mb-1.5">
                      <span className="text-[14px] font-bold text-gray-800">Any information or concerns regarding your child that you would like to share with the school?</span>
                      <span className="block text-[12px] text-gray-500 -mt-0.5">มีข้อมูลหรือข้อกังวลเกี่ยวกับบุตรหลานของท่านที่ต้องการแจ้งให้โรงเรียนทราบหรือไม่</span>
                    </label>
                    <textarea
                      value={info}
                      onChange={(e) => setInfo(e.target.value)}
                      rows={3}
                      placeholder="ระบุพฤติกรรมพิเศษ หรือ สุขภาพที่ทางคุณครูควรดูแลอย่างใกล้ชิด"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] bg-gray-50/50 outline-none resize-none focus:border-[#00B0B9] transition-all"
                    />
                  </div>

                  {/* Trial Agreements */}
                  <div className="space-y-5 pt-4 border-t border-gray-100">
                    {/* Media Permission */}
                    <div>
                      <span className="block text-[13.5px] font-bold text-gray-800 leading-relaxed mb-2">
                        I give permission for ICSN to use photos or videos (i.e. &quot;media&quot;) taken of my child in school-related academic and social activities. I understand and agree that this media may be used for promotional and marketing purposes without compensation. <span className="text-red-500">*</span><br/>
                        <span className="text-[11px] text-gray-600 font-normal mt-1 block leading-relaxed">
                          ข้าพเจ้าอนุญาตให้ ICSN ใช้รูปถ่ายหรือวิดีโอ (หรือที่เรียกว่า &quot;สื่อ&quot;) ที่ถ่ายจากกิจกรรมทางการศึกษาและสังคมของบุตรหลานข้าพเจ้าในโรงเรียน ข้าพเจ้าทราบและยอมรับว่าสื่อดังกล่าวอาจถูกนำไปใช้เพื่อการประชาสัมพันธ์และการตลาดโดยไม่ขอค่าตอบแทน
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
                          <span className="block text-[13px] font-bold text-gray-800 leading-relaxed">
                            By checking the box, I agree not to take pictures of other students in the school for posting on social media. <span className="text-red-500">*</span>
                          </span>
                          <span className="block text-[11px] text-gray-600 mt-1 leading-relaxed">
                            โดยการเลือกช่องนี้ ข้าพเจ้ายินยอมไม่ถ่ายรูปนักเรียนคนอื่นภายในโรงเรียนเพื่อโพสต์ในสื่อโซเชียล
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
                    <h3 className="text-[16px] font-bold text-[#CC3366]">Payment Confirmation</h3>
                    <p className="text-[12px] text-gray-500 leading-relaxed mt-0.5">กรุณาโอนเงินชำระไปยังบัญชีใดบัญชีหนึ่งของโรงเรียนและแนบหลักฐานการโอนด้านล่างนี้</p>
                  </div>

                  {/* Package Selection (Radio) */}
                  <div>
                    <label className="block mb-3">
                      <span className="text-[14px] font-bold text-gray-800">Please choose a package of your payment <span className="text-red-500">*</span></span>
                      <span className="block text-[12px] text-gray-500 -mt-0.5">กรุณาเลือกแพ็กเกจการชำระเงินของท่าน</span>
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
                          <span className="text-[13px] font-semibold text-gray-800 leading-relaxed">{pkg.name} - {pkg.price} บาท</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method Image */}
                  <div>
                    <label className="block mb-1.5">
                      <span className="text-[14px] font-bold text-gray-800">Payment Method : Please upload your payment evident <span className="text-red-500">*</span></span>
                      <span className="block text-[12px] text-gray-500 -mt-0.5">ขั้นตอนการชำระเงิน: กรุณาแนบหลักฐานการชำระเงิน</span>
                    </label>
                    <div className="mb-4 max-w-sm mx-auto">
                      <img src="/payment-method.jpg" alt="Payment Method Instruction" className="w-full h-auto rounded-xl border border-gray-200 shadow-sm" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFile(e, setPaymentSlipData, setPaymentSlipFile)}
                      required
                      className="block w-full text-[13px] text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[13px] file:font-semibold file:bg-[#CC3366]/10 file:text-[#CC3366] hover:file:bg-[#CC3366]/20 border border-gray-200 rounded-xl bg-white mb-1.5 cursor-pointer outline-none"
                    />
                    <span className="block text-[11px] text-gray-400 mb-2">อัปโหลดไฟล์ที่รองรับ 1 รายการ ขนาดสูงสุด 10 MB</span>
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
                        <span className="text-[11px] text-gray-600 font-normal mt-1 block leading-relaxed">
                          ข้าพเจ้าอนุญาตให้ ICSN ใช้รูปถ่ายหรือวิดีโอ (หรือที่เรียกว่า &quot;สื่อ&quot;) ที่ถ่ายจากกิจกรรมทางการศึกษาและสังคมของบุตรหลานข้าพเจ้าในโรงเรียน ข้าพเจ้าทราบและยอมรับว่าสื่อดังกล่าวอาจถูกนำไปใช้เพื่อการประชาสัมพันธ์และการตลาดโดยไม่ขอค่าตอบแทน
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
                          <span className="block text-[13px] font-bold text-gray-800 leading-relaxed">
                            By checking this box, you agree that this payment is non-refundable. <span className="text-red-500">*</span>
                          </span>
                          <span className="block text-[11px] text-gray-600 mt-1 leading-relaxed">
                            โดยการทำเครื่องหมายในช่องนี้ ถือว่าท่านยอมรับว่าการชำระเงินนี้ไม่สามารถขอคืนได้
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
                          <span className="block text-[13px] font-bold text-gray-800 leading-relaxed">
                            By checking the box, I agree not to take pictures of other students in the school for posting on social media. <span className="text-red-500">*</span>
                          </span>
                          <span className="block text-[11px] text-gray-600 mt-1 leading-relaxed">
                            โดยการเลือกช่องนี้ ข้าพเจ้ายินยอมไม่ถ่ายรูปนักเรียนคนอื่นภายในโรงเรียนเพื่อโพสต์ในสื่อโซเชียล
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
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-[14px] font-medium flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{errorMessage}</p>
                </div>
              )}

              {/* Submit */}
              <div className="pt-2 pb-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#00B0B9] hover:bg-[#00969e] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3.5 px-4 rounded-full font-bold shadow-md h-[52px] flex items-center justify-center gap-2 cursor-pointer text-[16px]"
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

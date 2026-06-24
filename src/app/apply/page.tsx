"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppDB } from '@/lib/supabase';
import { Ticket, Wallet, ChevronRight, Check, ArrowLeft, Loader2, UploadCloud } from 'lucide-react';
import type { PackageOption } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Apply() {
  const router = useRouter();
  const [path, setPath] = useState<'trial' | 'payment' | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [parentEmail, setParentEmail] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [childName, setChildName] = useState('');
  const [childNickname, setChildNickname] = useState('');
  const [childDob, setChildDob] = useState('');
  const [mediaPerm, setMediaPerm] = useState(false);
  const [noPhotoPerm, setNoPhotoPerm] = useState(false);

  const [childPhotoData, setChildPhotoData] = useState('');
  const [allergy, setAllergy] = useState('');

  const [paymentPackages, setPaymentPackages] = useState<PackageOption[]>([]);
  const [packageType, setPackageType] = useState('');
  const [paymentSlipData, setPaymentSlipData] = useState('');

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

        if (parent.children && parent.children.length > 0) {
          router.push('/book');
        }
      }
    });

    AppDB.getPackageOptions().then(setPaymentPackages).catch(console.error);
  }, [router]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("ขนาดไฟล์ต้องไม่เกิน 5MB ค่ะ");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => setter(evt.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const parentId = localStorage.getItem("icsn_parent_id");
      if (!parentId) throw new Error("ไม่พบข้อมูลผู้ปกครอง");

      await AppDB.submitNewChild(
        parentId,
        childName,
        childNickname,
        childDob,
        childPhotoData,
        allergy,
        mediaPerm,
        noPhotoPerm
      );

      if (path === 'payment') {
        if (!paymentSlipData || !packageType) {
          throw new Error("กรุณาอัปโหลดสลิปและเลือกแพ็กเกจ");
        }
        await AppDB.submitTopUp(parentId, packageType, paymentSlipData);
      }

      setShowSuccess(true);
    } catch (error: any) {
      alert(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sarabun">
      <div className="max-w-[480px] mx-auto bg-white min-h-screen shadow-sm flex flex-col relative overflow-hidden pb-10">
        
        {/* Header */}
        <div 
          className="bg-[#211551] px-6 py-8 text-white text-center relative overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: 'url("/playgroup-banner-icsn.png")' }}
        >
          <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
          {(!showSuccess && path) ? (
            <button onClick={() => setPath(null)} className="absolute top-4 left-4 z-20 text-white hover:text-gray-200 cursor-pointer">
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <button onClick={() => router.push('/')} className="absolute top-4 left-4 z-20 text-white hover:text-gray-200 cursor-pointer">
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}

          <div className="inline-flex items-center justify-center w-20 h-auto mb-3 relative z-10">
            <img src="/white-main-logo-icsn.png" alt="ICSN Logo" className="w-full h-auto object-contain drop-shadow-sm" />
          </div>
          <h1 className="text-[22px] font-bold text-white relative z-10 drop-shadow-md">
            ICSN Panda Playgroup
          </h1>
          <p className="text-[13px] font-medium text-white/90 mt-0.5 relative z-10 drop-shadow-md">
            Registration Form (แบบฟอร์มลงทะเบียนเรียน)
          </p>
        </div>

        {/* Step Selector */}
        {!path && !showSuccess && (
          <div className="px-6 py-6 relative z-10">
            <h2 className="text-[17px] font-bold text-center text-[#211551] mb-6">
              Please select your registration path<br/>
              <span className="text-xs text-gray-500 font-normal block mt-1">เลือกทางเลือกเพื่อสั่งซื้อสิทธิ์หรือลงทะเบียนเรียน</span>
            </h2>

            <div className="space-y-4">
              <button
                onClick={() => setPath('trial')}
                className="w-full bg-white border-2 border-gray-100 hover:border-[#00B0B9] rounded-2xl p-5 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#00B0B9]/10 text-[#00B0B9] rounded-full flex items-center justify-center group-hover:bg-[#00B0B9] group-hover:text-white transition-colors">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-[#211551] text-[16px]">Free Trial Class</div>
                    <div className="text-[12px] text-gray-500 mt-0.5">ทดลองเรียนฟรี 1 ครั้ง</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#00B0B9]" />
              </button>

              <button
                onClick={() => setPath('payment')}
                className="w-full bg-white border-2 border-gray-100 hover:border-[#CC3366] rounded-2xl p-5 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#CC3366]/10 text-[#CC3366] rounded-full flex items-center justify-center group-hover:bg-[#CC3366] group-hover:text-white transition-colors">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-[#211551] text-[16px]">Purchase Package</div>
                    <div className="text-[12px] text-gray-500 mt-0.5">ซื้อแพ็กเกจเรียน</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#CC3366]" />
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {showSuccess && (
          <div className="px-5 py-10 relative z-10 flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-20 h-20 bg-[#00B0B9]/10 text-[#00B0B9] rounded-full flex items-center justify-center mb-6">
              <Check className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-[#211551] mb-1">Registration Successful</h2>
            <h3 className="text-md font-medium text-gray-500 mb-6">ลงทะเบียนสำเร็จ</h3>
            <Button
              onClick={() => router.push('/book')}
              className="w-full bg-[#00B0B9] text-white font-bold py-3.5 px-6 rounded-xl flex flex-col items-center justify-center hover:bg-[#00969e] h-auto"
            >
              <span className="text-[16px]">Go to Booking Calendar</span>
              <span className="text-[13px] font-normal opacity-90 mt-0.5">ไปที่ปฏิทินการจอง</span>
            </Button>
          </div>
        )}

        {/* Form */}
        {path && !showSuccess && (
          <div className="px-6 pb-10 mt-6 relative z-10">
            <h2 className="text-lg font-bold text-[#211551] text-center mb-6 border-b pb-6">
              {path === 'trial' ? 'แบบฟอร์มลงทะเบียนทดลองเรียน' : 'แบบฟอร์มซื้อแพ็กเกจ'}
            </h2>

            <form onSubmit={submitForm} className="space-y-6">
              
              <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <h3 className="font-bold text-[#211551] flex items-center gap-2">
                  <span className="bg-[#211551] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                  Parent's Info
                </h3>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Parent's Name <span className="text-xs text-gray-500 font-normal">ชื่อผู้ปกครอง</span></label>
                  <Input type="text" value={parentName} onChange={(e) => setParentName(e.target.value)} required className="w-full h-12 rounded-xl bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Phone <span className="text-xs text-gray-500 font-normal">เบอร์โทร</span></label>
                  <Input type="tel" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} required className="w-full h-12 rounded-xl bg-white" />
                </div>
              </div>

              <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <h3 className="font-bold text-[#211551] flex items-center gap-2">
                  <span className="bg-[#211551] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
                  Child's Info
                </h3>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Child's Name <span className="text-xs text-gray-500 font-normal">ชื่อจริงน้อง</span></label>
                  <Input type="text" value={childName} onChange={(e) => setChildName(e.target.value)} required className="w-full h-12 rounded-xl bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nickname <span className="text-xs text-gray-500 font-normal">ชื่อเล่น</span></label>
                  <Input type="text" value={childNickname} onChange={(e) => setChildNickname(e.target.value)} required className="w-full h-12 rounded-xl bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Date of Birth <span className="text-xs text-gray-500 font-normal">วันเกิด</span></label>
                  <Input type="date" value={childDob} onChange={(e) => setChildDob(e.target.value)} required className="w-full h-12 rounded-xl bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Allergies <span className="text-xs text-gray-500 font-normal">อาหารที่แพ้ (ถ้ามี)</span></label>
                  <Input type="text" value={allergy} onChange={(e) => setAllergy(e.target.value)} placeholder="ไม่มี / None" className="w-full h-12 rounded-xl bg-white" />
                </div>
              </div>

              {path === 'trial' && (
                <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-[#211551] flex items-center gap-2">
                    <span className="bg-[#211551] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">3</span>
                    Child's Photo
                  </h3>
                  <label className="block text-center p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 bg-white">
                    <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm font-bold text-gray-700">อัปโหลดรูปน้อง</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, setChildPhotoData)} />
                  </label>
                  {childPhotoData && <img src={childPhotoData} alt="Preview" className="h-32 rounded-lg mx-auto object-cover" />}
                </div>
              )}

              {path === 'payment' && (
                <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-[#211551] flex items-center gap-2">
                    <span className="bg-[#211551] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">3</span>
                    Package & Payment
                  </h3>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Select Package <span className="text-xs text-gray-500 font-normal">เลือกแพ็กเกจ</span></label>
                    <select value={packageType} onChange={(e) => setPackageType(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl h-12 bg-white">
                      <option value="">-- กรุณาเลือก --</option>
                      {paymentPackages.map(pkg => (
                        <option key={pkg.id} value={pkg.name}>{pkg.name} - {pkg.price} บาท</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-center p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 bg-white">
                      <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm font-bold text-gray-700">อัปโหลดสลิปโอนเงิน</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, setPaymentSlipData)} />
                    </label>
                    {paymentSlipData && <img src={paymentSlipData} alt="Preview" className="h-32 rounded-lg mx-auto object-cover" />}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#00B0B9] text-white py-3 px-4 rounded-full font-bold h-[52px] flex items-center justify-center hover:bg-[#00969e]"
              >
                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
                {isSubmitting ? 'กำลังส่งข้อมูล...' : 'Submit (ยืนยันข้อมูล)'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

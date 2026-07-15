"use client";

import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApplyHeader } from '@/components/apply/ApplyHeader';
import { PathSelector } from '@/components/apply/PathSelector';
import { SuccessScreen } from '@/components/apply/SuccessScreen';
import { ParentInfoSection } from '@/components/apply/ParentInfoSection';
import { ChildInfoSection } from '@/components/apply/ChildInfoSection';
import { PhotoUploadSection } from '@/components/apply/PhotoUploadSection';
import { PaymentSection } from '@/components/apply/PaymentSection';
import { AgreementsSection } from '@/components/apply/AgreementsSection';
import { useApplyForm } from './useApplyForm';

export default function Apply() {
  const form = useApplyForm();
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-icsn-bg min-h-[100dvh] font-sarabun">
      <div className="max-w-[480px] mx-auto bg-white min-h-[100dvh] shadow-sm flex flex-col relative overflow-x-hidden pb-10">

        {/* Floating Toast Notification */}
        {form.fileToast && (
          <div className="fixed top-6 left-1/2 z-[200] max-w-[400px] w-[calc(100%-48px)]" style={{ transform: 'translateX(-50%)', animation: 'toastIn 0.25s ease-out' }}>
            <div className="bg-error text-white px-5 py-4 rounded-2xl shadow-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="font-bold text-sm leading-snug flex-1">{form.fileToast}</p>
              <button onClick={() => form.setFileToast('')} className="text-white/70 hover:text-white shrink-0">
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <ApplyHeader showSuccess={form.showSuccess} path={form.path} setPath={form.setPath} />

        {/* Step Selector */}
        {!form.path && !form.showSuccess && (
          <PathSelector setPath={form.setPath} />
        )}

        {/* Success */}
        {form.showSuccess && (
          <SuccessScreen path={form.path} />
        )}

        {/* Form */}
        {form.path && !form.showSuccess && (
          <div className="px-6 pb-10 mt-6 relative z-10">
            <div className="flex items-center justify-center pb-6 mb-6 border-b border-border">
              <h2 className="text-lg font-bold text-icsn-navy text-center">
                {form.path === 'trial' ? form.dict.apply.trialFormTitle : form.dict.apply.paymentFormTitle}
              </h2>
            </div>

            <form onSubmit={form.submitForm} className="space-y-6">
              <input type="hidden" value={form.parentEmail} />

              <ParentInfoSection
                path={form.path}
                parentName={form.parentName}
                setParentName={form.setParentName}
                parentPhone={form.parentPhone}
                setParentPhone={form.setParentPhone}
                isReturningParent={form.isReturningParent}
              />

              <ChildInfoSection
                path={form.path}
                childName={form.childName}
                setChildName={form.setChildName}
                childNickname={form.childNickname}
                setChildNickname={form.setChildNickname}
                childDob={form.childDob}
                setChildDob={form.setChildDob}
                allergy={form.allergy}
                setAllergy={form.setAllergy}
                info={form.info}
                setInfo={form.setInfo}
                todayStr={todayStr}
              />

              <PhotoUploadSection
                path={form.path}
                parentPhotoData={form.parentPhotoData}
                setParentPhotoData={form.setParentPhotoData}
                setParentPhotoFile={form.setParentPhotoFile}
                childPhotoData={form.childPhotoData}
                setChildPhotoData={form.setChildPhotoData}
                setChildPhotoFile={form.setChildPhotoFile}
                handleFile={form.handleFile}
              />

              <PaymentSection
                path={form.path}
                paymentPackages={form.paymentPackages}
                packageType={form.packageType}
                setPackageType={form.setPackageType}
                paymentSlipData={form.paymentSlipData}
                setPaymentSlipData={form.setPaymentSlipData}
                setPaymentSlipFile={form.setPaymentSlipFile}
                handleFile={form.handleFile}
              />

              <AgreementsSection
                path={form.path}
                mediaPerm={form.mediaPerm}
                setMediaPerm={form.setMediaPerm}
                noPhotoPerm={form.noPhotoPerm}
                setNoPhotoPerm={form.setNoPhotoPerm}
                nonRefundable={form.nonRefundable}
                setNonRefundable={form.setNonRefundable}
              />

              {/* Error Message */}
              {form.errorMessage && (
                <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-base font-medium flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{form.errorMessage}</p>
                </div>
              )}

              {/* Submit */}
              <div className="pt-2 pb-4">
                <Button
                  type="submit"
                  disabled={form.isSubmitting}
                  className="w-full bg-icsn-teal hover:bg-icsn-teal/90 disabled:bg-foreground/10 disabled:cursor-not-allowed text-white py-3.5 px-4 rounded-full font-bold shadow-md h-[52px] flex items-center justify-center gap-2 cursor-pointer text-lg"
                >
                  {form.isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {form.isSubmitting ? form.dict.apply.submitting : form.dict.apply.submitRegistration}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

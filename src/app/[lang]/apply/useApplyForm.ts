import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ParentService, PackageService, supabase } from '@/lib/supabase';
import { FILE_UPLOAD } from '@/config/constants';
import type { PackageOption } from '@/types';
import { ROUTES } from '@/config/routes';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import { useCachedState } from '@/hooks/useCachedState';

export function useApplyForm() {
  const router = useRouter();
  const { dict, lang } = useDictionary();
  const [path, setPath] = useCachedState<'trial' | 'payment' | null>('apply', 'path', null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fileToast, setFileToast] = useState('');

  // Auto-dismiss toast
  useEffect(() => {
    if (fileToast) {
      const timer = setTimeout(() => setFileToast(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [fileToast]);

  // Parent fields
  const [parentEmail, setParentEmail] = useCachedState('apply', 'parentEmail', '');
  const [parentName, setParentName] = useCachedState('apply', 'parentName', '');
  const [parentPhone, setParentPhone] = useCachedState('apply', 'parentPhone', '');
  const [isReturningParent, setIsReturningParent] = useCachedState('apply', 'isReturningParent', false);

  // Child fields
  const [childName, setChildName] = useCachedState('apply', 'childName', '');
  const [childNickname, setChildNickname] = useCachedState('apply', 'childNickname', '');
  const [childDob, setChildDob] = useCachedState('apply', 'childDob', '');
  const [allergy, setAllergy] = useCachedState('apply', 'allergy', '');
  const [info, setInfo] = useCachedState('apply', 'info', '');

  // File uploads
  const [parentPhotoData, setParentPhotoData] = useCachedState('apply', 'parentPhotoData', '');
  const [parentPhotoFile, setParentPhotoFile] = useCachedState<File | null>('apply', 'parentPhotoFile', null);
  const [childPhotoData, setChildPhotoData] = useCachedState('apply', 'childPhotoData', '');
  const [childPhotoFile, setChildPhotoFile] = useCachedState<File | null>('apply', 'childPhotoFile', null);
  const [paymentSlipData, setPaymentSlipData] = useCachedState('apply', 'paymentSlipData', '');
  const [paymentSlipFile, setPaymentSlipFile] = useCachedState<File | null>('apply', 'paymentSlipFile', null);

  // Agreements & Permissions
  const [mediaPerm, setMediaPerm] = useCachedState<string>('apply', 'mediaPerm', '');
  const [noPhotoPerm, setNoPhotoPerm] = useCachedState('apply', 'noPhotoPerm', false);
  const [nonRefundable, setNonRefundable] = useCachedState('apply', 'nonRefundable', false);

  // Payment
  const [paymentPackages, setPaymentPackages] = useCachedState<PackageOption[]>('apply', 'paymentPackages', []);
  const [packageType, setPackageType] = useCachedState('apply', 'packageType', '');

  const [parentId, setParentId] = useState<string | null>(null);

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
  }, [path, setParentPhotoData, setParentPhotoFile, setChildPhotoData, setChildPhotoFile, setPaymentSlipData, setPaymentSlipFile, setPackageType]);

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
  }, [router, lang, setParentEmail, setParentName, setParentPhone, setIsReturningParent, setPaymentPackages]);

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    setData: React.Dispatch<React.SetStateAction<string>>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
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
      
      // Validate Name and Surname
      if (!isReturningParent && parentName.trim().split(/\s+/).length < 2) {
        throw new Error("กรุณากรอกทั้งชื่อและนามสกุลของผู้ปกครอง (เว้นวรรคระหว่างชื่อและนามสกุล)");
      }
      if (childName.trim().split(/\s+/).length < 2) {
        throw new Error("กรุณากรอกทั้งชื่อและนามสกุลของน้อง (เว้นวรรคระหว่างชื่อและนามสกุล)");
      }

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

      if (path === 'payment') {
        if (!paymentSlipFile || !packageType) {
          throw new Error(dict.apply.uploadSlipRequired);
        }
        if (!nonRefundable) {
          throw new Error(dict.apply.confirmNonRefundable);
        }
        await PackageService.submitTopUp(parentId, packageType, paymentSlipFile, nonRefundable);
      } else if (path === 'trial') {
        await PackageService.grantTrialPackage(parentId);
      }

      setShowSuccess(true);
      // Let the page handle cache clearing when unmounting or proceeding
    } catch (error: any) {
      setErrorMessage(error.message || dict.apply.genericError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    path, setPath,
    showSuccess, setShowSuccess,
    isSubmitting,
    errorMessage,
    fileToast, setFileToast,
    parentEmail, setParentEmail,
    parentName, setParentName,
    parentPhone, setParentPhone,
    isReturningParent, setIsReturningParent,
    childName, setChildName,
    childNickname, setChildNickname,
    childDob, setChildDob,
    allergy, setAllergy,
    info, setInfo,
    parentPhotoData, setParentPhotoData,
    parentPhotoFile, setParentPhotoFile,
    childPhotoData, setChildPhotoData,
    childPhotoFile, setChildPhotoFile,
    paymentSlipData, setPaymentSlipData,
    paymentSlipFile, setPaymentSlipFile,
    mediaPerm, setMediaPerm,
    noPhotoPerm, setNoPhotoPerm,
    nonRefundable, setNonRefundable,
    paymentPackages, setPaymentPackages,
    packageType, setPackageType,
    handleFile,
    submitForm,
    dict
  };
}

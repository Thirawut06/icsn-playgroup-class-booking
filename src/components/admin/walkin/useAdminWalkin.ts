import { useState, useEffect } from 'react';
import { AdminService, PackageService } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';

interface UseAdminWalkinProps {
  isOpen: boolean;
  sessionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function useAdminWalkin({ isOpen, sessionId, onClose, onSuccess }: UseAdminWalkinProps) {
  const [step, setStep] = useState<1 | 2>(1); // 1: Search, 2: Action
  const [phone, setPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Search Results
  const [searchResult, setSearchResult] = useState<any>(null);
  
  // Form state
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [newChildName, setNewChildName] = useState('');
  
  // Package Options
  const [packageOptions, setPackageOptions] = useState<{name: string, price: number}[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [showPackageSelect, setShowPackageSelect] = useState(false);

  useEffect(() => {
    if (isOpen) {
      PackageService.getPackageOptions()
        .then((data) => setPackageOptions(data || []));
    }
  }, [isOpen]);

  const handleReset = () => {
    setStep(1);
    setPhone('');
    setSearchResult(null);
    setSelectedChildId('');
    setNewChildName('');
    setShowPackageSelect(false);
    setSelectedPackage('');
  };

  const closeAndReset = () => {
    handleReset();
    onClose();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 9) return toast.error("กรุณากรอกเบอร์โทรศัพท์ให้ครบ");
    
    setIsSearching(true);
    try {
      const res = await AdminService.adminSearchWalkin(phone);
      setSearchResult(res);
      setStep(2);
      
      if (res?.found && res.children?.length > 0) {
        setSelectedChildId(res.children[0].id);
      } else {
        setSelectedChildId('');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSearching(false);
    }
  };

  const handleProcess = async (paymentType: 'deduct' | 'paid' | 'trial' | 'paid_package') => {
    if (searchResult?.found && searchResult.children?.length > 0 && !selectedChildId && !newChildName) {
      return toast.error("กรุณาเลือกเด็ก หรือพิมพ์ชื่อเด็กคนใหม่");
    }
    if (!searchResult?.found && !newChildName.trim()) {
      return toast.error("กรุณากรอกชื่อเล่นเด็ก");
    }
    if (paymentType === 'paid_package' && !selectedPackage) {
      return toast.error("กรุณาเลือกแพ็คเกจที่ลูกค้าชำระเงิน");
    }

    setIsProcessing(true);
    try {
      if (!sessionId) {
        throw new Error('กรุณาเลือกรอบเวลาก่อนทำรายการ');
      }

      const finalChildId = selectedChildId === 'NEW' || !selectedChildId ? null : selectedChildId;
      const finalChildName = finalChildId ? '' : newChildName;

      await AdminService.adminProcessWalkin({
        phone,
        childId: finalChildId,
        childName: finalChildName,
        sessionId,
        paymentType,
        packageName: paymentType === 'paid_package' ? selectedPackage : undefined
      });
      
      toast.success("บันทึก Walk-in สำเร็จ!");
      if (paymentType === 'paid_package') {
        toast.success("สร้างรายการรออัปสลิปไว้ใน Pending Slips แล้ว");
      }
      onSuccess();
      closeAndReset();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    step,
    phone,
    setPhone,
    isSearching,
    isProcessing,
    searchResult,
    selectedChildId,
    setSelectedChildId,
    newChildName,
    setNewChildName,
    packageOptions,
    selectedPackage,
    setSelectedPackage,
    showPackageSelect,
    setShowPackageSelect,
    handleReset,
    closeAndReset,
    handleSearch,
    handleProcess,
  };
}

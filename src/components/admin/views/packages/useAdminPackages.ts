import { useState, useEffect, useCallback } from 'react';
import { PackageService, AdminService } from '@/lib/supabase';
import type { PackageOption } from '@/types';
import toast from 'react-hot-toast';
import { COPY } from '@/config/copy';

export function useAdminPackages() {
  const [options, setOptions] = useState<PackageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCredits, setEditCredits] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PackageOption | null>(null);

  const loadOptions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await PackageService.getPackageOptions();
      setOptions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const toggleActive = async (pkg: PackageOption) => {
    setIsProcessing(true);
    try {
      await AdminService.invokeAdminAction('toggle-package', {
        packageId: pkg.id,
        isActive: !pkg.is_active,
      });
      toast.success(pkg.is_active ? 'ปิดใช้งานแพ็กเกจนี้แล้ว' : 'เปิดใช้งานแพ็กเกจนี้แล้ว');
      await loadOptions();
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  const startEdit = (pkg: PackageOption) => {
    setEditingId(pkg.id);
    setEditName(pkg.name);
    setEditPrice(String(pkg.price));
    setEditCredits(String(pkg.credits));
    setIsModalOpen(true);
  };

  const startAdd = () => {
    setEditingId(null);
    setEditName('');
    setEditPrice('');
    setEditCredits('');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const priceNum = parseFloat(editPrice);
    const creditsNum = parseInt(editCredits, 10);
    if (!editName.trim() || !priceNum || !creditsNum) {
      toast.error(COPY.ALERTS.REQUIRE_ALL_FIELDS);
      return;
    }
    setIsProcessing(true);
    try {
      if (editingId) {
        await AdminService.invokeAdminAction('update-package', {
          packageId: editingId,
          name: editName.trim(),
          price: priceNum,
          credits: creditsNum,
        });
        toast.success('บันทึกการแก้ไขสำเร็จ');
      } else {
        await AdminService.invokeAdminAction('add-package', {
          name: editName.trim(),
          price: priceNum,
          credits: creditsNum,
        });
        toast.success('เพิ่มแพ็กเกจใหม่สำเร็จ');
      }
      setIsModalOpen(false);
      await loadOptions();
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsProcessing(true);
    try {
      await AdminService.invokeAdminAction('delete-package', { packageId: deleteTarget.id });
      toast.success('ลบแพ็กเกจสำเร็จ');
      await loadOptions();
    } catch (err) {
      toast.error(COPY.ALERTS.CANNOT_DELETE(err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessing(false);
      setDeleteTarget(null);
    }
  };

  return {
    options,
    loading,
    isProcessing,
    isModalOpen,
    setIsModalOpen,
    editingId,
    editName,
    setEditName,
    editPrice,
    setEditPrice,
    editCredits,
    setEditCredits,
    deleteTarget,
    setDeleteTarget,
    toggleActive,
    startEdit,
    startAdd,
    handleSave,
    confirmDelete
  };
}

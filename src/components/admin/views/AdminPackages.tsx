"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Loader2, Save, X, AlertCircle, Package } from 'lucide-react';
import { PackageService, AdminService } from '@/lib/supabase';
import type { PackageOption } from '@/types';
import toast from 'react-hot-toast';
import { COPY } from '@/config/copy';
import { 
  AdminPrimaryButton, 
  AdminInfoBox, 
  AdminDataTable, 
  AdminToggle, 
  AdminModal,
  AdminFieldLabel,
  AdminPanel,
  AdminPanelHeader
} from '../admin-ui';

export function AdminPackages() {
  const [options, setOptions] = useState<PackageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCredits, setEditCredits] = useState('');

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

  const deletePackage = async (pkg: PackageOption) => {
    if (!confirm(`ลบแพ็กเกจ "${pkg.name}" — แน่ใจหรือไม่?`)) return;
    setIsProcessing(true);
    try {
      await AdminService.invokeAdminAction('delete-package', { packageId: pkg.id });
      toast.success('ลบแพ็กเกจสำเร็จ');
      await loadOptions();
    } catch (err) {
      toast.error(COPY.ALERTS.CANNOT_DELETE(err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPanel className="no-print">
        <AdminPanelHeader 
          icon={Package} 
          title="แพ็กเกจราคา (Packages & Pricing)" 
          action={
            <AdminPrimaryButton onClick={startAdd} disabled={isProcessing}>
              <Plus className="w-5 h-5 mr-1.5" />
              เพิ่มแพ็กเกจใหม่
            </AdminPrimaryButton>
          }
        />
        <div className="p-0 sm:p-6 space-y-6">
          
          <AdminInfoBox
            title="เกี่ยวกับแพ็กเกจราคา"
            description={
              <>
                แพ็กเกจที่ตั้งค่าในหน้านี้ จะแสดงให้ผู้ปกครองเห็นในหน้าแรกของแอปพลิเคชัน<br />
                คุณสามารถเลือกเปิด/ปิดแพ็กเกจที่ไม่ต้องการใช้งานชั่วคราวได้
              </>
            }
            icon={AlertCircle}
          />

          <AdminDataTable
            headers={[
              { label: 'ชื่อแพ็กเกจ' },
              { label: 'ราคา (บาท)', align: 'center' },
              { label: 'เครดิต', align: 'center' },
              { label: 'สถานะ', align: 'center' },
              { label: 'จัดการ', align: 'right' },
            ]}
          >
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-icsn-teal" />
                </td>
              </tr>
            ) : options.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  <p>ยังไม่มีแพ็กเกจในระบบ</p>
                </td>
              </tr>
            ) : (
              <>
                {options.map((pkg) => (
                  <tr key={pkg.id} className={`hover:bg-muted/30 transition-colors ${!pkg.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <p className={`font-bold text-icsn-navy ${!pkg.is_active ? 'line-through' : ''}`}>
                        {pkg.name}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-foreground font-medium">฿{pkg.price.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] h-7 bg-muted text-foreground rounded-full text-sm font-bold border border-border">
                        {pkg.credits}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <AdminToggle 
                        isActive={!!pkg.is_active} 
                        onClick={() => toggleActive(pkg)} 
                        disabled={isProcessing} 
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => startEdit(pkg)} 
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-info hover:bg-info/10 transition-colors border border-transparent hover:border-info/30"
                        >
                          <Edit2 className="w-4 h-4" /> แก้ไข
                        </button>
                        <button 
                          onClick={() => deletePackage(pkg)} 
                          disabled={isProcessing} 
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-error hover:bg-error/10 transition-colors border border-transparent hover:border-error/30 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" /> ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </AdminDataTable>
        </div>
      </AdminPanel>

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => !isProcessing && setIsModalOpen(false)}
        title={editingId ? 'แก้ไขแพ็กเกจ (Edit Package)' : 'เพิ่มแพ็กเกจใหม่ (Add Package)'}
      >
        <div className="space-y-4">
          <div>
            <AdminFieldLabel>ชื่อแพ็กเกจ (Package Name)</AdminFieldLabel>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none transition-all text-icsn-navy"
              placeholder="เช่น 10 Classes"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <AdminFieldLabel>ราคา (Price)</AdminFieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-muted-foreground font-bold">฿</span>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none transition-all text-icsn-navy"
                  min="0"
                />
              </div>
            </div>
            <div>
              <AdminFieldLabel>เครดิต (Credits)</AdminFieldLabel>
              <input
                type="number"
                value={editCredits}
                onChange={(e) => setEditCredits(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none transition-all text-icsn-navy text-center"
                min="1"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="flex items-center gap-2 px-8 py-2.5 bg-icsn-teal hover:bg-icsn-teal/90 text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              บันทึกข้อมูล
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}

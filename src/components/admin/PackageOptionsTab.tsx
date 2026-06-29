"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Loader2, Save, X, AlertCircle } from 'lucide-react';
import { PackageService, AdminService } from '@/lib/supabase';
import type { PackageOption } from '@/types';
import toast from 'react-hot-toast';
import { COPY } from '@/config/copy';
import { 
  AdminPrimaryButton, 
  AdminInfoBox, 
  AdminDataTable, 
  AdminToggle, 
  AdminIconButton 
} from './admin-ui';

export function PackageOptionsTab() {
  const [options, setOptions] = useState<PackageOption[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [credits, setCredits] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Inline edit state
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

  const handleAdd = async () => {
    const priceNum = parseFloat(price);
    const creditsNum = parseInt(credits, 10);
    if (!name.trim() || !priceNum || !creditsNum) {
      toast.error(COPY.ALERTS.REQUIRE_ALL_FIELDS);
      return;
    }
    setIsProcessing(true);
    try {
      await AdminService.invokeAdminAction('add-package', {
        name: name.trim(),
        price: priceNum,
        credits: creditsNum,
      });
      setName('');
      setPrice('');
      setCredits('');
      setIsAdding(false);
      await loadOptions();
      toast.success('เพิ่มแพ็กเกจใหม่สำเร็จ');
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

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
    setIsAdding(false);
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setName('');
    setPrice('');
    setCredits('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const priceNum = parseFloat(editPrice);
    const creditsNum = parseInt(editCredits, 10);
    if (!editName.trim() || !priceNum || !creditsNum) {
      toast.error(COPY.ALERTS.REQUIRE_ALL_FIELDS);
      return;
    }
    setIsProcessing(true);
    try {
      await AdminService.invokeAdminAction('update-package', {
        packageId: editingId,
        name: editName.trim(),
        price: priceNum,
        credits: creditsNum,
      });
      setEditingId(null);
      toast.success('บันทึกการแก้ไขสำเร็จ');
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
          action={
            <AdminPrimaryButton onClick={startAdd} disabled={isAdding || isProcessing}>
              <Plus className="w-4 h-4 mr-1.5" />
              เพิ่มแพ็กเกจใหม่
            </AdminPrimaryButton>
          }
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
              <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-icsn-teal" />
              </td>
            </tr>
          ) : options.length === 0 && !isAdding ? (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                <p>ยังไม่มีแพ็กเกจในระบบ</p>
              </td>
            </tr>
          ) : (
            <>
              {options.map((pkg) => {
                const isEditing = editingId === pkg.id;

                if (isEditing) {
                  return (
                    <tr key={pkg.id} className="bg-blue-50/30">
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-icsn-teal outline-none"
                          placeholder="เช่น 10 Classes"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-24 mx-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-icsn-teal outline-none text-center"
                          min="0"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          value={editCredits}
                          onChange={(e) => setEditCredits(e.target.value)}
                          className="w-24 mx-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-icsn-teal outline-none text-center"
                          min="1"
                        />
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <AdminIconButton icon={X} onClick={cancelEdit} title="ยกเลิก" />
                          <button onClick={saveEdit} disabled={isProcessing} className="p-2 bg-icsn-teal text-white hover:bg-icsn-green rounded-lg transition" title="บันทึก">
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={pkg.id} className={`hover:bg-gray-50/50 transition-colors ${!pkg.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <p className={`font-bold text-gray-800 ${!pkg.is_active ? 'line-through' : ''}`}>
                        {pkg.name}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-gray-700">฿{pkg.price.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] h-7 bg-gray-100 text-gray-700 rounded-full text-sm font-bold">
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
                        <AdminIconButton icon={Edit2} variant="primary" onClick={() => startEdit(pkg)} title="แก้ไข" />
                        <AdminIconButton icon={Trash2} variant="danger" onClick={() => deletePackage(pkg)} disabled={isProcessing} title="ลบ" />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {isAdding && (
                <tr className="bg-green-50/30">
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-icsn-teal outline-none"
                      placeholder="เช่น 10 Classes"
                      autoFocus
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-24 mx-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-icsn-teal outline-none text-center"
                      min="0"
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input
                      type="number"
                      value={credits}
                      onChange={(e) => setCredits(e.target.value)}
                      className="w-24 mx-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-icsn-teal outline-none text-center"
                      min="1"
                    />
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500">เปิดใช้งานทันที</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <AdminIconButton icon={X} onClick={cancelEdit} title="ยกเลิก" />
                      <button onClick={handleAdd} disabled={isProcessing} className="p-2 bg-icsn-teal text-white hover:bg-icsn-green rounded-lg transition" title="บันทึก">
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </>
          )}
        </AdminDataTable>
      </div>
    </div>
  );
}

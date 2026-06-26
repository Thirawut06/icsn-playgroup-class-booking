"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Check, Package, Pencil, Plus, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react';
import { AppDB, invokeAdminAction } from '@/lib/supabase';
import type { PackageOption } from '@/types';
import {
  AdminEmptyState,
  AdminFieldLabel,
  AdminPanel,
  AdminPanelHeader,
} from './admin-ui';

export function PackageOptionsTab() {
  const [options, setOptions] = useState<PackageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [credits, setCredits] = useState('');
  const [adding, setAdding] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCredits, setEditCredits] = useState('');
  const [saving, setSaving] = useState(false);

  const loadOptions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await AppDB.getPackageOptions();
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(price);
    const creditsNum = parseInt(credits, 10);
    if (!name.trim() || !priceNum || !creditsNum) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setAdding(true);
    try {
      await invokeAdminAction('add-package', {
        name: name.trim(),
        price: priceNum,
        credits: creditsNum,
      });
      setName('');
      setPrice('');
      setCredits('');
      await loadOptions();
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (pkg: PackageOption) => {
    try {
      await invokeAdminAction('toggle-package', {
        packageId: pkg.id,
        isActive: !pkg.is_active,
      });
      await loadOptions();
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const startEdit = (pkg: PackageOption) => {
    setEditingId(pkg.id);
    setEditName(pkg.name);
    setEditPrice(String(pkg.price));
    setEditCredits(String(pkg.credits));
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const priceNum = parseFloat(editPrice);
    const creditsNum = parseInt(editCredits, 10);
    if (!editName.trim() || !priceNum || !creditsNum) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setSaving(true);
    try {
      await invokeAdminAction('update-package', {
        packageId: editingId,
        name: editName.trim(),
        price: priceNum,
        credits: creditsNum,
      });
      setEditingId(null);
      await loadOptions();
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  const deletePackage = async (pkg: PackageOption) => {
    if (!confirm(`ลบแพ็กเกจ "${pkg.name}" — แน่ใจหรือไม่?`)) return;
    try {
      await invokeAdminAction('delete-package', { packageId: pkg.id });
      await loadOptions();
    } catch (err) {
      alert('ลบไม่ได้: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <AdminPanel className="no-print">
      <AdminPanelHeader
        icon={Package}
        title="จัดการแพ็กเกจเติมเครดิต"
      />

      <form
        onSubmit={handleAdd}
        className="p-6 bg-gray-50 border border-gray-200 rounded-2xl flex flex-wrap items-end gap-4"
      >
        <div>
          <AdminFieldLabel>ชื่อแพ็กเกจ</AdminFieldLabel>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="เช่น 4 ครั้ง"
            className="border border-gray-200 px-4 py-3 rounded-xl text-sm w-44 h-12 bg-white outline-none focus:ring-1 focus:ring-icsn-teal focus:border-icsn-teal transition"
          />
        </div>
        <div>
          <AdminFieldLabel>ราคา (บาท)</AdminFieldLabel>
          <input
            type="number"
            min={0}
            value={price}
            onChange={e => setPrice(e.target.value)}
            className="border border-gray-200 px-4 py-3 rounded-xl text-sm w-32 h-12 bg-white outline-none focus:ring-1 focus:ring-icsn-teal focus:border-icsn-teal transition"
          />
        </div>
        <div>
          <AdminFieldLabel>เครดิต</AdminFieldLabel>
          <input
            type="number"
            min={1}
            value={credits}
            onChange={e => setCredits(e.target.value)}
            className="border border-gray-200 px-4 py-3 rounded-xl text-sm w-24 h-12 bg-white outline-none focus:ring-1 focus:ring-icsn-teal focus:border-icsn-teal transition"
          />
        </div>
        <button
          type="submit"
          disabled={adding}
          className="flex items-center gap-2 bg-icsn-navy hover:bg-[#1a1040] text-white px-6 py-3 rounded-xl text-sm font-bold h-12 cursor-pointer disabled:opacity-50 shadow-sm transition"
        >
          <Plus className="w-5 h-5" />
          {adding ? 'กำลังเพิ่ม...' : 'เพิ่มแพ็กเกจ'}
        </button>
      </form>

      {loading ? (
        <p className="text-center text-gray-500 py-10 text-base font-medium">กำลังโหลด...</p>
      ) : options.length === 0 ? (
        <AdminEmptyState message="ยังไม่มีแพ็กเกจในระบบ" />
      ) : (
        <div className="space-y-4">
          {options.map(pkg => {
            const isEditing = editingId === pkg.id;

            return (
              <div
                key={pkg.id}
                className={`border rounded-2xl p-5 md:p-6 bg-white transition ${
                  isEditing ? 'border-icsn-teal ring-4 ring-icsn-teal/10 shadow-sm' : 'border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
              >
                {isEditing ? (
                  /* ─── Edit Mode ─── */
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                      <div className="flex-1 min-w-[150px]">
                        <AdminFieldLabel>ชื่อ</AdminFieldLabel>
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="border border-gray-200 px-4 py-3 rounded-xl text-sm w-full h-12 bg-white outline-none focus:border-icsn-teal focus:ring-1 focus:ring-icsn-teal transition"
                        />
                      </div>
                      <div className="w-32">
                        <AdminFieldLabel>ราคา (฿)</AdminFieldLabel>
                        <input
                          type="number"
                          value={editPrice}
                          onChange={e => setEditPrice(e.target.value)}
                          className="border border-gray-200 px-4 py-3 rounded-xl text-sm w-full h-12 bg-white outline-none focus:border-icsn-teal focus:ring-1 focus:ring-icsn-teal transition"
                        />
                      </div>
                      <div className="w-24">
                        <AdminFieldLabel>เครดิต</AdminFieldLabel>
                        <input
                          type="number"
                          value={editCredits}
                          onChange={e => setEditCredits(e.target.value)}
                          className="border border-gray-200 px-4 py-3 rounded-xl text-sm w-full h-12 bg-white outline-none focus:border-icsn-teal focus:ring-1 focus:ring-icsn-teal transition"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={saving}
                        className="flex items-center gap-2 bg-icsn-teal hover:bg-[#00969e] text-white px-5 py-2.5 rounded-xl text-sm font-bold h-11 cursor-pointer disabled:opacity-50 transition"
                      >
                        <Check className="w-5 h-5" />
                        {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-bold h-11 cursor-pointer transition"
                      >
                        <X className="w-5 h-5" />
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ─── View Mode ─── */
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-base md:text-lg truncate">{pkg.name}</p>
                        <p className="text-gray-500 text-sm md:text-base mt-1">
                          ฿{Number(pkg.price).toLocaleString()} — <span className="font-bold text-gray-700">{pkg.credits} เครดิต</span>
                        </p>
                      </div>
                      <span
                        className={`inline-flex px-3 py-1.5 rounded-lg font-bold text-xs border shrink-0 ${
                          pkg.is_active !== false
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                      >
                        {pkg.is_active !== false ? 'เปิดใช้งาน' : 'ปิด'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(pkg)}
                        className="p-2.5 text-gray-400 hover:text-icsn-teal hover:bg-gray-50 rounded-xl transition cursor-pointer"
                        title="แก้ไข"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(pkg)}
                        className="text-icsn-teal hover:opacity-80 cursor-pointer p-1"
                        title={pkg.is_active !== false ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                      >
                        {pkg.is_active !== false ? (
                          <ToggleRight className="w-8 h-8" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-gray-400" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePackage(pkg)}
                        className="p-2.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title="ลบ"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminPanel>
  );
}

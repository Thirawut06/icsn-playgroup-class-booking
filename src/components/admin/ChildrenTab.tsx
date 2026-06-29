"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Baby, Search, Loader2, Edit, X, Save } from 'lucide-react';
import { AdminService } from '@/lib/supabase';
import {
  AdminPanel,
  AdminPanelHeader,
  AdminFieldLabel,
} from './admin-ui';

interface ChildRow {
  id: string;
  parent_id: string;
  nickname: string;
  full_name: string | null;
  age: number;
  dob: string | null;
  food_allergy: string | null;
  special_info: string | null;
  media_perm: boolean | null;
  no_photo_perm: boolean | null;
  created_at: string;
  parents: {
    name: string;
    phone: string;
    email: string | null;
  } | null;
}

export function ChildrenTab() {
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Edit Modal State
  const [editingChild, setEditingChild] = useState<ChildRow | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State for Edit Modal
  const [editForm, setEditForm] = useState<Partial<ChildRow>>({});

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    setLoading(true);
    try {
      const data = await AdminService.getAllChildren();
      setChildren(data);
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const filteredChildren = useMemo(() => {
    const q = search.toLowerCase();
    return children.filter(c => 
      c.nickname.toLowerCase().includes(q) ||
      (c.full_name && c.full_name.toLowerCase().includes(q)) ||
      (c.parents?.name && c.parents.name.toLowerCase().includes(q)) ||
      (c.parents?.phone && c.parents.phone.includes(q))
    );
  }, [children, search]);

  const handleEditClick = (child: ChildRow) => {
    setEditingChild(child);
    setEditForm({
      nickname: child.nickname,
      full_name: child.full_name,
      age: child.age,
      dob: child.dob,
      food_allergy: child.food_allergy,
      special_info: child.special_info,
      media_perm: child.media_perm,
      no_photo_perm: child.no_photo_perm,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingChild) return;
    setSaving(true);
    try {
      await AdminService.updateChildProfile(editingChild.id, editForm);
      await fetchChildren();
      setEditingChild(null);
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  const formatAge = (ageNum: number) => {
    if (ageNum === 0) return '< 1 ปี';
    return `${ageNum} ปี`;
  };

  return (
    <div className="space-y-6">
      <AdminPanel className="no-print">
        <AdminPanelHeader
          icon={Baby}
          title="จัดการข้อมูลนักเรียน (Children Profiles)"
          action={
            <div className="relative w-full sm:w-64 mt-3 sm:mt-0">
              <input
                type="text"
                placeholder="ค้นหาชื่อเด็ก, ชื่อผู้ปกครอง, เบอร์โทร..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          }
        />

        <div className="overflow-x-auto border border-gray-300 shadow-sm">
          <table className="w-full text-left text-xs sm:text-sm border-collapse bg-white whitespace-nowrap">
            <thead>
              <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                <th className="border border-gray-300 px-3 py-2 w-10 text-center">#</th>
                <th className="border border-gray-300 px-3 py-2">ชื่อเล่น (Nickname)</th>
                <th className="border border-gray-300 px-3 py-2">ชื่อจริง (Full Name)</th>
                <th className="border border-gray-300 px-3 py-2 text-center">อายุ</th>
                <th className="border border-gray-300 px-3 py-2 text-center">วันเกิด</th>
                <th className="border border-gray-300 px-3 py-2">ข้อมูลผู้ปกครอง</th>
                <th className="border border-gray-300 px-3 py-2">แพ้อาหาร</th>
                <th className="border border-gray-300 px-3 py-2 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : filteredChildren.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500 text-sm bg-gray-50/50">
                    ไม่พบข้อมูลนักเรียน
                  </td>
                </tr>
              ) : (
                filteredChildren.map((child, index) => (
                  <tr key={child.id} className="hover:bg-blue-50/50 transition">
                    <td className="border border-gray-300 px-3 py-1.5 text-center text-gray-500 font-medium">
                      {index + 1}
                    </td>
                    <td className="border border-gray-300 px-3 py-1.5 font-bold text-blue-700">
                      {child.nickname}
                    </td>
                    <td className="border border-gray-300 px-3 py-1.5 text-gray-800">
                      {child.full_name || '-'}
                    </td>
                    <td className="border border-gray-300 px-3 py-1.5 text-center font-medium">
                      {formatAge(child.age)}
                    </td>
                    <td className="border border-gray-300 px-3 py-1.5 text-center text-gray-600">
                      {child.dob ? new Date(child.dob).toLocaleDateString('th-TH') : '-'}
                    </td>
                    <td className="border border-gray-300 px-3 py-1.5">
                      <div className="font-bold text-gray-900">{child.parents?.name || 'Unknown'}</div>
                      <div className="text-gray-500 text-xs">{child.parents?.phone || '-'}</div>
                    </td>
                    <td className="border border-gray-300 px-3 py-1.5">
                      {child.food_allergy ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700">
                          {child.food_allergy}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-1.5 text-center">
                      <button
                        onClick={() => handleEditClick(child)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded shadow-sm text-xs font-bold transition"
                      >
                        <Edit className="w-3 h-3" />
                        แก้ไข
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminPanel>

      {/* Edit Child Modal */}
      {editingChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Baby className="w-5 h-5 text-blue-600" />
                แก้ไขข้อมูลนักเรียน: {editingChild.nickname}
              </h3>
              <button
                onClick={() => setEditingChild(null)}
                className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <AdminFieldLabel>ชื่อเล่น (Nickname) *</AdminFieldLabel>
                  <input
                    type="text"
                    value={editForm.nickname || ''}
                    onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <AdminFieldLabel>ชื่อจริง (Full Name)</AdminFieldLabel>
                  <input
                    type="text"
                    value={editForm.full_name || ''}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <div>
                  <AdminFieldLabel>อายุ (ปี)</AdminFieldLabel>
                  <input
                    type="number"
                    min="0"
                    value={editForm.age || 0}
                    onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <AdminFieldLabel>วัน/เดือน/ปีเกิด (DOB)</AdminFieldLabel>
                  <input
                    type="date"
                    value={editForm.dob || ''}
                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <AdminFieldLabel>อาการแพ้อาหาร (Food Allergies)</AdminFieldLabel>
                <input
                  type="text"
                  value={editForm.food_allergy || ''}
                  onChange={(e) => setEditForm({ ...editForm, food_allergy: e.target.value })}
                  placeholder="เช่น แพ้นมวัว, แพ้ถั่วลิสง (ปล่อยว่างถ้าไม่มี)"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-rose-700 font-medium"
                />
              </div>

              <div>
                <AdminFieldLabel>ข้อมูลพิเศษอื่นๆ (Special Info)</AdminFieldLabel>
                <textarea
                  value={editForm.special_info || ''}
                  onChange={(e) => setEditForm({ ...editForm, special_info: e.target.value })}
                  placeholder="ความต้องการพิเศษอื่นๆ"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-200 transition">
                  <input
                    type="checkbox"
                    checked={editForm.media_perm || false}
                    onChange={(e) => setEditForm({ ...editForm, media_perm: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 font-medium">อนุญาตให้ถ่ายภาพ/วิดีโอ (Media Permission)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-rose-50 rounded border border-transparent hover:border-rose-200 transition">
                  <input
                    type="checkbox"
                    checked={editForm.no_photo_perm || false}
                    onChange={(e) => setEditForm({ ...editForm, no_photo_perm: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded border-rose-300"
                  />
                  <span className="text-sm text-rose-700 font-bold">ห้ามถ่ายภาพเด็ดขาด (No Photo)</span>
                </label>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl sticky bottom-0">
              <button
                onClick={() => setEditingChild(null)}
                className="px-5 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editForm.nickname}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

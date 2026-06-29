"use client";

import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Edit2, Loader2, Save, X, AlertCircle } from 'lucide-react';
import { 
  AdminPanel, 
  AdminPanelHeader, 
  AdminPrimaryButton,
  AdminInfoBox,
  AdminDataTable,
  AdminToggle,
  AdminIconButton
} from '../admin-ui';
import { AdminService } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { CLASS_CONFIG } from '@/config/constants';

interface TimeSlot {
  id: string;
  time_label: string;
  capacity: number;
  is_active: boolean;
  created_at?: string;
}

export function AdminTimeSlots() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Add State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const data = await AdminService.getSessionTemplates();
      setSlots(data || []);
    } catch (err: any) {
      toast.error('Failed to load time slots: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleSeedDefaults = async () => {
    setIsProcessing(true);
    try {
      await AdminService.addSessionTemplate('9.00 - 10.30', CLASS_CONFIG.DEFAULT_CAPACITY);
      await AdminService.addSessionTemplate('11.00 - 12.30', CLASS_CONFIG.DEFAULT_CAPACITY);
      await AdminService.addSessionTemplate('13.15 - 14.45', CLASS_CONFIG.DEFAULT_CAPACITY);
      toast.success('เพิ่มค่าเริ่มต้นสำเร็จ');
      await fetchSlots();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async (id?: string) => {
    if (!editLabel.trim()) return toast.error('กรุณาระบุช่วงเวลา');
    const cap = parseInt(editCapacity);
    if (!cap || cap < 1) return toast.error('กรุณาระบุความจุที่ถูกต้อง');

    setIsProcessing(true);
    try {
      if (id) {
        await AdminService.updateSessionTemplate(id, {
          time_label: editLabel.trim(),
          capacity: cap
        });
        toast.success('บันทึกการแก้ไขสำเร็จ');
      } else {
        await AdminService.addSessionTemplate(editLabel.trim(), cap);
        toast.success('เพิ่มช่วงเวลาใหม่สำเร็จ');
      }
      setEditingId(null);
      setIsAdding(false);
      await fetchSlots();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('แน่ใจหรือไม่ที่จะลบช่วงเวลานี้?')) return;
    setIsProcessing(true);
    try {
      await AdminService.deleteSessionTemplate(id);
      toast.success('ลบช่วงเวลาสำเร็จ');
      await fetchSlots();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setIsProcessing(true);
    try {
      await AdminService.updateSessionTemplate(id, { is_active: !currentActive });
      toast.success(currentActive ? 'ปิดใช้งานช่วงเวลานี้แล้ว' : 'เปิดใช้งานช่วงเวลานี้แล้ว');
      await fetchSlots();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const startEdit = (slot: TimeSlot) => {
    setEditingId(slot.id);
    setEditLabel(slot.time_label);
    setEditCapacity(String(slot.capacity));
    setIsAdding(false);
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setEditLabel('');
    setEditCapacity(String(CLASS_CONFIG.DEFAULT_CAPACITY));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPanel className="no-print">
        <AdminPanelHeader icon={Clock} title="ตั้งค่าช่วงเวลา (Time Slots)" />

        <div className="p-6 space-y-6">
          <AdminInfoBox
            title="เกี่ยวกับ Time Slots"
            description={
              <>
                ช่วงเวลาที่ตั้งค่าในหน้านี้ จะถูกใช้เป็น <strong>ค่าตั้งต้น (Default)</strong> เมื่อมีการเพิ่มวันเรียนใหม่เท่านั้น<br />
                การแก้ไขข้อมูลในหน้านี้จะไม่มีผลกระทบกับคลาสเรียนที่ถูกสร้างไปแล้วในตารางเรียน
              </>
            }
            icon={AlertCircle}
            action={
              <AdminPrimaryButton onClick={startAdd} disabled={isAdding || isProcessing}>
                <Plus className="w-4 h-4 mr-1.5" />
                เพิ่มช่วงเวลาใหม่
              </AdminPrimaryButton>
            }
          />

          <AdminDataTable
            headers={[
              { label: 'ช่วงเวลา (Time Label)' },
              { label: 'ความจุนักเรียน', align: 'center' },
              { label: 'สถานะ', align: 'center' },
              { label: 'จัดการ', align: 'right' },
            ]}
          >
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-icsn-teal" />
                </td>
              </tr>
            ) : slots.length === 0 && !isAdding ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  <p className="mb-4">ยังไม่มีข้อมูลช่วงเวลาเรียน</p>
                  <AdminPrimaryButton onClick={handleSeedDefaults} disabled={isProcessing}>
                    เพิ่มค่าเริ่มต้น (9.00, 11.00, 13.15)
                  </AdminPrimaryButton>
                </td>
              </tr>
            ) : (
              <>
                {slots.map((slot) => {
                  const isEditing = editingId === slot.id;

                  if (isEditing) {
                    return (
                      <tr key={slot.id} className="bg-blue-50/30">
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-icsn-teal outline-none"
                            placeholder="เช่น 9.00 - 10.30"
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="number"
                            value={editCapacity}
                            onChange={(e) => setEditCapacity(e.target.value)}
                            className="w-24 mx-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-icsn-teal outline-none text-center"
                            min="1"
                          />
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <AdminIconButton icon={X} onClick={cancelEdit} title="ยกเลิก" />
                            <button onClick={() => handleSave(slot.id)} disabled={isProcessing} className="p-2 bg-icsn-teal text-white hover:bg-icsn-green rounded-lg transition" title="บันทึก">
                              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={slot.id} className={`hover:bg-gray-50/50 transition-colors ${!slot.is_active ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800">{slot.time_label}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2.5rem] h-7 bg-gray-100 text-gray-700 rounded-full text-sm font-bold">
                          {slot.capacity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <AdminToggle 
                          isActive={slot.is_active} 
                          onClick={() => handleToggleActive(slot.id, slot.is_active)} 
                          disabled={isProcessing} 
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <AdminIconButton icon={Edit2} variant="primary" onClick={() => startEdit(slot)} title="แก้ไข" />
                          <AdminIconButton icon={Trash2} variant="danger" onClick={() => handleDelete(slot.id)} disabled={isProcessing} title="ลบ" />
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
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-icsn-teal outline-none"
                        placeholder="เช่น 15.00 - 16.30"
                        autoFocus
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="number"
                        value={editCapacity}
                        onChange={(e) => setEditCapacity(e.target.value)}
                        className="w-24 mx-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-icsn-teal outline-none text-center"
                        min="1"
                      />
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">เปิดใช้งานทันที</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <AdminIconButton icon={X} onClick={cancelEdit} title="ยกเลิก" />
                        <button onClick={() => handleSave()} disabled={isProcessing} className="p-2 bg-icsn-teal text-white hover:bg-icsn-green rounded-lg transition" title="บันทึก">
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
      </AdminPanel>
    </div>
  );
}

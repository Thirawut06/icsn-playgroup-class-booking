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
  AdminModal,
  AdminFieldLabel
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  
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

  const handleSave = async () => {
    if (!editLabel.trim()) return toast.error('กรุณาระบุช่วงเวลา');
    const cap = parseInt(editCapacity);
    if (!cap || cap < 1) return toast.error('กรุณาระบุความจุที่ถูกต้อง');

    setIsProcessing(true);
    try {
      if (editingId) {
        await AdminService.updateSessionTemplate(editingId, {
          time_label: editLabel.trim(),
          capacity: cap
        });
        toast.success('บันทึกการแก้ไขสำเร็จ');
      } else {
        await AdminService.addSessionTemplate(editLabel.trim(), cap);
        toast.success('เพิ่มช่วงเวลาใหม่สำเร็จ');
      }
      setIsModalOpen(false);
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
    setIsModalOpen(true);
  };

  const startAdd = () => {
    setEditingId(null);
    setEditLabel('');
    setEditCapacity(String(CLASS_CONFIG.DEFAULT_CAPACITY));
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPanel className="no-print">
        <AdminPanelHeader 
          icon={Clock} 
          title="ตั้งค่าช่วงเวลา (Time Slots)" 
          action={
            <AdminPrimaryButton onClick={startAdd} disabled={isProcessing}>
              <Plus className="w-5 h-5 mr-1.5" />
              เพิ่มช่วงเวลาใหม่
            </AdminPrimaryButton>
          }
        />

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
                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-icsn-teal" />
                </td>
              </tr>
            ) : slots.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                  <p className="mb-4">ยังไม่มีข้อมูลช่วงเวลาเรียน</p>
                  <button onClick={handleSeedDefaults} disabled={isProcessing} className="px-6 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-bold transition">
                    เพิ่มค่าเริ่มต้น (9.00, 11.00, 13.15)
                  </button>
                </td>
              </tr>
            ) : (
              <>
                {slots.map((slot) => (
                  <tr key={slot.id} className={`hover:bg-muted/30 transition-colors ${!slot.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <p className="font-bold text-icsn-navy">{slot.time_label}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] h-7 bg-muted text-foreground rounded-full text-sm font-bold border border-border">
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
                        <button 
                          onClick={() => startEdit(slot)} 
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                        >
                          <Edit2 className="w-4 h-4" /> แก้ไข
                        </button>
                        <button 
                          onClick={() => handleDelete(slot.id)} 
                          disabled={isProcessing} 
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200 disabled:opacity-50"
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
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'แก้ไขช่วงเวลา (Edit Time Slot)' : 'เพิ่มช่วงเวลาใหม่ (Add Time Slot)'}
      >
        <div className="space-y-4">
          <div>
            <AdminFieldLabel>ช่วงเวลา (Time Label)</AdminFieldLabel>
            <input
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none transition-all text-icsn-navy"
              placeholder="เช่น 9.00 - 10.30"
              autoFocus
            />
          </div>
          <div>
            <AdminFieldLabel>ความจุนักเรียน (Capacity)</AdminFieldLabel>
            <input
              type="number"
              value={editCapacity}
              onChange={(e) => setEditCapacity(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none transition-all text-icsn-navy"
              min="1"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-colors"
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

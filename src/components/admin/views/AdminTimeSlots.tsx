"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Plus, Trash2, Edit2, Loader2, Save, AlertCircle, Calendar } from 'lucide-react';
import { 
  AdminPanel, 
  AdminPanelHeader, 
  AdminPrimaryButton,
  AdminInfoBox,
  AdminDataTable,
  AdminToggle,
  AdminModal,
  AdminFieldLabel,
  AdminTimeRangePicker
} from '../admin-ui';
import { AdminService, supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { CLASS_CONFIG } from '@/config/constants';
import type { SessionTemplate } from '@/types';

type TimeSlot = SessionTemplate;

const WEEKDAYS = [
  { id: 1, label: 'จันทร์', short: 'จ.' },
  { id: 2, label: 'อังคาร', short: 'อ.' },
  { id: 3, label: 'พุธ', short: 'พ.' },
  { id: 4, label: 'พฤหัสบดี', short: 'พฤ.' },
  { id: 5, label: 'ศุกร์', short: 'ศ.' },
  { id: 6, label: 'เสาร์', short: 'ส.' },
  { id: 0, label: 'อาทิตย์', short: 'อา.' }
] as const;

function DayBadges({ days }: { days?: number[] | null }) {
  if (!days || days.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted text-muted-foreground rounded-full text-xs font-bold border border-border">
        <Calendar className="w-3 h-3 text-muted-foreground" />
        ทุกวันทำการ
      </span>
    );
  }

  const dayLabels = days
    .map(d => WEEKDAYS.find(w => w.id === d)?.short)
    .filter(Boolean);

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-icsn-teal rounded-full text-xs font-bold border border-teal-200">
      <Calendar className="w-3 h-3 text-icsn-teal" />
      เฉพาะ {dayLabels.join(', ')}
    </span>
  );
}

export function AdminTimeSlots() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('09.00 - 12.00');
  const [editCapacity, setEditCapacity] = useState('');
  const [editTrialCapacity, setEditTrialCapacity] = useState('');
  const [editDays, setEditDays] = useState<number[]>([]);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const data = await AdminService.getSessionTemplates();
      setSlots(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      toast.error(`Failed to load time slots: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();

    const channel = supabase
      .channel('realtime-admin-session-templates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_templates'
        },
        () => {
          fetchSlots();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSlots]);

  const handleSeedDefaults = async () => {
    setIsProcessing(true);
    try {
      await AdminService.addSessionTemplate('9.00 - 10.30', CLASS_CONFIG.DEFAULT_CAPACITY, 2);
      await AdminService.addSessionTemplate('11.00 - 12.30', CLASS_CONFIG.DEFAULT_CAPACITY, 2);
      await AdminService.addSessionTemplate('13.15 - 14.45', CLASS_CONFIG.DEFAULT_CAPACITY, 2);
      toast.success('เพิ่มค่าเริ่มต้นสำเร็จ');
      await fetchSlots();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      toast.error(`Error: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleDaySelection = (dayId: number) => {
    setEditDays(prev => 
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId].sort()
    );
  };

  const handleSave = async () => {
    if (!editLabel.trim()) return toast.error('กรุณาระบุช่วงเวลา');
    
    const cap = parseInt(editCapacity, 10);
    const trialCap = parseInt(editTrialCapacity, 10);

    if (!cap || cap < 1) return toast.error('กรุณาระบุความจุที่ถูกต้อง');
    if (isNaN(trialCap) || trialCap < 0) return toast.error('กรุณาระบุโควต้า Trial ที่ถูกต้อง');

    const dayOfWeekValue = editDays.length === 0 ? null : editDays;

    setIsProcessing(true);
    try {
      if (editingId) {
        await AdminService.updateSessionTemplate(editingId, {
          time_label: editLabel.trim(),
          capacity: cap,
          trial_capacity: trialCap,
          day_of_week: dayOfWeekValue
        });
        toast.success('บันทึกการแก้ไขสำเร็จ');
      } else {
        await AdminService.addSessionTemplate(editLabel.trim(), cap, trialCap, dayOfWeekValue);
        toast.success('เพิ่มช่วงเวลาใหม่สำเร็จ');
      }
      setIsModalOpen(false);
      await fetchSlots();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึก';
      toast.error(`Error: ${msg}`);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบ';
      toast.error(`Error: ${msg}`);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ';
      toast.error(`Error: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const startEdit = (slot: TimeSlot) => {
    setEditingId(slot.id);
    setEditLabel(slot.time_label);
    setEditCapacity(String(slot.capacity));
    setEditTrialCapacity(String(slot.trial_capacity ?? 2));
    setEditDays(slot.day_of_week || []);
    setIsModalOpen(true);
  };

  const startAdd = () => {
    setEditingId(null);
    setEditLabel('09.00 - 12.00');
    setEditCapacity(String(CLASS_CONFIG.DEFAULT_CAPACITY));
    setEditTrialCapacity('2');
    setEditDays([]);
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
                ช่วงเวลาที่ตั้งค่าในหน้านี้ จะถูกใช้เป็น <strong>ค่าตั้งต้น (Default)</strong> เมื่อมีการเพิ่มวันเรียนใหม่<br />
                สามารถระบุเฉพาะวันในสัปดาห์ได้ (เช่น รอบ 9.00-12.00 น. เฉพาะวันอังคาร) โดยไม่ต้องคอยเปิด/ปิดทีละวัน
              </>
            }
            icon={AlertCircle}
          />

          <AdminDataTable
            headers={[
              { label: 'ช่วงเวลา (Time Label)' },
              { label: 'วันในสัปดาห์', align: 'center' },
              { label: 'ความจุรวม', align: 'center' },
              { label: 'โควต้า Trial', align: 'center' },
              { label: 'สถานะ', align: 'center' },
              { label: 'จัดการ', align: 'right' },
            ]}
          >
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-icsn-teal" />
                </td>
              </tr>
            ) : slots.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  <p className="mb-4">ยังไม่มีข้อมูลช่วงเวลาเรียน</p>
                  <button 
                    onClick={handleSeedDefaults} 
                    disabled={isProcessing} 
                    className="px-6 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-bold transition"
                  >
                    เพิ่มค่าเริ่มต้น (9.00, 11.00, 13.15)
                  </button>
                </td>
              </tr>
            ) : (
              slots.map((slot) => (
                <tr 
                  key={slot.id} 
                  className={`hover:bg-muted/30 transition-colors ${!slot.is_active ? 'opacity-60' : ''}`}
                >
                  <td className="px-6 py-4">
                    <p className="font-bold text-icsn-navy">{slot.time_label}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <DayBadges days={slot.day_of_week} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center min-w-[2.5rem] h-7 bg-muted text-foreground rounded-full text-sm font-bold border border-border">
                      {slot.capacity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center min-w-[2.5rem] h-7 bg-purple-50 text-purple-700 rounded-full text-sm font-bold border border-purple-200">
                      {slot.trial_capacity ?? 0}
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
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-info hover:bg-info/10 transition-colors border border-transparent hover:border-info/30"
                      >
                        <Edit2 className="w-4 h-4" /> แก้ไข
                      </button>
                      <button 
                        onClick={() => handleDelete(slot.id)} 
                        disabled={isProcessing} 
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-error hover:bg-error/10 transition-colors border border-transparent hover:border-error/30 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" /> ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))
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
            <div className="pt-1">
              <AdminTimeRangePicker
                value={editLabel || '09.00 - 12.00'}
                onChange={setEditLabel}
              />
            </div>
          </div>

          <div>
            <AdminFieldLabel>แสดงเฉพาะวันในสัปดาห์ (Applicable Days)</AdminFieldLabel>
            <p className="text-xs text-muted-foreground mb-2.5">
              หากไม่เลือกวันใดเลย ระบบจะถือว่าใช้กับ <strong>ทุกวันทำการ</strong> (Default)
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEditDays([])}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  editDays.length === 0
                    ? 'bg-icsn-teal text-white border-icsn-teal shadow-sm'
                    : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                ทุกวันทำการ
              </button>
              {WEEKDAYS.map((day) => {
                const isSelected = editDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDaySelection(day.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-icsn-teal text-white border-icsn-teal shadow-sm'
                        : 'bg-white text-icsn-navy border-border hover:border-icsn-teal/40'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <AdminFieldLabel>ความจุรวม (Total)</AdminFieldLabel>
              <input
                type="number"
                value={editCapacity}
                onChange={(e) => setEditCapacity(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none transition-all text-icsn-navy"
                min="1"
              />
            </div>
            <div>
              <AdminFieldLabel>โควต้า Trial (จำกัด)</AdminFieldLabel>
              <input
                type="number"
                value={editTrialCapacity}
                onChange={(e) => setEditTrialCapacity(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none transition-all text-icsn-navy"
                min="0"
              />
            </div>
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

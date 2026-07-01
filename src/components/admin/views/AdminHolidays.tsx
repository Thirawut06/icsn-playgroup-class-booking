"use client";

import React, { useState, useEffect } from 'react';
import { CalendarCog, Plus, Trash2, Loader2, AlertTriangle, CalendarX } from 'lucide-react';
import { AdminService, supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { COPY } from '@/config/copy';
import { 
  AdminFieldLabel, 
  AdminPanel, 
  AdminPanelHeader,
  AdminPrimaryButton,
  AdminDataTable,
  AdminModal
} from '../admin-ui';

interface SchoolClosure {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
}

export function AdminHolidays() {
  const [closures, setClosures] = useState<SchoolClosure[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchClosures();
  }, []);

  const fetchClosures = async () => {
    setLoading(true);
    try {
      const data = await AdminService.getSchoolClosures();
      setClosures(data);
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!startDate || !endDate || !reason) {
      toast.error("กรุณากรอกวันที่เริ่มต้น สิ้นสุด และเหตุผลให้ครบถ้วน");
      return;
    }
    
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น");
      return;
    }

    if (!confirm(`ยืนยันการตั้งค่าวันหยุดยาวตั้งแต่วันที่ ${startDate} ถึง ${endDate} ?\n\nคำเตือน: ระบบจะทำการยกเลิกคลาสที่ถูกจองไว้ในช่วงเวลานี้ และคืนเครดิตให้ผู้ปกครองโดยอัตโนมัติ (สำหรับลูกค้าโอนเงินสด แอดมินต้องทำการโอนคืนเอง)`)) {
      return;
    }

    setAdding(true);
    try {
      await AdminService.bulkCloseDays(startDate, endDate, reason);
      toast.success("ตั้งค่าวันหยุดยาวเรียบร้อย ระบบได้ยกเลิกและคืนเครดิตให้ลูกค้าที่มีแพ็กเกจแล้ว");
      setStartDate('');
      setEndDate('');
      setReason('');
      setIsModalOpen(false);
      await fetchClosures();
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(err instanceof Error ? err.message : String(err)));
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    const closure = closures.find(c => c.id === id);
    if (!closure) return;

    if (!confirm('ยืนยันลบรายการวันหยุดยาวนี้? (การลบจะไม่ดึงคลาสที่ถูกยกเลิกไปแล้วกลับมา)')) return;
    try {
      // 1. ลบจาก school_closures
      const { error } = await supabase.from('school_closures').delete().eq('id', id);
      if (error) throw error;

      // 2. ปลดล็อค session กลับเป็นปกติ (is_active = true, theme = null) 
      // โดยข้ามเสาร์-อาทิตย์ เพื่อให้สามารถเปิดจองได้ใหม่
      try {
        await AdminService.bulkReopenDays(closure.start_date, closure.end_date);
        toast.success("ลบรายการสำเร็จ และเปิดคลาสในช่วงเวลานี้ให้จองได้ตามปกติ");
      } catch (updateError) {
        console.error("Failed to reactivate sessions:", updateError);
        toast.error("ลบวันหยุดแล้ว แต่ไม่สามารถเปิดคลาสกลับมาได้อัตโนมัติ");
      }

      setClosures(curr => curr.filter(d => d.id !== id));
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(err instanceof Error ? err.message : String(err)));
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const today = new Date().toISOString().split('T')[0];
  
  // Sort closures: upcoming first, then by start_date desc
  const sortedClosures = [...closures].sort((a, b) => {
    const aUpcoming = a.end_date >= today;
    const bUpcoming = b.end_date >= today;
    if (aUpcoming && !bUpcoming) return -1;
    if (!aUpcoming && bUpcoming) return 1;
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPanel className="no-print">
        <AdminPanelHeader 
          icon={CalendarCog} 
          title="ตั้งค่าวันหยุด (Holidays & Closures)" 
          action={
            <AdminPrimaryButton onClick={() => setIsModalOpen(true)}>
              <Plus className="w-5 h-5 mr-1.5" />
              เพิ่มวันหยุดใหม่
            </AdminPrimaryButton>
          }
        />
        <div className="p-6">
          <AdminDataTable
            headers={[
              { label: 'ชื่อวันหยุด / สาเหตุ' },
              { label: 'ช่วงเวลา', align: 'center' },
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
            ) : sortedClosures.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                  <p>ยังไม่มีข้อมูลวันหยุด</p>
                </td>
              </tr>
            ) : (
              <>
                {sortedClosures.map(c => {
                  const isUpcoming = c.end_date >= today;
                  return (
                    <tr key={c.id} className={`hover:bg-muted/30 transition-colors ${!isUpcoming ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUpcoming ? 'bg-error/10 text-error' : 'bg-gray-200 text-gray-500'}`}>
                            <CalendarX className="w-4 h-4" />
                          </div>
                          <p className="font-bold text-icsn-navy">{c.reason}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium">
                        {c.start_date === c.end_date 
                          ? formatDisplayDate(c.start_date)
                          : `${formatDisplayDate(c.start_date)} - ${formatDisplayDate(c.end_date)}`}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${
                          isUpcoming ? 'bg-warning/10 text-warning border border-warning/20' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isUpcoming ? 'กำลังจะมาถึง' : 'ผ่านมาแล้ว'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isUpcoming ? (
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleRemove(c.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
                            >
                              <Trash2 className="w-4 h-4" /> ลบ
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </>
            )}
          </AdminDataTable>
        </div>
      </AdminPanel>

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => !adding && setIsModalOpen(false)}
        title="เพิ่มวันหยุดใหม่ (Add Holiday)"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <AdminFieldLabel>วันที่เริ่มต้น (Start Date)</AdminFieldLabel>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  if (!endDate || e.target.value > endDate) setEndDate(e.target.value);
                }}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none transition-all text-icsn-navy"
              />
            </div>
            <div>
              <AdminFieldLabel>ถึงวันที่ (End Date)</AdminFieldLabel>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none transition-all text-icsn-navy"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">💡 หากต้องการหยุดเพียงวันเดียว ให้เลือกวันที่เริ่มต้นและสิ้นสุดเป็นวันเดียวกัน</p>
          
          <div className="pt-2">
            <AdminFieldLabel>สาเหตุ / ชื่อวันหยุด (Reason)</AdminFieldLabel>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="เช่น ปิดเทอมซัมเมอร์, วันหยุดสงกรานต์..."
              className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none transition-all text-icsn-navy"
            />
          </div>
          
          <div className="flex items-center gap-2 mt-4 text-warning font-bold text-xs bg-warning/10 p-3 rounded-lg border border-warning/20">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>คำเตือน: การสั่งปิดจะส่งผลทันที และระบบจะคืนเครดิตให้กับลูกค้าที่จองคลาสในช่วงเวลานี้อัตโนมัติ</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={adding}
              className="px-6 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleAdd}
              disabled={adding || !startDate || !endDate || !reason}
              className="flex items-center gap-2 px-8 py-2.5 bg-error hover:bg-error/90 text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0"
            >
              {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {adding ? 'กำลังบันทึก...' : 'บันทึกวันหยุด'}
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}

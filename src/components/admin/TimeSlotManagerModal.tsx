"use client";

import React, { useState, useEffect } from 'react';
import { X, Clock, Plus, Trash2, Edit2, Loader2, Check, X as XIcon } from 'lucide-react';
import { AdminService } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { SessionTemplate } from '@/types';
import { AdminFieldLabel } from './admin-ui';

interface TimeSlotManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TimeSlotManagerModal({ isOpen, onClose }: TimeSlotManagerModalProps) {
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newLabel, setNewLabel] = useState('');
  const [newCapacity, setNewCapacity] = useState<number>(12);
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editCapacity, setEditCapacity] = useState<number>(12);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await AdminService.getSessionTemplates();
      setTemplates(data);
    } catch (err: any) {
      toast.error("Failed to load time slots: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const handleAdd = async () => {
    if (!newLabel.trim()) {
      toast.error('กรุณาระบุชื่อรอบเวลา');
      return;
    }
    if (newCapacity <= 0) {
      toast.error('จำนวนรับต้องมากกว่า 0');
      return;
    }
    
    setAdding(true);
    try {
      await AdminService.addSessionTemplate(newLabel.trim(), newCapacity);
      toast.success('เพิ่มรอบเวลาพื้นฐานเรียบร้อย');
      setNewLabel('');
      setNewCapacity(12);
      await fetchTemplates();
    } catch (err: any) {
      toast.error("บันทึกไม่สำเร็จ: " + err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await AdminService.updateSessionTemplate(id, { is_active: !currentActive });
      setTemplates(curr => 
        curr.map(t => t.id === id ? { ...t, is_active: !currentActive } : t)
      );
      toast.success(`อัปเดตสถานะเป็น ${!currentActive ? 'เปิดใช้งาน' : 'ปิดการใช้งาน'} แล้ว`);
    } catch (err: any) {
      toast.error("อัปเดตไม่สำเร็จ: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันลบรอบเวลานี้ออก? (จะไม่กระทบกับคลาสที่ถูกสร้างไปแล้ว แต่จะไม่มีรอบนี้ในอนาคต)')) return;
    try {
      await AdminService.deleteSessionTemplate(id);
      setTemplates(curr => curr.filter(t => t.id !== id));
      toast.success('ลบรอบเวลาเรียบร้อย');
    } catch (err: any) {
      toast.error("ลบไม่สำเร็จ: " + err.message);
    }
  };

  const startEdit = (template: SessionTemplate) => {
    setEditingId(template.id);
    setEditLabel(template.time_label);
    setEditCapacity(template.capacity);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditLabel('');
  };

  const saveEdit = async (id: string) => {
    if (!editLabel.trim() || editCapacity <= 0) {
      toast.error('ข้อมูลไม่ถูกต้อง');
      return;
    }
    try {
      await AdminService.updateSessionTemplate(id, { time_label: editLabel.trim(), capacity: editCapacity });
      toast.success('อัปเดตข้อมูลเรียบร้อย');
      setTemplates(curr => curr.map(t => t.id === id ? { ...t, time_label: editLabel.trim(), capacity: editCapacity } : t));
      setEditingId(null);
    } catch (err: any) {
      toast.error("บันทึกไม่สำเร็จ: " + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-2xl bg-white rounded-2xl shadow-2xl z-50 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center text-info">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">จัดการรอบเวลา (Session Templates)</h2>
              <p className="text-sm text-muted-foreground">รอบเวลาที่ถูกตั้งไว้จะใช้เป็นค่าเริ่มต้นสำหรับสร้างคลาสในอนาคต</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted/80 rounded-full transition-colors text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/50">
          
          {/* Add Form */}
          <div className="bg-white p-5 border border-border rounded-xl shadow-sm mb-6">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-info" /> เพิ่มรอบเวลาใหม่
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-[2] min-w-[200px]">
                <AdminFieldLabel>ชื่อรอบ / ช่วงเวลา</AdminFieldLabel>
                <input
                  type="text"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="เช่น เช้า (09:00 - 10:30)"
                  className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-info/20 focus:border-info outline-none transition-all"
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <AdminFieldLabel>จำนวนรับ (คน)</AdminFieldLabel>
                <input
                  type="number"
                  min="1"
                  value={newCapacity}
                  onChange={e => setNewCapacity(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-info/20 focus:border-info outline-none transition-all"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={adding || !newLabel.trim() || newCapacity <= 0}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-info hover:bg-info text-white font-bold rounded-lg text-sm shadow-sm transition-all disabled:opacity-50 sm:w-auto w-full"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                เพิ่มรอบ
              </button>
            </div>
          </div>

          {/* List */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3">รอบเวลาปัจจุบัน ({templates.length})</h3>
            
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-info" />
              </div>
            ) : templates.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border bg-white rounded-xl text-muted-foreground">
                ยังไม่มีการตั้งค่ารอบเวลา
              </div>
            ) : (
              <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted border-b border-border text-sm">
                      <th className="px-5 py-3 font-bold text-muted-foreground">ชื่อรอบเวลา</th>
                      <th className="px-5 py-3 font-bold text-muted-foreground text-center">จำนวนรับ</th>
                      <th className="px-5 py-3 font-bold text-muted-foreground text-center w-28">สถานะ</th>
                      <th className="px-5 py-3 font-bold text-muted-foreground text-right w-24">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {templates.map(template => (
                      <tr key={template.id} className="hover:bg-muted/80/50 transition-colors group">
                        
                        {editingId === template.id ? (
                          // Edit Mode
                          <>
                            <td className="px-5 py-3">
                              <input
                                type="text"
                                value={editLabel}
                                onChange={e => setEditLabel(e.target.value)}
                                className="w-full px-3 py-1.5 border border-info/30 rounded text-sm focus:outline-none focus:ring-1 focus:ring-info"
                              />
                            </td>
                            <td className="px-5 py-3">
                              <input
                                type="number"
                                min="1"
                                value={editCapacity}
                                onChange={e => setEditCapacity(parseInt(e.target.value) || 0)}
                                className="w-20 mx-auto px-3 py-1.5 border border-info/30 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-info"
                              />
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className="text-xs text-muted-foreground/70">-</span>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => saveEdit(template.id)} className="p-1.5 text-success hover:bg-success/10 rounded transition-colors" title="บันทึก">
                                  <Check className="w-4 h-4" />
                                </button>
                                <button onClick={cancelEdit} className="p-1.5 text-muted-foreground/70 hover:bg-muted/80 hover:text-muted-foreground rounded transition-colors" title="ยกเลิก">
                                  <XIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          // View Mode
                          <>
                            <td className="px-5 py-4">
                              <p className={`font-bold ${template.is_active ? 'text-foreground' : 'text-muted-foreground/70'}`}>
                                {template.time_label}
                              </p>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className="inline-flex items-center justify-center min-w-[2.5rem] h-7 rounded-full bg-info/10 text-info font-bold text-sm">
                                {template.capacity}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <button
                                onClick={() => handleToggleActive(template.id, template.is_active)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-info focus:ring-offset-2 ${
                                  template.is_active ? 'bg-success' : 'bg-muted'
                                }`}
                              >
                                <span className="sr-only">Toggle active</span>
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    template.is_active ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => startEdit(template)}
                                  className="p-2 text-muted-foreground/70 hover:text-info hover:bg-info/10 rounded-lg transition-colors"
                                  title="แก้ไข"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(template.id)}
                                  className="p-2 text-muted-foreground/70 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                                  title="ลบ"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </>
  );
}

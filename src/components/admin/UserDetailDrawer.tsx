"use client";

import React, { useState, useEffect } from 'react';
import { X, User, Phone, Baby, History, Loader2, CreditCard, CalendarDays, Ticket, Mail, FileText, Save } from 'lucide-react';
import { AdminService } from '@/lib/supabase';
import { formatDateShort } from '@/lib/utils';
import toast from 'react-hot-toast';

interface UserDetailDrawerProps {
  parentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailDrawer({ parentId, isOpen, onClose }: UserDetailDrawerProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (isOpen && parentId) {
      fetchDetails();
    }
  }, [isOpen, parentId]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const details = await AdminService.getUserFullDetails(parentId);
      setData(details);
      setAdminNotes((details?.admin_notes as string) || '');
    } catch (err: unknown) {
      toast.error("Failed to load user details: " + (err instanceof Error ? err.message : String(err)));
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await AdminService.updateAdminNotes(parentId, adminNotes);
      toast.success('บันทึก Note ของแอดมินเรียบร้อย');
    } catch (err: any) {
      toast.error('บันทึกไม่สำเร็จ: ' + err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" 
        onClick={onClose} 
      />
      
      <div className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-icsn-teal/10 flex items-center justify-center text-icsn-teal">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">รายละเอียดผู้ใช้งาน</h2>
              <p className="text-sm text-muted-foreground">ข้อมูลทั้งหมดที่เกี่ยวข้องกับผู้ใช้งานนี้</p>
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
        <div className="flex-1 overflow-y-auto p-6 bg-muted">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-icsn-teal" />
            </div>
          ) : data ? (
            <div className="space-y-6">
              
              {/* Parent Profile */}
              <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-icsn-navy" /> 
                  ข้อมูลผู้ปกครอง
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">ชื่อ-นามสกุล</p>
                    <p className="font-semibold text-foreground">{data.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">เบอร์โทรศัพท์</p>
                    <p className="font-semibold text-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3 text-muted-foreground/70" />
                      {data.phone}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1 min-w-0">
                    <p className="text-sm text-muted-foreground mb-1">อีเมล</p>
                    <p className="font-semibold text-foreground flex items-center gap-1 break-all">
                      <Mail className="w-3 h-3 shrink-0 text-muted-foreground/70" />
                      {data.email || '-'}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-sm text-muted-foreground mb-1">วันที่สมัคร</p>
                    <p className="font-medium text-foreground">{formatDateShort(data.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Children Profile */}
              {data.children && data.children.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Baby className="w-5 h-5 text-icsn-navy" /> 
                    ข้อมูลนักเรียน
                  </h3>
                  <div className="space-y-4">
                    {data.children.map((child: any) => (
                      <div key={child.id} className="bg-muted rounded-xl p-4 border border-border">
                        <div className="flex items-center gap-3 mb-4">
                          {child.photo_url ? (
                            <img src={child.photo_url} alt="Child" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm">
                              {child.nickname?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-foreground text-lg">{child.nickname}</p>
                            <p className="text-sm text-muted-foreground">{child.full_name}</p>
                          </div>
                        </div>
                        
                        {child.parent_photo_url && (
                          <div className="mb-4">
                            <p className="text-xs text-muted-foreground mb-1">รูปถ่ายคู่ผู้ปกครอง</p>
                            <img src={child.parent_photo_url} alt="Parent & Child" className="h-24 w-auto rounded-lg object-cover border border-border" />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">อายุ</p>
                            <p className="font-medium">{child.age} ขวบ</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">วันเกิด</p>
                            <p className="font-medium">{child.dob ? formatDateShort(child.dob) : '-'}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-muted-foreground">อาหารที่แพ้</p>
                            <p className="font-medium text-error">{child.food_allergy || 'ไม่มี'}</p>
                          </div>
                          {child.special_info && (
                            <div className="col-span-2">
                              <p className="text-muted-foreground">ข้อมูลพิเศษ</p>
                              <p className="font-medium">{child.special_info}</p>
                            </div>
                          )}
                          <div className="col-span-2 flex gap-4 mt-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${child.media_perm ? 'bg-success/10 text-success' : 'bg-muted text-foreground'}`}>
                              {child.media_perm ? '✅ อนุญาตถ่ายสื่อ' : '❌ ไม่อนุญาตถ่ายสื่อ'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Packages & Credits */}
              <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-icsn-navy" /> 
                  แพ็กเกจ และ เครดิต
                </h3>
                {data.packages && data.packages.length > 0 ? (
                  <div className="space-y-3">
                    {data.packages.map((pkg: any) => (
                      <div key={pkg.id} className="flex items-center justify-between p-3 bg-info/10 rounded-xl border border-info/20">
                        <div>
                          <p className="font-bold text-foreground">{pkg.type === 'trial' ? 'ทดลองเรียน (Trial)' : 'แพ็กเกจเรียน (Payment)'}</p>
                          <p className="text-xs text-muted-foreground">ซื้อเมื่อ: {formatDateShort(pkg.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-icsn-teal">{pkg.credits_remaining}</p>
                          <p className="text-xs text-muted-foreground">เครดิตคงเหลือ</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4 bg-muted rounded-xl">ไม่พบประวัติแพ็กเกจ (Walk-in)</p>
                )}

                {data.credit_transactions && data.credit_transactions.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-bold text-foreground mb-3 text-sm flex items-center gap-2">
                      <History className="w-4 h-4" /> ประวัติเครดิตล่าสุด
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {data.credit_transactions.sort((a:any, b:any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5).map((log: any) => (
                        <div key={log.id} className="flex justify-between items-center text-sm p-2 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium text-foreground">{log.notes || log.action_type}</p>
                            <p className="text-xs text-muted-foreground">{formatDateShort(log.created_at)}</p>
                          </div>
                          <span className={`font-bold ${log.amount > 0 ? 'text-success' : 'text-error'}`}>
                            {log.amount > 0 ? '+' : ''}{log.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bookings */}
              <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-icsn-navy" /> 
                  ประวัติการจองคลาส
                </h3>
                {data.bookings && data.bookings.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {data.bookings.sort((a:any, b:any) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()).map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 border border-border rounded-xl">
                        <div>
                          <p className="font-bold text-foreground">{formatDateShort(booking.session_date)}</p>
                          <p className="text-xs text-muted-foreground">{booking.sessions?.time_label || '09:30 - 11:30'}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            booking.status === 'confirmed' ? 'bg-success/10 text-success' : 
                            booking.status === 'cancelled' ? 'bg-error/10 text-error' : 'bg-muted text-foreground'
                          }`}>
                            {booking.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4 bg-muted rounded-xl">ไม่พบประวัติการจอง</p>
                )}
              </div>

              {/* Admin Notes */}
              <div className="bg-warning/10 rounded-2xl p-5 border border-warning/20 shadow-sm">
                <h3 className="text-lg font-bold text-warning mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" /> 
                    โน้ตสำหรับแอดมิน (Admin Notes)
                  </div>
                </h3>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="พิมพ์ข้อความบันทึกช่วยจำสำหรับแอดมินด้วยกัน..."
                  className="w-full h-24 p-3 border border-warning/30 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-warning/50 resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="flex items-center gap-1 bg-warning hover:bg-warning text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                  >
                    {savingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    บันทึกโน้ต
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center text-muted-foreground mt-10">ไม่พบข้อมูล</div>
          )}
        </div>
      </div>
    </>
  );
}

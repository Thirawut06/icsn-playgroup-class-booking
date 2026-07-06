"use client";

import React, { useState, useEffect } from 'react';
import { X, User, Phone, Baby, History, Loader2, CreditCard, CalendarDays, Ticket, Mail, FileText, Save } from 'lucide-react';
import { AdminService } from '@/lib/supabase';
import { formatDateShort } from '@/lib/utils';
import toast from 'react-hot-toast';

function formatAgeYMD(dobString: string): string {
  if (!dobString) return '-';
  const dob = new Date(dobString);
  const today = new Date();
  
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();
  
  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  const parts = [];
  if (years > 0) parts.push(`${years} ปี`);
  if (months > 0) parts.push(`${months} เดือน`);
  if (days > 0) parts.push(`${days} วัน`);
  
  return parts.length > 0 ? parts.join(' ') : '0 วัน';
}

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
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-white">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-icsn-teal" />
            </div>
          ) : data ? (
            <div className="space-y-8">
              
              {/* Children Profile */}
              {data.children && data.children.length > 0 && (
                <div className="border-b border-border pb-8">
                  <h3 className="text-base font-bold text-foreground mb-6 flex items-center gap-2">
                    <Baby className="w-5 h-5 text-icsn-navy" /> 
                    ข้อมูลนักเรียน
                  </h3>
                  <div className="space-y-8">
                    {data.children.map((child: any) => (
                      <div key={child.id} className="relative">
                        
                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 mb-5">
                          <div className="flex items-center gap-4">
                            {child.photo_url ? (
                              <img src={child.photo_url} alt="Child" className="w-16 h-16 rounded-full object-cover border border-border shadow-sm" />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-info/10 text-info flex items-center justify-center font-semibold text-2xl border border-border shadow-sm">
                                {child.nickname?.[0]?.toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-foreground text-lg">{child.full_name}</p>
                              <p className="text-base text-muted-foreground">น้อง{child.nickname}</p>
                            </div>
                          </div>
                          
                          {child.parent_photo_url && (
                            <div className="flex flex-col items-end shrink-0">
                              <img src={child.parent_photo_url} alt="Parent & Child" className="h-32 w-auto rounded-lg object-cover border-2 border-muted shadow-sm" />
                              <p className="text-sm text-muted-foreground mt-2 font-medium">รูปถ่ายคู่ผู้ปกครอง</p>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-base">
                          <div className="flex items-center">
                            <span className="text-muted-foreground w-24">อายุ:</span>
                            <span className="font-medium text-foreground">{formatAgeYMD(child.dob)}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-muted-foreground w-24">วันเกิด:</span>
                            <span className="font-medium text-foreground">{child.dob ? formatDateShort(child.dob) : '-'}</span>
                          </div>
                          <div className="flex items-center sm:col-span-2">
                            <span className="text-muted-foreground w-24">อาหารที่แพ้:</span>
                            <span className="font-medium text-error">{child.food_allergy || 'ไม่มี'}</span>
                          </div>
                          {child.special_info && (
                            <div className="flex items-start sm:col-span-2">
                              <span className="text-muted-foreground w-24 shrink-0">ข้อมูลพิเศษ:</span>
                              <span className="font-medium text-foreground">{child.special_info}</span>
                            </div>
                          )}
                          <div className="sm:col-span-2 mt-2 flex flex-wrap gap-2">
                            <span className={`inline-flex px-3 py-1 rounded text-sm font-medium ${child.media_perm ? 'bg-success/10 text-success' : 'bg-muted text-foreground'}`}>
                              {child.media_perm ? '✅ อนุญาตถ่ายสื่อลง Social' : '❌ ไม่อนุญาตถ่ายสื่อ'}
                            </span>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Parent Profile */}
              <div className="border-b border-border pb-8">
                <h3 className="text-base font-bold text-foreground mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-icsn-navy" /> 
                  ข้อมูลผู้ปกครอง
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-base">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground mb-1">ชื่อ-นามสกุล</span>
                    <span className="font-medium text-foreground">{data.name}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground mb-1">เบอร์โทรศัพท์</span>
                    <span className="font-medium text-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground/70" />
                      {data.phone}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground mb-1">อีเมล</span>
                    <span className="font-medium text-foreground flex items-center gap-2 break-all">
                      <Mail className="w-4 h-4 shrink-0 text-muted-foreground/70" />
                      {data.email || '-'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground mb-1">วันที่สมัคร</span>
                    <span className="font-medium text-foreground">{formatDateShort(data.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Packages & Credits */}
              <div className="border-b border-border pb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-icsn-navy" /> 
                    แพ็กเกจ และ เครดิต
                  </h3>
                  {data.packages && data.packages.length > 0 && (
                    <div className="text-right bg-icsn-teal/10 px-3 py-1 rounded-full">
                      <span className="text-sm font-medium text-icsn-navy mr-2">ยอดรวมทั้งหมด</span>
                      <span className="text-base font-bold text-icsn-teal">
                        {data.packages.reduce((sum: number, pkg: any) => sum + (pkg.credits_remaining || 0), 0)} เครดิต
                      </span>
                    </div>
                  )}
                </div>
                {data.packages && data.packages.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    {data.packages.map((pkg: any) => (
                      <div key={pkg.id} className="flex items-center justify-between border-l-4 border-info pl-4 py-1">
                        <div>
                          <p className="font-medium text-foreground text-base">
                            {pkg.type === 'trial' ? '✅ แพ็กเกจทดลองเรียน (Trial)' : `💎 สมัครแพ็กเกจ: ${pkg.type}`}
                          </p>
                          <p className="text-sm text-muted-foreground">ทำรายการเมื่อ: {formatDateShort(pkg.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${pkg.credits_remaining > 0 ? 'text-icsn-teal' : 'text-muted-foreground'}`}>
                            {pkg.credits_remaining > 0 ? '+' : ''}{pkg.credits_remaining} เครดิต
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-base text-muted-foreground mb-6">ไม่พบประวัติแพ็กเกจ (Walk-in)</p>
                )}

                {data.credit_transactions && data.credit_transactions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-4 text-sm flex items-center gap-2">
                      <History className="w-4 h-4" /> ประวัติเครดิตล่าสุด
                    </h4>
                    <div className="space-y-3">
                      {data.credit_transactions.sort((a:any, b:any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5).map((log: any) => (
                        <div key={log.id} className="flex justify-between items-start text-base border-b border-border/50 pb-3 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium text-foreground">{log.notes || log.action_type}</p>
                            <p className="text-sm text-muted-foreground">{formatDateShort(log.created_at)}</p>
                          </div>
                          <span className={`font-semibold ${log.amount > 0 ? 'text-success' : 'text-error'}`}>
                            {log.amount > 0 ? '+' : ''}{log.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bookings */}
              <div className="border-b border-border pb-8">
                <h3 className="text-base font-bold text-foreground mb-6 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-icsn-navy" /> 
                  ประวัติการจองคลาส
                </h3>
                {data.bookings && data.bookings.length > 0 ? (
                  <div className="space-y-4">
                    {data.bookings.sort((a:any, b:any) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()).map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between border-l-4 border-muted pl-4 py-1">
                        <div>
                          <p className="font-medium text-foreground text-base">
                            {formatDateShort(booking.session_date)}
                            <span className="text-muted-foreground font-normal mx-2">&middot;</span>
                            <span className="text-sm text-muted-foreground font-normal">
                              {booking.sessions?.time_label || '09:30 - 11:30'}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded text-sm font-medium ${
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
                  <p className="text-base text-muted-foreground">ไม่พบประวัติการจอง</p>
                )}
              </div>

              {/* Admin Notes */}
              <div>
                <h3 className="text-base font-bold text-warning mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" /> 
                  โน้ตสำหรับแอดมิน (Admin Notes)
                </h3>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="พิมพ์ข้อความบันทึกช่วยจำสำหรับแอดมินด้วยกัน..."
                  className="w-full h-32 p-4 border border-warning/50 rounded-lg bg-warning/5 text-base focus:outline-none focus:ring-2 focus:ring-warning/50 resize-none"
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="flex items-center gap-2 bg-warning hover:bg-warning text-white px-6 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
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

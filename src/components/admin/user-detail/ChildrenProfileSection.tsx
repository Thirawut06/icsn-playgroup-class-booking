import React, { useState } from 'react';
import { Baby, Loader2, Check, X, Pencil } from 'lucide-react';
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

interface ChildrenProfileSectionProps {
  childrenData: any[];
  onRefresh: () => void;
}

export function ChildrenProfileSection({ childrenData, onRefresh }: ChildrenProfileSectionProps) {
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editChildFullName, setEditChildFullName] = useState('');
  const [editChildNickname, setEditChildNickname] = useState('');
  const [savingChild, setSavingChild] = useState(false);

  const handleSaveChildName = async (childId: string) => {
    if (!editChildFullName.trim() || !editChildNickname.trim()) {
      toast.error('กรุณากรอกชื่อจริงและชื่อเล่นให้ครบ');
      return;
    }
    if (editChildFullName.trim().split(/\s+/).length < 2) {
      toast.error('กรุณากรอกทั้งชื่อและนามสกุล (เว้นวรรคระหว่างชื่อและนามสกุล)');
      return;
    }
    setSavingChild(true);
    try {
      await AdminService.updateChildName(childId, editChildFullName.trim(), editChildNickname.trim());
      toast.success('อัปเดตชื่อนักเรียนเรียบร้อย');
      setEditingChildId(null);
      onRefresh();
    } catch (err: any) {
      toast.error('อัปเดตไม่สำเร็จ: ' + err.message);
    } finally {
      setSavingChild(false);
    }
  };

  if (!childrenData || childrenData.length === 0) return null;

  return (
    <div className="border-b border-border pb-8">
      <h3 className="text-base font-bold text-foreground mb-6 flex items-center gap-2">
        <Baby className="w-5 h-5 text-icsn-navy" /> 
        ข้อมูลนักเรียน
      </h3>
      <div className="space-y-8">
        {childrenData.map((child: any) => (
          <div key={child.id} className="relative">
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-4">
                {child.photo_url ? (
                  <img src={child.photo_url} alt="Child" loading="lazy" className="w-16 h-16 rounded-full object-cover border border-border shadow-sm" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-info/10 text-info flex items-center justify-center font-semibold text-2xl border border-border shadow-sm">
                    {child.nickname?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  {editingChildId === child.id ? (
                    <div className="flex flex-col gap-2">
                      <input 
                        type="text" 
                        value={editChildFullName}
                        onChange={(e) => setEditChildFullName(e.target.value)}
                        className="border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-icsn-teal"
                        placeholder="ชื่อ-นามสกุลจริง"
                      />
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          value={editChildNickname}
                          onChange={(e) => setEditChildNickname(e.target.value)}
                          className="border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-icsn-teal w-24"
                          placeholder="ชื่อเล่น"
                        />
                        <button 
                          onClick={() => handleSaveChildName(child.id)}
                          disabled={savingChild}
                          className="bg-icsn-teal text-white p-1 rounded hover:bg-icsn-teal/90 disabled:opacity-50 ml-1"
                        >
                          {savingChild ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => setEditingChildId(null)}
                          className="bg-muted text-foreground p-1 rounded hover:bg-muted/80 ml-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <div>
                        <p className="font-semibold text-foreground text-lg">
                          {child.full_name} ({child.nickname})
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          setEditingChildId(child.id);
                          setEditChildFullName(child.full_name);
                          setEditChildNickname(child.nickname);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-icsn-teal hover:bg-icsn-teal/10 rounded transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {child.parent_photo_url && (
                <div className="flex flex-col items-end shrink-0">
                  <img src={child.parent_photo_url} alt="Parent & Child" loading="lazy" className="h-32 w-auto rounded-lg object-cover border-2 border-muted shadow-sm" />
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
  );
}

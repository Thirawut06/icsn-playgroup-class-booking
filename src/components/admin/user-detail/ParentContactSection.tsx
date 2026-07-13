import React, { useState } from 'react';
import { User, Phone, Mail, Pencil, X, Check, Loader2 } from 'lucide-react';
import { AdminService } from '@/lib/supabase';
import { formatDateShort } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ParentContactSectionProps {
  parentId: string;
  data: any;
  onRefresh: () => void;
}

export function ParentContactSection({ parentId, data, onRefresh }: ParentContactSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editName.trim()) return;
    if (editName.trim().split(/\s+/).length < 2) {
      toast.error('กรุณากรอกทั้งชื่อและนามสกุล (เว้นวรรคระหว่างชื่อและนามสกุล)');
      return;
    }
    setSaving(true);
    try {
      await AdminService.updateParentName(parentId, editName.trim());
      toast.success('อัปเดตชื่อผู้ปกครองเรียบร้อย');
      setIsEditing(false);
      onRefresh();
    } catch (err: any) {
      toast.error('อัปเดตไม่สำเร็จ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-b border-border pb-8">
      <h3 className="text-base font-bold text-foreground mb-6 flex items-center gap-2">
        <User className="w-5 h-5 text-icsn-navy" /> 
        ข้อมูลผู้ปกครอง
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-base">
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1">ชื่อ-นามสกุล</span>
          {isEditing ? (
            <div className="flex items-center gap-2 mt-1">
              <input 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-icsn-teal flex-1"
                placeholder="ชื่อผู้ปกครอง"
              />
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-icsn-teal text-white p-1 rounded hover:bg-icsn-teal/90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="bg-muted text-foreground p-1 rounded hover:bg-muted/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{data.name}</span>
              <button 
                onClick={() => {
                  setIsEditing(true);
                  setEditName(data.name);
                }}
                className="p-1 text-muted-foreground hover:text-icsn-teal hover:bg-icsn-teal/10 rounded transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
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
  );
}

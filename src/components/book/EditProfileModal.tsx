import React, { useState, useEffect } from 'react';
import { X, User, Baby, Loader2, Save, Pencil } from 'lucide-react';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import { useBookingContext } from './BookingContext';
import { ParentService } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { dict } = useDictionary();
  const { parentId, parentName, children, refreshData } = useBookingContext();

  const [editParentName, setEditParentName] = useState(parentName);
  const [editChildren, setEditChildren] = useState(
    children.map(c => ({ id: c.id, full_name: c.full_name, nickname: c.nickname }))
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditParentName(parentName);
      setEditChildren(children.map(c => ({ id: c.id, full_name: c.full_name, nickname: c.nickname })));
    }
  }, [isOpen, parentName, children]);

  const handleChildChange = (id: string, field: 'full_name' | 'nickname', value: string) => {
    setEditChildren(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSave = async () => {
    if (!editParentName.trim()) {
      toast.error('กรุณาระบุชื่อผู้ปกครอง');
      return;
    }
    if (editParentName.trim().split(/\s+/).length < 2) {
      toast.error('กรุณากรอกทั้งชื่อและนามสกุลของผู้ปกครอง (เว้นวรรคระหว่างชื่อและนามสกุล)');
      return;
    }
    for (const c of editChildren) {
      if (!c.full_name.trim() || !c.nickname.trim()) {
        toast.error('กรุณาระบุชื่อจริงและชื่อเล่นของนักเรียนให้ครบถ้วน');
        return;
      }
      if (c.full_name.trim().split(/\s+/).length < 2) {
        toast.error('กรุณากรอกทั้งชื่อและนามสกุลของนักเรียน (เว้นวรรคระหว่างชื่อและนามสกุล)');
        return;
      }
    }

    setIsSaving(true);
    try {
      // Check if parent name changed
      if (editParentName.trim() !== parentName) {
        await ParentService.updateParentName(parentId, editParentName.trim());
      }

      // Check if children changed
      for (const editChild of editChildren) {
        const originalChild = children.find(c => c.id === editChild.id);
        if (
          originalChild &&
          (originalChild.full_name !== editChild.full_name.trim() || originalChild.nickname !== editChild.nickname.trim())
        ) {
          await ParentService.updateChildName(editChild.id, editChild.full_name.trim(), editChild.nickname.trim());
        }
      }

      toast.success('บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว');
      await refreshData(false);
      onClose();
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => !isSaving && onClose()}></div>
      <div className="bg-white rounded-3xl w-[calc(100%-2rem)] max-w-lg mx-auto shadow-2xl relative z-10 overflow-hidden border border-border flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-icsn-navy/10 flex items-center justify-center text-icsn-navy shrink-0">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">เปลี่ยนชื่อบัญชีและชื่อนักเรียน</h2>
              <p className="text-sm text-muted-foreground mt-0.5">ระบุชื่อใหม่ที่ต้องการเปลี่ยนในช่องด้านล่าง</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isSaving}
            className="p-2 hover:bg-muted/80 rounded-full transition-colors text-muted-foreground disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Parent Name */}
            <div>
              <label className="block text-base font-bold text-foreground mb-2 flex items-center gap-2">
                <User className="w-5 h-5 text-icsn-navy" />
                ชื่อผู้ปกครอง (Account Name)
              </label>
              <input 
                type="text" 
                value={editParentName}
                onChange={(e) => setEditParentName(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-border rounded-xl focus:outline-none focus:border-icsn-teal transition-all text-base font-medium"
                placeholder="ชื่อ-นามสกุล ผู้ปกครอง"
              />
            </div>

            {/* Children Names */}
            {editChildren.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                  <Baby className="w-5 h-5 text-icsn-navy" />
                  ชื่อนักเรียน (Children)
                </h3>
                <div className="space-y-6">
                  {editChildren.map((child, index) => (
                    <div key={child.id} className="space-y-3">
                      <p className="text-sm font-bold text-icsn-teal">นักเรียนคนที่ {index + 1}</p>
                      
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">ชื่อ-นามสกุลจริง</label>
                        <input 
                          type="text" 
                          value={child.full_name}
                          onChange={(e) => handleChildChange(child.id, 'full_name', e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-border rounded-xl focus:outline-none focus:border-icsn-teal transition-all text-base font-medium"
                          placeholder="ระบุชื่อ-นามสกุลจริง"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">ชื่อเล่น</label>
                        <input 
                          type="text" 
                          value={child.nickname}
                          onChange={(e) => handleChildChange(child.id, 'nickname', e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-border rounded-xl focus:outline-none focus:border-icsn-teal transition-all text-base font-medium"
                          placeholder="ตัวอย่าง: ขุน (ไม่ต้องใส่คำว่า น้อง)"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/10 shrink-0">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-icsn-teal hover:bg-icsn-teal/90 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                บันทึกการเปลี่ยนแปลง
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

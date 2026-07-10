import React, { useState } from 'react';
import { FileText, Save, Loader2 } from 'lucide-react';
import { AdminService } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface AdminNotesSectionProps {
  parentId: string;
  initialNotes: string;
}

export function AdminNotesSection({ parentId, initialNotes }: AdminNotesSectionProps) {
  const [adminNotes, setAdminNotes] = useState(initialNotes || '');
  const [savingNotes, setSavingNotes] = useState(false);

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

  return (
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
  );
}

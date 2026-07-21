import React from 'react';
import { BellRing, Info } from 'lucide-react';
import { SystemSettings } from '@/lib/services/settings.service';
import { AdminFieldLabel } from '../admin-ui';

interface Props {
  settings: SystemSettings;
  setSettings: (settings: SystemSettings) => void;
}

export function AnnouncementsSection({ settings, setSettings }: Props) {
  return (
    <section className="bg-white border border-warning/20 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 bg-warning/5 border-b border-warning/10 flex items-center gap-3">
        <BellRing className="w-5 h-5 text-warning" />
        <div>
          <h3 className="font-bold text-icsn-navy">ประกาศหน้าแอป (Announcements)</h3>
        </div>
      </div>

      <div className="p-5">
        <div>
          <AdminFieldLabel>ข้อความประกาศแจ้งผู้ปกครอง (Announcement Text)</AdminFieldLabel>
          <textarea
            value={settings.announcement_text}
            onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
            placeholder="เช่น โรงเรียนหยุดทำการในวันศุกร์ที่ 12 เนื่องในวันหยุด..."
            rows={2}
            className="w-full mt-1.5 px-3 py-2 bg-white border border-border rounded-lg focus:ring-2 focus:ring-warning/30 focus:border-warning/50 outline-none text-sm transition-all resize-y text-icsn-navy"
          />
          <p className="text-xs text-muted-foreground mt-2">
            ข้อความนี้จะแสดงอยู่บนสุดของหน้าหลัก (แถบสีเหลือง) ฝั่งผู้ปกครอง <span className="font-bold">หากไม่ต้องการแสดงประกาศ ให้ลบข้อความออกให้หมด (เว้นว่างไว้)</span>
          </p>
        </div>
      </div>
    </section>
  );
}

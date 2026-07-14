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
    <section className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-warning/5 px-6 py-4 border-b border-warning/10 flex items-center gap-3">
        <div className="bg-warning/20 p-2 rounded-lg text-warning">
          <BellRing className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-icsn-navy text-lg">ประกาศหน้าแอป (Announcements)</h3>
          <p className="text-sm text-muted-foreground">ข้อความที่จะแสดงเด่นชัดให้ผู้ปกครองทุกคนเห็น</p>
        </div>
      </div>

      <div className="p-6">
        <div>
          <AdminFieldLabel>ข้อความประกาศแจ้งผู้ปกครอง (Announcement Text)</AdminFieldLabel>
          <textarea
            value={settings.announcement_text}
            onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
            placeholder="เช่น โรงเรียนหยุดทำการในวันศุกร์ที่ 12 เนื่องในวันหยุด..."
            rows={3}
            className="w-full mt-2 px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-warning/30 focus:border-warning/50 outline-none text-sm transition-all resize-none text-icsn-navy"
          />
          <div className="flex items-start gap-2 mt-3 p-3 bg-warning/5 rounded-lg border border-warning/10">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-warning" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              ข้อความนี้จะแสดงอยู่<span className="font-bold text-warning">บนสุดของหน้าหลัก (แถบสีเหลือง)</span> ในแอปพลิเคชันฝั่งผู้ปกครอง<br />
              หากไม่ต้องการแสดงประกาศ ให้ลบข้อความออกให้หมด (เว้นว่างไว้)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

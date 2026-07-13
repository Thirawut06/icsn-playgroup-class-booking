import React from 'react';
import { Clock, Info } from 'lucide-react';
import { SystemSettings } from '@/lib/services/settings.service';
import { AdminFieldLabel } from '../admin-ui';

interface Props {
  settings: SystemSettings;
  setSettings: (settings: SystemSettings) => void;
}

export function BookingRulesSection({ settings, setSettings }: Props) {
  return (
    <section className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-muted/40 px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="bg-icsn-teal/10 p-2 rounded-lg text-icsn-teal">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-icsn-navy text-lg">กฎการจอง (Booking Rules)</h3>
          <p className="text-sm text-muted-foreground">ตั้งค่าเงื่อนไขเวลาในการจองหรือยกเลิกคลาส</p>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-md">
          <AdminFieldLabel>เวลาตัดรอบจอง/ยกเลิก ภายในวันเดียวกัน (Cut-off Time)</AdminFieldLabel>
          <div className="flex items-center gap-3 mt-2">
            <select
              value={settings.cutoff_hour}
              onChange={(e) => setSettings({ ...settings, cutoff_hour: parseInt(e.target.value) })}
              className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none font-bold text-icsn-navy transition-all"
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}:00 น.
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-start gap-2 mt-3 p-3 bg-muted/50 rounded-lg">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-icsn-teal" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              เวลาที่จะไม่อนุญาตให้ผู้ปกครองทำรายการ "จอง" หรือ "ยกเลิก" คลาสของวันนี้<br />
              <span className="font-medium text-foreground">ตัวอย่าง:</span> หากตั้งไว้ที่ {settings.cutoff_hour.toString().padStart(2, '0')}:00 น. ผู้ปกครองจะไม่สามารถกดยกเลิกคลาสของวันนี้ได้หลังจาก {settings.cutoff_hour.toString().padStart(2, '0')}:00 น. เป็นต้นไป
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

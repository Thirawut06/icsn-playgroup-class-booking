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
    <section className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 bg-muted/30 border-b border-border flex items-center gap-3">
        <Clock className="w-5 h-5 text-icsn-teal" />
        <div>
          <h3 className="font-bold text-icsn-navy">กฎการจอง (Booking Rules)</h3>
        </div>
      </div>

      <div className="p-5">
        <div>
          <AdminFieldLabel>เวลาตัดรอบจอง/ยกเลิก ภายในวันเดียวกัน (Cut-off Time)</AdminFieldLabel>
          <div className="flex items-center gap-3 mt-1.5">
            <select
              value={settings.cutoff_hour}
              onChange={(e) => setSettings({ ...settings, cutoff_hour: parseInt(e.target.value) })}
              className="w-full sm:w-[200px] px-3 py-2 bg-white border border-border rounded-lg focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none font-bold text-icsn-navy transition-all"
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}:00 น.
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            เวลาที่จะไม่อนุญาตให้ทำรายการจอง/ยกเลิกสำหรับคลาสของวันนี้ (เช่น หากตั้งไว้ {settings.cutoff_hour.toString().padStart(2, '0')}:00 น. จะไม่สามารถยกเลิกคลาสวันนี้ได้หลังจากเวลานี้)
          </p>
        </div>
      </div>
    </section>
  );
}


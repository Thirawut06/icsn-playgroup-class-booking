import React from 'react';
import { ShieldCheck, CalendarCheck, Plus, Trash2, Info } from 'lucide-react';
import { SystemSettings } from '@/lib/services/settings.service';
import { AdminFieldLabel } from '../admin-ui';

interface Props {
  settings: SystemSettings;
  setSettings: (settings: SystemSettings) => void;
}

export function AutoApproveSection({ settings, setSettings }: Props) {
  return (
    <section className="bg-white border border-success/20 rounded-2xl shadow-sm overflow-hidden">
      {/* Header for entire Auto Approve system */}
      <div className="px-5 py-3.5 bg-success/5 border-b border-success/10 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-success" />
        <div>
          <h3 className="font-bold text-icsn-navy">ระบบอนุมัติสลิปอัตโนมัติ (Auto Approve)</h3>
        </div>
      </div>
      
      {/* 1. Time-based Auto Approve */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h4 className="font-bold text-icsn-navy text-sm">1. แบบกำหนดช่วงเวลา (ทุกวัน)</h4>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={settings.auto_approve_slip_enabled ?? false}
              onChange={(e) => setSettings({ ...settings, auto_approve_slip_enabled: e.target.checked })}
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
          </label>
        </div>

        {settings.auto_approve_slip_enabled && (
          <div className="mt-3 p-4 bg-muted/20 rounded-lg border border-border/50">
            <div className="flex items-center gap-4">
              <div className="w-auto">
                <select
                  value={settings.auto_approve_slip_start || '17:00'}
                  onChange={(e) => setSettings({ ...settings, auto_approve_slip_start: e.target.value })}
                  className="w-[120px] px-3 py-2 bg-white border border-border rounded-lg focus:ring-2 focus:ring-success/30 focus:border-success/50 outline-none text-icsn-navy font-bold text-sm transition-all"
                >
                  {Array.from({ length: 24 }).map((_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return (
                      <React.Fragment key={i}>
                        <option value={`${hour}:00`}>{hour}:00 น.</option>
                        <option value={`${hour}:30`}>{hour}:30 น.</option>
                      </React.Fragment>
                    );
                  })}
                </select>
              </div>
              <span className="text-muted-foreground font-bold">ถึง</span>
              <div className="w-auto">
                <select
                  value={settings.auto_approve_slip_end || '07:00'}
                  onChange={(e) => setSettings({ ...settings, auto_approve_slip_end: e.target.value })}
                  className="w-[120px] px-3 py-2 bg-white border border-border rounded-lg focus:ring-2 focus:ring-success/30 focus:border-success/50 outline-none text-icsn-navy font-bold text-sm transition-all"
                >
                  {Array.from({ length: 24 }).map((_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return (
                      <React.Fragment key={i}>
                        <option value={`${hour}:00`}>{hour}:00 น.</option>
                        <option value={`${hour}:30`}>{hour}:30 น.</option>
                      </React.Fragment>
                    );
                  })}
                </select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              ระบบจะอนุมัติสลิปทันทีหากแนบเข้ามาในช่วงเวลาระหว่าง <span className="font-bold text-success">{settings.auto_approve_slip_start || '17:00'} น.</span> ถึง <span className="font-bold text-success">{settings.auto_approve_slip_end || '07:00'} น.</span>
            </p>
          </div>
        )}
      </div>

      {/* 2. Date-based Auto Approve */}
      <div className="p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h4 className="font-bold text-icsn-navy text-sm">
              2. แบบระบุวันที่ (ตลอด 24 ชม.)
            </h4>
          </div>
          <button
            onClick={() => {
              const newDay = {
                id: Date.now().toString(),
                name: '',
                date: '',
                is_active: true
              };
              setSettings({
                ...settings,
                auto_approve_full_days: [...(settings.auto_approve_full_days || []), newDay]
              });
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-icsn-teal/10 text-icsn-teal hover:bg-icsn-teal/20 rounded-lg transition-colors text-xs font-bold shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> เพิ่มวันที่
          </button>
        </div>
        
        {(!settings.auto_approve_full_days || settings.auto_approve_full_days.length === 0) ? (
          <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
            <p className="text-xs">ยังไม่มีการระบุวันที่</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
            {settings.auto_approve_full_days.map((day, index) => (
              <div key={day.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white hover:bg-muted/10 transition-colors">
                <div className="w-full sm:w-2/5">
                  <input
                    type="text"
                    placeholder="ชื่อ / คำอธิบาย เช่น วันแม่"
                    value={day.name}
                    onChange={(e) => {
                      const newDays = [...(settings.auto_approve_full_days || [])];
                      newDays[index].name = e.target.value;
                      setSettings({ ...settings, auto_approve_full_days: newDays });
                    }}
                    className="w-full px-3 py-2 bg-white border border-border rounded-lg focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none text-icsn-navy text-sm transition-all"
                  />
                </div>
                
                <div className="w-full sm:w-2/5">
                  <input
                    type="date"
                    value={day.date}
                    onChange={(e) => {
                      const newDays = [...(settings.auto_approve_full_days || [])];
                      newDays[index].date = e.target.value;
                      setSettings({ ...settings, auto_approve_full_days: newDays });
                    }}
                    className="w-full px-3 py-2 bg-white border border-border rounded-lg focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none text-icsn-navy text-sm transition-all"
                  />
                </div>

                <div className="w-full sm:w-1/5 flex items-center justify-between sm:justify-end gap-4 mt-1 sm:mt-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider sm:hidden">เปิดใช้</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={day.is_active}
                        onChange={(e) => {
                          const newDays = [...(settings.auto_approve_full_days || [])];
                          newDays[index].is_active = e.target.checked;
                          setSettings({ ...settings, auto_approve_full_days: newDays });
                        }}
                      />
                      <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-success"></div>
                    </label>
                  </div>
                  
                  <button
                    onClick={() => {
                      const newDays = settings.auto_approve_full_days.filter((_, i) => i !== index);
                      setSettings({ ...settings, auto_approve_full_days: newDays });
                    }}
                    className="p-1.5 text-muted-foreground hover:text-error hover:bg-error/10 rounded-md transition-colors"
                    title="ลบวันที่นี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

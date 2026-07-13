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
    <section className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Header for entire Auto Approve system */}
      <div className="bg-success/5 px-6 py-4 border-b border-success/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-success/20 p-2 rounded-lg text-success">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-icsn-navy text-lg">ระบบอนุมัติสลิปอัตโนมัติ (Auto Approve)</h3>
            <p className="text-sm text-muted-foreground">ตั้งค่าการอนุมัติสลิปอัตโนมัติเพื่อลดภาระแอดมิน ทั้งช่วงเวลากลางคืนและวันหยุดพิเศษ</p>
          </div>
        </div>
      </div>
      
      {/* 1. Time-based Auto Approve */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="font-bold text-icsn-navy text-md">1. แบบกำหนดช่วงเวลา (ทุกวัน)</h4>
            <p className="text-sm text-muted-foreground mt-1">ระบบจะทำการอนุมัติสลิปอัตโนมัติ ภายในช่วงเวลาที่กำหนดในแต่ละวัน</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={settings.auto_approve_slip_enabled ?? false}
              onChange={(e) => setSettings({ ...settings, auto_approve_slip_enabled: e.target.checked })}
            />
            <div className="w-14 h-7 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-success"></div>
          </label>
        </div>

        {settings.auto_approve_slip_enabled && (
          <div className="mt-4 p-4 bg-muted/20 rounded-xl border border-border/50">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-full md:w-1/2">
                <AdminFieldLabel>เวลาเริ่ม (Start Time)</AdminFieldLabel>
                <select
                  value={settings.auto_approve_slip_start || '17:00'}
                  onChange={(e) => setSettings({ ...settings, auto_approve_slip_start: e.target.value })}
                  className="w-full mt-2 px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-success/30 focus:border-success/50 outline-none text-icsn-navy font-bold transition-all"
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
              <div className="w-full md:w-1/2">
                <AdminFieldLabel>เวลาสิ้นสุด (End Time)</AdminFieldLabel>
                <select
                  value={settings.auto_approve_slip_end || '07:00'}
                  onChange={(e) => setSettings({ ...settings, auto_approve_slip_end: e.target.value })}
                  className="w-full mt-2 px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-success/30 focus:border-success/50 outline-none text-icsn-navy font-bold transition-all"
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
            <div className="flex items-start gap-2 mt-4 p-3 bg-success/5 rounded-lg border border-success/10">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-success" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                หากแนบสลิปเข้ามาในช่วงเวลาระหว่าง <span className="font-bold text-success">{settings.auto_approve_slip_start || '17:00'} น.</span> ถึง <span className="font-bold text-success">{settings.auto_approve_slip_end || '07:00'} น.</span> ระบบจะอนุมัติทันทีโดยไม่ต้องรอแอดมิน
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Date-based Auto Approve */}
      <div className="p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="font-bold text-icsn-navy text-md flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-icsn-teal" /> 
              2. แบบระบุวันที่ (ตลอด 24 ชม.)
            </h4>
            <p className="text-sm text-muted-foreground mt-1">กำหนดวันที่ต้องการให้ระบบอนุมัติสลิปอัตโนมัติตลอดทั้ง 24 ชั่วโมง โดยข้ามเงื่อนไขเวลาด้านบน</p>
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
            className="flex items-center gap-2 px-3 py-2 bg-icsn-teal/10 text-icsn-teal hover:bg-icsn-teal/20 rounded-lg transition-colors text-sm font-bold shrink-0"
          >
            <Plus className="w-4 h-4" /> เพิ่มวันที่
          </button>
        </div>
        
        {(!settings.auto_approve_full_days || settings.auto_approve_full_days.length === 0) ? (
          <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
            <p className="text-sm">ยังไม่มีการระบุวันที่</p>
          </div>
        ) : (
          <div className="space-y-4">
            {settings.auto_approve_full_days.map((day, index) => (
              <div key={day.id} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-white border border-border rounded-xl shadow-sm hover:border-icsn-teal/30 transition-colors">
                <div className="w-full md:w-2/5">
                  <AdminFieldLabel>ชื่อ / คำอธิบาย</AdminFieldLabel>
                  <input
                    type="text"
                    placeholder="เช่น วันแม่, เปิดระบบ 24 ชม."
                    value={day.name}
                    onChange={(e) => {
                      const newDays = [...settings.auto_approve_full_days];
                      newDays[index].name = e.target.value;
                      setSettings({ ...settings, auto_approve_full_days: newDays });
                    }}
                    className="w-full mt-1 px-4 py-2 bg-white border border-border rounded-lg focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none text-icsn-navy text-sm transition-all"
                  />
                </div>
                
                <div className="w-full md:w-2/5">
                  <AdminFieldLabel>วันที่</AdminFieldLabel>
                  <input
                    type="date"
                    value={day.date}
                    onChange={(e) => {
                      const newDays = [...settings.auto_approve_full_days];
                      newDays[index].date = e.target.value;
                      setSettings({ ...settings, auto_approve_full_days: newDays });
                    }}
                    className="w-full mt-1 px-4 py-2 bg-white border border-border rounded-lg focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none text-icsn-navy text-sm transition-all"
                  />
                </div>

                <div className="w-full md:w-1/5 flex items-center justify-between md:justify-end gap-4 mt-4 md:mt-6">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">สถานะการทำงาน</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={day.is_active}
                        onChange={(e) => {
                          const newDays = [...settings.auto_approve_full_days];
                          newDays[index].is_active = e.target.checked;
                          setSettings({ ...settings, auto_approve_full_days: newDays });
                        }}
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                    </label>
                  </div>
                  
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-transparent select-none tracking-wider">ลบ</span>
                    <button
                      onClick={() => {
                        const newDays = settings.auto_approve_full_days.filter((_, i) => i !== index);
                        setSettings({ ...settings, auto_approve_full_days: newDays });
                      }}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="ลบวันที่นี้"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

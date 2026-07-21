import React from 'react';
import { CalendarX, Save, X } from 'lucide-react';
import { AdminFieldLabel, AdminButton, AdminStepBadge } from '../../admin-ui';

interface OverrideConfigPanelProps {
  selectionMode: 'range' | 'multi';
  setSelectionMode: (mode: 'range' | 'multi') => void;
  multiDates: string[];
  setMultiDates: (dates: string[]) => void;
  rangeStart: string;
  setRangeStart: (date: string) => void;
  rangeEnd: string;
  setRangeEnd: (date: string) => void;
  setIsPickingRangeEnd: (isPicking: boolean) => void;
  isPickingRangeEnd: boolean;
  overrideStatus: 'open' | 'closed' | 'reset';
  setOverrideStatus: (status: 'open' | 'closed' | 'reset') => void;
  overrideReason: string;
  setOverrideReason: (reason: string) => void;
  handleSaveOverride: () => void;
  savingOverride: boolean;
}

export function OverrideConfigPanel({
  selectionMode,
  setSelectionMode,
  multiDates,
  setMultiDates,
  rangeStart,
  setRangeStart,
  rangeEnd,
  setRangeEnd,
  setIsPickingRangeEnd,
  isPickingRangeEnd,
  overrideStatus,
  setOverrideStatus,
  overrideReason,
  setOverrideReason,
  handleSaveOverride,
  savingOverride
}: OverrideConfigPanelProps) {
  function formatDisplayDateStr(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
      <h4 className="font-bold text-icsn-navy mb-5 flex items-center gap-2 pb-3 border-b border-border/50">
        <CalendarX className="w-5 h-5" />
        ตั้งค่าวันหยุดพิเศษ / เปิดพิเศษ (Macro)
      </h4>

      {/* STEP 1 */}
      <div className="mb-6">
        <AdminStepBadge step={1} label="เลือกรูปแบบและวันที่" className="mb-3" />
        <div className="flex bg-muted p-1 rounded-lg mb-4">
        <button
          onClick={() => { setSelectionMode('multi'); setMultiDates([]); setRangeStart(''); setRangeEnd(''); setIsPickingRangeEnd(false); }}
          className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${selectionMode === 'multi' ? 'bg-white text-icsn-navy shadow-sm' : 'text-muted-foreground hover:text-foreground/90'}`}
        >
          เลือกแบบอิสระ (คลิกวันที่)
        </button>
        <button
          onClick={() => { setSelectionMode('range'); setMultiDates([]); setRangeStart(''); setRangeEnd(''); setIsPickingRangeEnd(false); }}
          className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${selectionMode === 'range' ? 'bg-white text-icsn-navy shadow-sm' : 'text-muted-foreground hover:text-foreground/90'}`}
        >
          เลือกแบบช่วงยาว (Range)
        </button>
      </div>

      <div className="space-y-4">
        {selectionMode === 'range' ? (
          <div>
            {isPickingRangeEnd && (
              <div className="text-xs text-icsn-teal font-bold mb-2 flex items-center justify-center bg-icsn-teal/10 py-1.5 rounded-lg animate-pulse">
                👉 กรุณาคลิกเลือกวันที่สิ้นสุดบนปฏิทิน
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <AdminFieldLabel>วันที่เริ่มต้น</AdminFieldLabel>
                <input
                  type="date"
                  value={rangeStart}
                  onChange={e => {
                    setRangeStart(e.target.value);
                    if (e.target.value > rangeEnd) setRangeEnd(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-icsn-teal focus:border-transparent transition-all text-sm"
                />
              </div>
              <div>
                <AdminFieldLabel>วันที่สิ้นสุด</AdminFieldLabel>
                <input
                  type="date"
                  value={rangeEnd}
                  min={rangeStart}
                  onChange={e => setRangeEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-icsn-teal focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <AdminFieldLabel>วันที่เลือก ({multiDates.length} วัน)</AdminFieldLabel>
            <div className="min-h-[42px] p-2 bg-muted/50 border border-border rounded-xl flex flex-wrap gap-1">
              {multiDates.length > 0 ? multiDates.map(d => (
                <span key={d} className="bg-icsn-navy text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                  {formatDisplayDateStr(d)}
                  <button onClick={() => setMultiDates(multiDates.filter(md => md !== d))} className="hover:text-error">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )) : (
                <span className="text-sm text-muted-foreground/70 p-1">คลิกที่ปฏิทินเพื่อเลือกวัน</span>
              )}
            </div>
          </div>
        )}
      </div>
      </div>


      {/* STEP 2 */}
      <div className="mb-6">
        <AdminStepBadge step={2} label="กำหนดสถานะและเหตุผล" className="mb-3" />
        <div className="flex bg-muted p-1 rounded-lg">
          <button
            onClick={() => {
              setOverrideStatus('closed');
              if (overrideReason === 'เปิดพิเศษ' || overrideReason === 'บังคับเปิด') setOverrideReason('');
            }}
            className={`flex-1 py-2 text-sm font-bold flex flex-col items-center justify-center gap-1 rounded-xl border-2 transition-all ${overrideStatus === 'closed'
                ? 'bg-white text-error shadow-sm ring-1 ring-border border-error'
                : 'border-transparent text-muted-foreground hover:bg-white hover:shadow-sm'
              }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
            ปิดรับจอง
          </button>
          <button
            onClick={() => {
              setOverrideStatus('open');
              if (overrideReason === 'ปิดทำการ' || overrideReason === 'ปิดรับจอง' || overrideReason === 'วันหยุด') setOverrideReason('');
            }}
            className={`flex-1 py-2 text-sm font-bold flex flex-col items-center justify-center gap-1 rounded-xl border-2 transition-all ${overrideStatus === 'open'
                ? 'bg-white text-success shadow-sm ring-1 ring-border border-success'
                : 'border-transparent text-muted-foreground hover:bg-white hover:shadow-sm'
              }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
            บังคับเปิด
          </button>
          <button
            onClick={() => { setOverrideStatus('reset'); setOverrideReason(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${overrideStatus === 'reset'
                ? 'bg-white text-foreground/90 shadow-sm ring-1 ring-border border-border'
                : 'border-transparent text-muted-foreground hover:bg-white hover:shadow-sm'
              }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"></span>
            ยกเลิกค่า (Reset)
          </button>
        </div>

        {overrideStatus === 'closed' && (
          <div className="animate-in fade-in">
            <input
              type="text"
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
              placeholder="สาเหตุการปิด (ไม่บังคับ)"
              className="w-full px-3 py-2 text-sm bg-muted/50 border border-border/80 rounded-lg focus:ring-1 focus:ring-icsn-teal outline-none"
            />
          </div>
        )}
      </div>

      {/* STEP 3 */}
      <div>
        <AdminStepBadge step={3} label="บันทึกการตั้งค่า" className="mb-3" />
        <div className="pt-2">
          <AdminButton
            variant="primary"
            onClick={handleSaveOverride}
            disabled={savingOverride || (selectionMode === 'multi' ? multiDates.length === 0 : (!rangeStart || !rangeEnd))}
            className="w-full justify-center"
            isLoading={savingOverride}
            icon={overrideStatus === 'reset' ? undefined : Save}
          >
            {overrideStatus === 'reset' ? 'บันทึกการยกเลิก' : 'บันทึกตั้งค่าช่วงวันที่'}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}

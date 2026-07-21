import React from 'react';
import { Settings } from 'lucide-react';
import { AdminButton } from '../../admin-ui';

interface WeeklyConfigPanelProps {
  tempOperatingDays: number[];
  operatingDays: number[];
  savingSettings: boolean;
  handleSaveSettings: () => void;
  toggleTempDay: (day: number) => void;
}

export function WeeklyConfigPanel({
  tempOperatingDays,
  operatingDays,
  savingSettings,
  handleSaveSettings,
  toggleTempDay
}: WeeklyConfigPanelProps) {
  const daysList = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const fullDaysList = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

  return (
    <div className="bg-muted/50 border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-icsn-navy" />
          <h4 className="font-bold text-icsn-navy text-sm">วันทำการพื้นฐานรายสัปดาห์</h4>
        </div>
        <AdminButton
          variant="primary"
          onClick={handleSaveSettings}
          disabled={savingSettings || JSON.stringify(operatingDays) === JSON.stringify(tempOperatingDays)}
          size="sm"
          isLoading={savingSettings}
        >
          บันทึก
        </AdminButton>
      </div>
      <div className="flex gap-1 sm:gap-2 justify-between">
        {fullDaysList.map((dayName, index) => {
          const isSelected = tempOperatingDays.includes(index);
          const shortName = daysList[index];
          return (
            <button
              key={index}
              onClick={() => toggleTempDay(index)}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${isSelected ? 'bg-icsn-teal text-white shadow-sm ring-2 ring-offset-1 ring-icsn-teal' : 'bg-white text-muted-foreground/70 border border-border hover:bg-muted'
                }`}
              title={dayName}
            >
              {shortName}
            </button>
          )
        })}
      </div>
    </div>
  );
}

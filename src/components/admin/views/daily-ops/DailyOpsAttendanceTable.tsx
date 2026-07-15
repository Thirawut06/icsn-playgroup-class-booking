import React from 'react';
import { Users, Loader2, CheckCircle2, PenLine, XCircle } from 'lucide-react';
import { COPY } from '@/config/copy';
import { AdminEmptyState, AdminDataTable, AdminButton } from '../../admin-ui';
import { formatAgeDisplay, formatAgeYMD } from '../../admin-utils';
import type { DailyAttendanceRow } from '@/types';

interface DailyOpsAttendanceTableProps {
  loading: boolean;
  attendance: DailyAttendanceRow[];
  setEsignTarget: (row: DailyAttendanceRow) => void;
  handleCancel: (id: string) => void;
}

export function DailyOpsAttendanceTable({
  loading,
  attendance,
  setEsignTarget,
  handleCancel
}: DailyOpsAttendanceTableProps) {
  return (
    <div className="p-4">
      <h3 className="font-bold text-icsn-navy mb-3 flex items-center gap-2 text-sm">
        <Users className="w-4 h-4 text-icsn-teal" />
        รายชื่อนักเรียน
      </h3>

      {loading ? (
        <div className="flex justify-center items-center h-24">
          <Loader2 className="w-6 h-6 animate-spin text-icsn-teal/50" />
        </div>
      ) : attendance.length === 0 ? (
        <AdminEmptyState message={COPY.EMPTY_STATES.NO_STUDENTS} />
      ) : (
        <AdminDataTable
          minWidth="min-w-[700px]"
          headers={[
            { label: 'เช็คอิน', align: 'center', width: 'w-[140px]' },
            { label: 'ชื่อนักเรียน' },
            { label: 'อายุ', width: 'w-[150px]' },
            { label: 'แพ้อาหาร', width: 'w-[100px]' },
            { label: 'ผู้ปกครอง' },
            { label: 'จัดการ', align: 'right', width: 'w-[100px]' },
          ]}
        >
          {attendance.map(row => (
            <tr key={row.id} className={`transition ${row.checkin_at ? 'bg-success/5' : 'hover:bg-muted/30'}`}>
              {/* Check-in */}
              <td className="px-4 py-3 text-center">
                {row.checkin_at ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-success/15 text-success border border-success/20">
                    <CheckCircle2 className="w-5 h-5" /> เช็คอินแล้ว
                  </span>
                ) : (
                  <AdminButton
                    id={`esign-btn-${row.id}`}
                    variant="primary"
                    size="md"
                    className="px-6 py-2.5 text-base font-bold shadow-sm min-w-[100px]"
                    icon={PenLine}
                    onClick={() => setEsignTarget(row)}
                  >
                    เช็คอิน
                  </AdminButton>
                )}
              </td>

              <td className="px-4 py-3">
                <div className="font-bold text-icsn-navy text-base">{row.full_name || row.nickname}</div>
                {row.full_name && <div className="text-sm text-muted-foreground">น้อง{row.nickname}</div>}
              </td>
              <td className="px-4 py-3 text-muted-foreground text-sm whitespace-nowrap">{row.dob ? formatAgeYMD(row.dob) : formatAgeDisplay(row.age)}</td>
              <td className="px-4 py-3 text-base">
                {row.food_allergy
                  ? <span className="text-error font-bold bg-error/10 px-2 py-0.5 rounded text-sm uppercase">{row.food_allergy}</span>
                  : <span className="text-muted-foreground/50">-</span>
                }
              </td>
              <td className="px-4 py-3 text-base">
                <div className="font-semibold text-icsn-navy">{row.parent_name}</div>
                <div className="text-sm text-muted-foreground">{row.parent_phone}</div>
              </td>

              {/* Cancel */}
              <td className="px-4 py-3 text-right">
                <AdminButton
                  variant="danger"
                  size="sm"
                  icon={XCircle}
                  onClick={() => handleCancel(row.id)}
                  title="ยกเลิกจอง"
                >
                  ยกเลิก
                </AdminButton>
              </td>
            </tr>
          ))}
        </AdminDataTable>
      )}
    </div>
  );
}

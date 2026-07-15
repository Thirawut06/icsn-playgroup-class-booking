import React from 'react';
import { Loader2 } from 'lucide-react';
import { BOOKING_STATUS } from '@/config/constants';
import { AdminDataTable, AdminButton, AdminBadge, AdminTableEmpty } from '../../admin-ui';
import type { RecentBooking } from './useAdminDashboard';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'เมื่อกี้';
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชม.ที่แล้ว`;
  return `${Math.floor(hrs / 24)} วันที่แล้ว`;
}

function formatThaiDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface RecentBookingsTableProps {
  bookings: RecentBooking[];
  loading: boolean;
  onRefresh: () => void;
}

export function RecentBookingsTable({ bookings, loading, onRefresh }: RecentBookingsTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground text-base">การจองล่าสุด (15 รายการ)</h3>
        <AdminButton variant="ghost" size="sm" onClick={onRefresh} className="text-icsn-teal hover:text-icsn-teal/80">
          รีเฟรช
        </AdminButton>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white border border-border rounded-2xl">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/70" />
        </div>
      ) : (
        <AdminDataTable
          minWidth="min-w-[900px]"
          headers={[
            { label: 'สถานะ', width: 'w-[100px]' },
            { label: 'เด็ก' },
            { label: 'ผู้ปกครอง' },
            { label: 'เบอร์', width: 'w-[120px]' },
            { label: 'วันที่', width: 'w-[120px]' },
            { label: 'รอบ', width: 'w-[100px]' },
            { label: 'จองเมื่อ', width: 'w-[120px]' }
          ]}
        >
          {bookings.length === 0 ? (
            <AdminTableEmpty colSpan={7} message="ยังไม่มีการจองในระบบ" />
          ) : (
            bookings.map((b) => {
              const isConfirmed = b.status === BOOKING_STATUS.CONFIRMED;
              const isCancelled = b.status === BOOKING_STATUS.CANCELLED;
              return (
                <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <AdminBadge variant={isConfirmed ? 'success' : isCancelled ? 'error' : 'default'}>
                      {isConfirmed ? '✓ จอง' : isCancelled ? '✕ ยกเลิก' : b.status}
                    </AdminBadge>
                  </td>
                  <td className="px-4 py-4 font-bold text-foreground text-sm whitespace-nowrap">น้อง{b.child_nickname}</td>
                  <td className="px-4 py-4 text-foreground/80 text-sm whitespace-nowrap">{b.parent_name}</td>
                  <td className="px-4 py-4 text-muted-foreground text-sm whitespace-nowrap">{b.parent_phone}</td>
                  <td className="px-4 py-4 text-foreground/80 text-sm font-semibold whitespace-nowrap">
                    {b.session_date ? formatThaiDate(b.session_date) : '-'}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground text-sm font-semibold whitespace-nowrap">{b.time_label || '-'}</td>
                  <td className="px-4 py-4 text-muted-foreground/70 text-sm whitespace-nowrap">{formatTimeAgo(b.created_at)}</td>
                </tr>
              );
            })
          )}
        </AdminDataTable>
      )}
    </div>
  );
}

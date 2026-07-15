import React from 'react';
import { Loader2, History, ReceiptText, XCircle } from 'lucide-react';
import { AdminEmptyState, AdminDataTable, AdminPagination, AdminButton } from '../../admin-ui';
import type { TransactionHistoryRow } from '@/types';

interface HistorySlipsTabProps {
  historyLoading: boolean;
  filteredHistory: TransactionHistoryRow[];
  paginatedHistory: TransactionHistoryRow[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  setCurrentPage: (page: number) => void;
  previewHistoryImg: string | null;
  setPreviewHistoryImg: (url: string | null) => void;
}

export function HistorySlipsTab({
  historyLoading,
  filteredHistory,
  paginatedHistory,
  currentPage,
  totalPages,
  itemsPerPage,
  setCurrentPage,
  previewHistoryImg,
  setPreviewHistoryImg
}: HistorySlipsTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300 pt-2">
      {historyLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-icsn-teal" />
        </div>
      ) : filteredHistory.length === 0 ? (
        <AdminEmptyState icon={History} message="ไม่พบประวัติการทำรายการ" />
      ) : (
        <>
          <AdminDataTable
            headers={[
              { label: 'วันเวลา', width: 'w-[150px]' },
              { label: 'ผู้ปกครอง' },
              { label: 'แพ็กเกจ', width: 'w-[150px]' },
              { label: 'ยอดเงิน / เครดิต', align: 'center', width: 'w-[150px]' },
              { label: 'สถานะ', align: 'center', width: 'w-[120px]' },
              { label: 'สลิป', align: 'center', width: 'w-[100px]' }
            ]}
          >
            {paginatedHistory.map((row) => (
              <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap">
                  <p className="font-semibold text-foreground text-sm">
                    {new Date(row.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(row.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium text-foreground text-sm">{row.parent_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{row.parent_phone}</p>
                  {row.children_nicknames && row.children_nicknames !== '-' && (
                    <p className="text-xs text-muted-foreground mt-0.5">น้อง{row.children_nicknames}</p>
                  )}
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium text-foreground text-sm">{row.package_name}</p>
                </td>
                <td className="px-4 py-4 text-center whitespace-nowrap">
                   <p className="font-bold text-foreground text-sm">฿{row.price?.toLocaleString() || '0'}</p>
                   <p className="text-xs text-success font-semibold mt-0.5">+{row.credits} Credits</p>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                    row.status === 'approved' ? 'bg-success/10 text-success' :
                    row.status === 'rejected' ? 'bg-error/10 text-error' :
                    'bg-warning/10 text-warning'
                  }`}>
                    {row.status === 'approved' ? 'อนุมัติ' :
                     row.status === 'rejected' ? 'ไม่อนุมัติ' : 'รอตรวจ'}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  {row.file_url && row.file_url !== 'PENDING_WALKIN_PAYMENT' ? (
                     <AdminButton
                       variant="icon"
                       onClick={() => setPreviewHistoryImg(row.file_url)}
                       className="text-icsn-teal hover:bg-muted"
                       title="ดูสลิป"
                       icon={ReceiptText}
                     />
                  ) : (
                     <span className="text-muted-foreground text-xs">-</span>
                  )}
                </td>
              </tr>
            ))}
          </AdminDataTable>

          {/* Pagination */}
          {filteredHistory.length > 0 && (
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredHistory.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* Simple image preview for history */}
      {previewHistoryImg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setPreviewHistoryImg(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewHistoryImg(null)}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
            >
              <XCircle className="w-8 h-8" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewHistoryImg} alt="Slip" loading="lazy" className="w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}

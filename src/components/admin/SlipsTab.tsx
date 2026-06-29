"use client";

import React from 'react';
import { Eye, ReceiptText, Smile } from 'lucide-react';
import { AdminEmptyState, AdminPanel, AdminPanelHeader } from './admin-ui';
import { SlipPreviewModal } from './SlipPreviewModal';
import { usePendingSlips } from '@/hooks/usePendingSlips';

interface SlipsTabProps {
  onRefresh?: () => void;
}

export function SlipsTab({ onRefresh }: SlipsTabProps) {
  const {
    slips,
    loading,
    previewSlip,
    setPreviewSlip,
    isProcessing,
    handleApprove,
    handleReject,
  } = usePendingSlips({ onRefresh });

  return (
    <AdminPanel className="no-print">
      <AdminPanelHeader
        icon={ReceiptText}
        title="อนุมัติหลักฐานฝากเงิน (Approve Slips)"
      />

      {loading ? (
        <p className="text-center text-gray-500 py-12 text-base font-medium">กำลังโหลด...</p>
      ) : slips.length === 0 ? (
        <AdminEmptyState icon={Smile} message="ไม่มีหลักฐานการชำระเงินที่รออนุมัติ" />
      ) : (
        <div className="overflow-x-auto border border-gray-300 shadow-sm">
          <table className="w-full text-left text-xs sm:text-sm border-collapse bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                <th className="border border-gray-300 px-3 py-2">Parent / Contact (ผู้ปกครอง)</th>
                <th className="border border-gray-300 px-3 py-2">Child (ชื่อเล่น)</th>
                <th className="border border-gray-300 px-3 py-2 text-center">Package (เครดิตที่จะได้รับ)</th>
                <th className="border border-gray-300 px-3 py-2 text-center">Slip (หลักฐาน)</th>
                <th className="border border-gray-300 px-3 py-2 text-center w-32">Actions (จัดการ)</th>
              </tr>
            </thead>
            <tbody>
              {slips.map(slip => (
                <tr key={slip.id} className="hover:bg-blue-50/50 transition">
                  <td className="border border-gray-300 px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{slip.parent_name}</span>
                      <span className="text-gray-500 font-mono text-[11px] sm:text-xs">({slip.parent_phone})</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-3 py-1.5 font-bold text-gray-800">
                    น้อง{slip.child_nickname}
                  </td>
                  <td className="border border-gray-300 px-3 py-1.5 text-center">
                    <span className="inline-flex items-center justify-center bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-xs uppercase border border-emerald-200">
                      +{slip.credits_to_add} Credits
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-1.5 text-center">
                    <button
                      onClick={() => setPreviewSlip(slip)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded text-xs border border-gray-300 transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> ตรวจสอบสลิป
                    </button>
                  </td>
                  <td className="border border-gray-300 px-3 py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleApprove(slip, slip.credits_to_add)}
                        disabled={isProcessing}
                        className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded text-xs transition disabled:opacity-50 shadow-sm"
                      >
                        อนุมัติ
                      </button>
                      <button
                        onClick={() => handleReject(slip.id)}
                        disabled={isProcessing}
                        className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded text-xs transition disabled:opacity-50 shadow-sm"
                      >
                        ปฏิเสธ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slip Preview & Action Modal */}
      <SlipPreviewModal
        isOpen={!!previewSlip}
        onClose={() => setPreviewSlip(null)}
        slip={previewSlip}
        onApprove={handleApprove}
        onReject={handleReject}
        isProcessing={isProcessing}
      />
    </AdminPanel>
  );
}

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {slips.map(slip => (
            <div
              key={slip.id}
              className="border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-sm flex flex-col justify-between group hover:border-icsn-teal/50 transition cursor-pointer"
              onClick={() => setPreviewSlip(slip)}
            >
              <div className="p-5 bg-gray-50 border-b border-gray-100 flex flex-col gap-1.5 text-sm">
                <p className="font-bold text-gray-900 truncate text-base">{slip.parent_name}</p>
                <p className="text-gray-500 font-mono truncate">{slip.parent_phone}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-icsn-teal font-bold truncate">น้อง{slip.child_nickname}</p>
                  <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
                    +{slip.credits_to_add}
                  </span>
                </div>
              </div>

              <div className="relative p-4">
                <div className="relative bg-gray-100 rounded-xl overflow-hidden border border-gray-200 aspect-[3/4] flex items-center justify-center group-hover:shadow-inner transition">
                  {slip.file_url ? (
                    <>
                      <img
                        src={slip.file_url}
                        alt="Payment slip"
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <div className="bg-white/90 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 backdrop-blur-sm shadow-sm">
                          <Eye className="w-5 h-5" /> ตรวจสอบสลิป
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400 text-sm font-medium">ไม่มีรูปสลิป</div>
                  )}
                </div>
              </div>
            </div>
          ))}
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

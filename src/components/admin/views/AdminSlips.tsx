"use client";

import React from 'react';
import { Eye, ReceiptText, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { AdminEmptyState, AdminPanel, AdminPanelHeader } from '../admin-ui';
import { SlipPreviewModal } from '../SlipPreviewModal';
import { usePendingSlips } from '@/hooks/usePendingSlips';
import { COPY } from '@/config/copy';

export function AdminSlips({ onRefresh }: { onRefresh?: () => void }) {
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPanel className="no-print">
        <AdminPanelHeader icon={ReceiptText} title="ตรวจสอบสลิปโอนเงิน (Pending Slips)" />

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-48"><Loader2 className="w-8 h-8 animate-spin text-icsn-teal" /></div>
          ) : slips.length === 0 ? (
            <AdminEmptyState icon={CheckCircle2} message={COPY.EMPTY_STATES.NO_PENDING_SLIPS} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {slips.map((slip) => (
                <div key={slip.id} className="bg-white border border-border hover:border-icsn-teal/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-foreground text-lg">{slip.parent_name}</h4>
                        <p className="text-sm text-muted-foreground">{slip.parent_phone}</p>
                      </div>
                      <span className="bg-warning/10 text-warning font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wide">
                        รอตรวจ
                      </span>
                    </div>

                    <div className="bg-muted rounded-xl p-4 mb-4 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase">เครดิตที่จะได้รับ</p>
                        <p className="text-xl font-black text-success">+{slip.credits_to_add} Credits</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground font-semibold uppercase">ชื่อเด็ก</p>
                        <p className="font-bold text-foreground">น้อง{slip.child_nickname}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-4 border-t border-border pt-4">
                    <div 
                      onClick={() => setPreviewSlip(slip)}
                      className="w-full h-56 bg-muted rounded-xl overflow-hidden cursor-pointer border border-border relative group"
                    >
                      {slip.file_url ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={slip.file_url} alt="Slip" className="w-full h-full object-contain transition-transform hover:scale-105 bg-foreground/10/5" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-8 h-8 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/70">
                          <ReceiptText className="w-8 h-8 mb-2" />
                          <span className="text-sm font-bold">ไม่มีรูปสลิป</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(slip, slip.credits_to_add)}
                        disabled={isProcessing}
                        className="flex-1 flex justify-center items-center gap-2 py-3 bg-success hover:bg-success text-white rounded-xl font-bold transition cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-5 h-5" /> อนุมัติ
                      </button>
                      <button
                        onClick={() => handleReject(slip.id)}
                        disabled={isProcessing}
                        className="flex-1 flex justify-center items-center gap-2 py-3 bg-error/10 hover:bg-error/10 text-error rounded-xl font-bold transition cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-5 h-5" /> ไม่อนุมัติ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <SlipPreviewModal
          isOpen={!!previewSlip}
          onClose={() => setPreviewSlip(null)}
          slip={previewSlip}
          onApprove={handleApprove}
          onReject={handleReject}
          isProcessing={isProcessing}
        />
      </AdminPanel>
    </div>
  );
}

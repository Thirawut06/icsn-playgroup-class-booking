"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Eye, ReceiptText, CheckCircle2, XCircle, Loader2, Search, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { AdminEmptyState, AdminPanel, AdminPanelHeader, AdminDataTable, AdminTabs } from '../admin-ui';
import { SlipPreviewModal } from '../SlipPreviewModal';
import { usePendingSlips } from '@/hooks/usePendingSlips';
import { COPY } from '@/config/copy';
import { AdminService } from '@/lib/supabase';
import type { TransactionHistoryRow } from '@/types';
import toast from 'react-hot-toast';

export function AdminSlips({ onRefresh }: { onRefresh?: () => void }) {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pending slips
  const {
    slips: pendingSlips,
    loading: pendingLoading,
    previewSlip,
    setPreviewSlip,
    isProcessing,
    handleApprove,
    handleReject,
    handleUploadMissingSlip,
  } = usePendingSlips({ onRefresh });

  // History slips
  const [historySlips, setHistorySlips] = useState<TransactionHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // New slip preview for history tab
  const [previewHistoryImg, setPreviewHistoryImg] = useState<string | null>(null);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await AdminService.getTransactionHistory();
      setHistorySlips(data);
    } catch (err: unknown) {
      toast.error("Failed to fetch history: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history' && historySlips.length === 0) {
      // Defer execution to avoid synchronous setState warning
      Promise.resolve().then(() => fetchHistory());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return historySlips;
    const lower = searchTerm.toLowerCase();
    return historySlips.filter(s => 
      s.parent_name.toLowerCase().includes(lower) || 
      s.parent_phone.includes(lower) || 
      s.children_nicknames.toLowerCase().includes(lower) ||
      s.package_name.toLowerCase().includes(lower)
    );
  }, [historySlips, searchTerm]);


  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [searchTerm, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / itemsPerPage));
  const paginatedHistory = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleApproveWithRefresh = async (slip: any, overrideCredits: number) => {
    await handleApprove(slip, overrideCredits);
    if (activeTab === 'history') {
        await fetchHistory();
    }
  };

  const handleRejectWithRefresh = async (slipId: string) => {
    await handleReject(slipId);
    if (activeTab === 'history') {
        await fetchHistory();
    }
  };

  const handleUploadMissingWithRefresh = async (slipId: string, file: File) => {
      await handleUploadMissingSlip(slipId, file);
      if (activeTab === 'history') {
          await fetchHistory();
      }
  };


  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPanel className="no-print">
        <AdminPanelHeader icon={ReceiptText} title="จัดการการชำระเงิน (Payments)" />

        <div className="p-6 space-y-6">
          
          {/* Top Controls: Search & Tabs */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 min-h-[44px]">
            <AdminTabs
              tabs={[
                { id: 'pending', label: `รอตรวจสอบ (${pendingSlips.length})` },
                { id: 'history', label: 'ประวัติทั้งหมด' },
              ]}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id as any)}
            />

            {/* Search Bar (always rendered to preserve layout height, but hidden on pending) */}
            <div className={`relative w-full md:w-72 shrink-0 transition-opacity duration-200 ${activeTab !== 'history' ? 'invisible opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, เบอร์โทร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 h-[44px] border border-border rounded-xl focus:border-icsn-teal focus:ring-2 focus:ring-icsn-teal/20 outline-none text-foreground text-sm bg-white shadow-sm transition-all"
              />
            </div>
          </div>

          {activeTab === 'pending' ? (
            // --- PENDING TAB ---
            <div className="animate-in fade-in duration-300 pt-2">
              {pendingLoading ? (
                <div className="flex justify-center items-center h-48"><Loader2 className="w-8 h-8 animate-spin text-icsn-teal" /></div>
              ) : pendingSlips.length === 0 ? (
                <AdminEmptyState icon={CheckCircle2} message={COPY.EMPTY_STATES.NO_PENDING_SLIPS} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {pendingSlips.map((slip) => (
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
                          {slip.file_url && slip.file_url !== 'PENDING_WALKIN_PAYMENT' ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={slip.file_url} alt="Slip" className="w-full h-full object-contain transition-transform hover:scale-105 bg-foreground/10/5" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="w-8 h-8 text-white" />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/70 bg-warning/10">
                              <ReceiptText className="w-8 h-8 mb-2 text-warning" />
                              <span className="text-sm font-bold text-warning">รอการอัปโหลดสลิปย้อนหลัง</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApproveWithRefresh(slip, slip.credits_to_add)}
                            disabled={isProcessing}
                            className="flex-1 flex justify-center items-center gap-2 py-3 bg-success hover:bg-success text-white rounded-xl font-bold transition cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-5 h-5" /> อนุมัติ
                          </button>
                          <button
                            onClick={() => handleRejectWithRefresh(slip.id)}
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
          ) : (
            // --- HISTORY TAB ---
            <div className="space-y-4 animate-in fade-in duration-300 pt-2">
              {historyLoading ? (
                <div className="flex justify-center items-center h-48"><Loader2 className="w-8 h-8 animate-spin text-icsn-teal" /></div>
              ) : filteredHistory.length === 0 ? (
                <AdminEmptyState icon={History} message="ไม่พบประวัติการทำรายการ" />
              ) : (
                <>
                  <AdminDataTable
                    headers={[
                      { label: 'วันเวลา' },
                      { label: 'ผู้ปกครอง' },
                      { label: 'แพ็กเกจ' },
                      { label: 'ยอดเงิน / เครดิต', align: 'center' },
                      { label: 'สถานะ', align: 'center' },
                      { label: 'สลิป', align: 'center' }
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
                             <button
                               onClick={() => setPreviewHistoryImg(row.file_url)}
                               className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted text-icsn-teal transition-colors"
                               title="ดูสลิป"
                             >
                               <ReceiptText className="w-5 h-5" />
                             </button>
                          ) : (
                             <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </AdminDataTable>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <p className="text-sm text-muted-foreground">
                        หน้า <span className="font-bold text-foreground">{currentPage}</span> จาก <span className="font-bold text-foreground">{totalPages}</span>
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="w-10 h-10 flex items-center justify-center rounded-xl border border-border hover:bg-muted text-muted-foreground disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="w-10 h-10 flex items-center justify-center rounded-xl border border-border hover:bg-muted text-muted-foreground disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Existing slip preview modal for pending */}
        <SlipPreviewModal
          isOpen={!!previewSlip}
          onClose={() => setPreviewSlip(null)}
          slip={previewSlip}
          onApprove={handleApproveWithRefresh}
          onReject={handleRejectWithRefresh}
          onUploadMissingSlip={handleUploadMissingWithRefresh}
          isProcessing={isProcessing}
        />

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
              <img src={previewHistoryImg} alt="Slip" className="w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
            </div>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

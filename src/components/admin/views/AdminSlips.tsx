"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { ReceiptText } from 'lucide-react';
import { AdminPanel, AdminPanelHeader, AdminTabs, AdminSearch } from '../admin-ui';
import { PendingSlipsTab } from './slips/PendingSlipsTab';
import { HistorySlipsTab } from './slips/HistorySlipsTab';
import { usePendingSlips } from '@/hooks/usePendingSlips';
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
            <div className={`transition-opacity duration-200 ${activeTab !== 'history' ? 'invisible opacity-0 pointer-events-none' : 'opacity-100'} w-full md:w-72 shrink-0`}>
              <AdminSearch
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="ค้นหาชื่อ, เบอร์โทร..."
              />
            </div>
          </div>

          {activeTab === 'pending' ? (
            <PendingSlipsTab
              pendingLoading={pendingLoading}
              pendingSlips={pendingSlips}
              setPreviewSlip={setPreviewSlip}
              previewSlip={previewSlip}
              handleApproveWithRefresh={handleApproveWithRefresh}
              handleRejectWithRefresh={handleRejectWithRefresh}
              handleUploadMissingWithRefresh={handleUploadMissingWithRefresh}
              isProcessing={isProcessing}
            />
          ) : (
            <HistorySlipsTab
              historyLoading={historyLoading}
              filteredHistory={filteredHistory}
              paginatedHistory={paginatedHistory}
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              setCurrentPage={setCurrentPage}
              previewHistoryImg={previewHistoryImg}
              setPreviewHistoryImg={setPreviewHistoryImg}
            />
          )}
        </div>
      </AdminPanel>
    </div>
  );
}

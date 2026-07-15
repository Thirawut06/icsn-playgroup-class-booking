import React from 'react';
import { X, CalendarPlus, Coins } from 'lucide-react';
import { useAdminManageCredits } from './views/users/credits-modal/useAdminManageCredits';
import { AdjustCreditsTab } from './views/users/credits-modal/AdjustCreditsTab';
import { BookClassTab } from './views/users/credits-modal/BookClassTab';

interface AdminManageCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'credits' | 'book';
  parentId: string;
  parentPhone: string;
  childrenList: any[];
  totalCredits: number;
  onSuccess: () => void;
}

export function AdminManageCreditsModal({
  isOpen,
  onClose,
  initialMode,
  parentId,
  parentPhone,
  childrenList,
  totalCredits,
  onSuccess
}: AdminManageCreditsModalProps) {
  const {
    isSaving,
    creditAmount,
    setCreditAmount,
    creditReason,
    setCreditReason,
    selectedChildId,
    setSelectedChildId,
    selectedSessionId,
    setSelectedSessionId,
    paymentType,
    setPaymentType,
    availableSessions,
    isLoadingSessions,
    handleAdjustCredits,
    handleBookClass,
  } = useAdminManageCredits({
    isOpen,
    initialMode,
    parentId,
    parentPhone,
    childrenList,
    totalCredits,
    onSuccess,
    onClose
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => !isSaving && onClose()}></div>
      <div className="bg-white rounded-[2rem] w-[calc(100%-1rem)] max-w-xl mx-auto shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-white rounded-t-[2rem] shrink-0">
          <div className="flex items-center gap-3">
            {initialMode === 'credits' ? (
              <div className="w-10 h-10 rounded-full bg-icsn-teal/10 flex items-center justify-center text-icsn-teal">
                <Coins className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-icsn-navy/10 flex items-center justify-center text-icsn-navy">
                <CalendarPlus className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {initialMode === 'credits' ? 'ปรับปรุงเครดิตผู้ใช้งาน' : 'ลงวันจองคลาส'}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isSaving}
            className="p-2 bg-muted hover:bg-muted/80 rounded-full transition-colors text-muted-foreground disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {initialMode === 'credits' && (
            <AdjustCreditsTab
              creditAmount={creditAmount}
              setCreditAmount={setCreditAmount}
              creditReason={creditReason}
              setCreditReason={setCreditReason}
              isSaving={isSaving}
              handleAdjustCredits={handleAdjustCredits}
            />
          )}

          {initialMode === 'book' && (
            <BookClassTab
              childrenList={childrenList}
              selectedChildId={selectedChildId}
              setSelectedChildId={setSelectedChildId}
              availableSessions={availableSessions}
              isLoadingSessions={isLoadingSessions}
              selectedSessionId={selectedSessionId}
              setSelectedSessionId={setSelectedSessionId}
              totalCredits={totalCredits}
              paymentType={paymentType}
              setPaymentType={setPaymentType}
              isSaving={isSaving}
              handleBookClass={handleBookClass}
            />
          )}
        </div>
      </div>
    </div>
  );
}

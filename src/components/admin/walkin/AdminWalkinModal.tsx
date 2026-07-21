import React from 'react';
import { UserPlus, X } from 'lucide-react';
import { useAdminWalkin } from './useAdminWalkin';
import { WalkinSearchStep } from './WalkinSearchStep';
import { WalkinActionStep } from './WalkinActionStep';

interface AdminWalkinModalProps {
  isOpen: boolean;
  sessionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminWalkinModal({ isOpen, sessionId, onClose, onSuccess }: AdminWalkinModalProps) {
  const {
    step,
    phone,
    setPhone,
    isSearching,
    isProcessing,
    searchResult,
    selectedChildId,
    setSelectedChildId,
    newChildName,
    setNewChildName,
    packageOptions,
    selectedPackage,
    setSelectedPackage,
    showPackageSelect,
    setShowPackageSelect,
    closeAndReset,
    handleReset,
    handleSearch,
    handleProcess,
  } = useAdminWalkin({
    isOpen,
    sessionId,
    onClose,
    onSuccess,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-3xl p-6 w-full max-w-[450px] shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-icsn-navy flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-icsn-teal" /> 
            Walk-in หน้าเคาน์เตอร์
          </h3>
          <button onClick={closeAndReset} className="text-muted-foreground hover:bg-muted p-2 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 && (
          <WalkinSearchStep
            phone={phone}
            setPhone={setPhone}
            isSearching={isSearching}
            handleSearch={handleSearch}
          />
        )}

        {step === 2 && (
          <WalkinActionStep
            phone={phone}
            searchResult={searchResult}
            selectedChildId={selectedChildId}
            setSelectedChildId={setSelectedChildId}
            newChildName={newChildName}
            setNewChildName={setNewChildName}
            showPackageSelect={showPackageSelect}
            setShowPackageSelect={setShowPackageSelect}
            packageOptions={packageOptions}
            selectedPackage={selectedPackage}
            setSelectedPackage={setSelectedPackage}
            isProcessing={isProcessing}
            handleProcess={handleProcess}
            handleReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}

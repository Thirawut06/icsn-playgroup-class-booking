import React from 'react';
import { Save } from 'lucide-react';
import { AdminModal, AdminInput, AdminButton } from '../../admin-ui';

interface PackageModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (val: boolean) => void;
  editingId: string | null;
  editName: string;
  setEditName: (val: string) => void;
  editPrice: string;
  setEditPrice: (val: string) => void;
  editCredits: string;
  setEditCredits: (val: string) => void;
  isProcessing: boolean;
  handleSave: () => void;
}

export function PackageModal({
  isModalOpen,
  setIsModalOpen,
  editingId,
  editName,
  setEditName,
  editPrice,
  setEditPrice,
  editCredits,
  setEditCredits,
  isProcessing,
  handleSave
}: PackageModalProps) {
  return (
    <AdminModal
      isOpen={isModalOpen}
      onClose={() => !isProcessing && setIsModalOpen(false)}
      title={editingId ? 'แก้ไขแพ็กเกจ (Edit Package)' : 'เพิ่มแพ็กเกจใหม่ (Add Package)'}
    >
      <div className="space-y-4">
        <AdminInput
          label="ชื่อแพ็กเกจ (Package Name)"
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="เช่น 10 Classes"
          autoFocus
        />
        <div className="grid grid-cols-2 gap-4">
          <AdminInput
            label="ราคา (Price)"
            type="number"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            leftIcon="฿"
            min="0"
          />
          <AdminInput
            label="เครดิต (Credits)"
            type="number"
            value={editCredits}
            onChange={(e) => setEditCredits(e.target.value)}
            min="1"
            className="text-center"
          />
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <AdminButton
            variant="secondary"
            onClick={() => setIsModalOpen(false)}
            disabled={isProcessing}
          >
            ยกเลิก
          </AdminButton>
          <AdminButton
            variant="primary"
            icon={Save}
            onClick={handleSave}
            isLoading={isProcessing}
          >
            บันทึกข้อมูล
          </AdminButton>
        </div>
      </div>
    </AdminModal>
  );
}

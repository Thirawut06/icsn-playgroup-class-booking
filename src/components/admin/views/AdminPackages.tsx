"use client";

import React from 'react';
import { Plus, AlertCircle, Package } from 'lucide-react';
import { 
  AdminButton,
  AdminConfirmModal,
  AdminInfoBox, 
  AdminPanel,
  AdminPanelHeader
} from '../admin-ui';
import { useAdminPackages } from './packages/useAdminPackages';
import { PackageTable } from './packages/PackageTable';
import { PackageModal } from './packages/PackageModal';

export function AdminPackages() {
  const {
    options,
    loading,
    isProcessing,
    isModalOpen,
    setIsModalOpen,
    editingId,
    editName,
    setEditName,
    editPrice,
    setEditPrice,
    editCredits,
    setEditCredits,
    deleteTarget,
    setDeleteTarget,
    toggleActive,
    startEdit,
    startAdd,
    handleSave,
    confirmDelete
  } = useAdminPackages();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPanel className="no-print">
        <AdminPanelHeader 
          icon={Package} 
          title="แพ็กเกจราคา (Packages & Pricing)" 
          action={
            <AdminButton variant="primary" icon={Plus} onClick={startAdd} disabled={isProcessing}>
              เพิ่มแพ็กเกจใหม่
            </AdminButton>
          }
        />
        <div className="p-0 sm:p-6 space-y-6">
          
          <AdminInfoBox
            title="เกี่ยวกับแพ็กเกจราคา"
            description={
              <>
                แพ็กเกจที่ตั้งค่าในหน้านี้ จะแสดงให้ผู้ปกครองเห็นในหน้าแรกของแอปพลิเคชัน<br />
                คุณสามารถเลือกเปิด/ปิดแพ็กเกจที่ไม่ต้องการใช้งานชั่วคราวได้
              </>
            }
            icon={AlertCircle}
          />

          <PackageTable
            options={options}
            loading={loading}
            isProcessing={isProcessing}
            toggleActive={toggleActive}
            startEdit={startEdit}
            setDeleteTarget={setDeleteTarget}
          />
        </div>
      </AdminPanel>

      <PackageModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        editingId={editingId}
        editName={editName}
        setEditName={setEditName}
        editPrice={editPrice}
        setEditPrice={setEditPrice}
        editCredits={editCredits}
        setEditCredits={setEditCredits}
        isProcessing={isProcessing}
        handleSave={handleSave}
      />

      <AdminConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="ยืนยันการลบแพ็กเกจ"
        message={`คุณต้องการลบแพ็กเกจ "${deleteTarget?.name}" ใช่หรือไม่? ข้อมูลประวัติการซื้อจะยังคงอยู่ แต่ผู้ใช้จะไม่สามารถซื้อแพ็กเกจนี้ได้อีก`}
        isDestructive={true}
        isLoading={isProcessing}
      />
    </div>
  );
}

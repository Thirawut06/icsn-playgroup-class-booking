import React from 'react';
import { Power } from 'lucide-react';
import { AdminButton } from '../../admin-ui';

interface DailyOpsToggleModalsProps {
  closeModalOpen: boolean;
  setCloseModalOpen: (open: boolean) => void;
  closeReason: string;
  setCloseReason: (reason: string) => void;
  handleCloseSession: (reason: string) => void;
  openModalOpen: boolean;
  setOpenModalOpen: (open: boolean) => void;
  handleOpenSession: () => void;
  togglingSession: boolean;
}

export function DailyOpsToggleModals({
  closeModalOpen,
  setCloseModalOpen,
  closeReason,
  setCloseReason,
  handleCloseSession,
  openModalOpen,
  setOpenModalOpen,
  handleOpenSession,
  togglingSession
}: DailyOpsToggleModalsProps) {
  return (
    <>
      {closeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-icsn-navy/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] w-full max-w-[400px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 pb-2 text-center">
              <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                <Power className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-icsn-navy mb-1">ยืนยันการปิดรับจองรอบนี้?</h3>
            </div>
            <div className="p-6 pt-4 space-y-4">
              <p className="text-sm text-error font-medium text-center">ระบบจะยกเลิกการจองและคืนเครดิตอัตโนมัติ<br/>(สำหรับ Walk-in ต้องโอนเงินคืนเอง)</p>
              <textarea
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                placeholder="กรุณากรอกเหตุผล (เช่น ครูลาป่วย, เต็มแล้ว)"
                className="w-full border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-icsn-teal resize-none bg-background"
                rows={3}
              />
            </div>
            <div className="p-4 pt-0 grid grid-cols-2 gap-3">
              <AdminButton variant="secondary" onClick={() => setCloseModalOpen(false)}>
                ยกเลิก
              </AdminButton>
              <AdminButton 
                variant="danger"
                onClick={() => {
                  handleCloseSession(closeReason);
                  setCloseModalOpen(false);
                  setCloseReason('');
                }}
                isLoading={togglingSession}
              >
                ยืนยันปิดรับจอง
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {openModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-icsn-navy/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] w-full max-w-[400px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                <Power className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-icsn-navy mb-2">ยืนยันเปิดรับจองรอบนี้อีกครั้ง?</h3>
              <p className="text-sm text-muted-foreground">ผู้ปกครองจะสามารถกลับมาจองคลาสนี้ได้ตามปกติ</p>
            </div>
            <div className="p-4 pt-0 grid grid-cols-2 gap-3">
              <AdminButton variant="secondary" onClick={() => setOpenModalOpen(false)}>
                ยกเลิก
              </AdminButton>
              <AdminButton 
                variant="primary"
                onClick={() => {
                  handleOpenSession();
                  setOpenModalOpen(false);
                }}
                isLoading={togglingSession}
              >
                ยืนยันเปิดรับจอง
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

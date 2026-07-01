'use client';

import React, { useRef, useState, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, RotateCcw, CheckCircle2, PenLine, Loader2 } from 'lucide-react';
import type { DailyAttendanceRow, Session } from '@/types';

// ─── Thai date formatter ─────────────────────────────────────────────────────
function formatThaiDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatThaiTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface ESignModalProps {
  isOpen: boolean;
  booking: DailyAttendanceRow;
  session: Session;
  sessionDate: string; // 'YYYY-MM-DD'
  onClose: () => void;
  onCheckin: (bookingId: string, signatureBlob: Blob) => Promise<void>;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function ESignModal({
  isOpen,
  booking,
  session,
  sessionDate,
  onClose,
  onCheckin,
}: ESignModalProps) {
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = useCallback(() => {
    sigCanvasRef.current?.clear();
    setIsEmpty(true);
  }, []);

  const handleStrokeEnd = useCallback(() => {
    setIsEmpty(sigCanvasRef.current?.isEmpty() ?? true);
  }, []);

  const handleConfirm = async () => {
    if (isEmpty || !sigCanvasRef.current) return;

    setIsSubmitting(true);
    try {
      // Trim whitespace and export as PNG blob
      const dataUrl = sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      await onCheckin(booking.id, blob);
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = useCallback(() => {
    // Reset state on close
    setIsSuccess(false);
    setIsEmpty(true);
    sigCanvasRef.current?.clear();
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    // Full-screen overlay – Absolute Minimalist (กระดาษเปล่า 100%)
    <div
      className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
    >
      {isSuccess ? (
        // ── Success Screen ──
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center bg-white">
          <CheckCircle2 className="w-24 h-24 text-black" />
          <h2 className="text-4xl font-bold text-black mb-2">เช็คอินสำเร็จ!</h2>
          <p className="text-xl text-gray-600">
            <span className="font-bold text-black">{booking.nickname}</span> ลงชื่อเข้าเรียนเรียบร้อยแล้ว
          </p>
          <button
            id="esign-modal-done"
            onClick={handleClose}
            className="mt-8 px-12 py-4 bg-black text-white rounded font-bold text-xl hover:bg-gray-800 transition active:scale-95"
          >
            ปิด (Close)
          </button>
        </div>
      ) : (
        <>
          {/* ── Top Info & Close Button (Floating) ── */}
          <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start pointer-events-none z-10">
            <div className="pointer-events-auto">
              <h1 className="text-lg font-bold text-black mb-4">ลงชื่อเข้าเรียน</h1>
              
              <div className="flex flex-col gap-3 text-black">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase mb-0.5">วันที่ / รอบ</p>
                  <p className="text-sm font-medium">{formatThaiDate(sessionDate)} {session.time_label}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase mb-0.5">ชื่อเด็ก</p>
                  <p className="text-sm font-medium">
                    {booking.nickname}
                    {booking.full_name && booking.full_name !== booking.nickname && (
                      <span className="text-gray-500 ml-1">({booking.full_name})</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase mb-0.5">ผู้ปกครอง</p>
                  <p className="text-sm font-medium">
                    {booking.parent_name} <span className="text-gray-500 ml-1">{booking.parent_phone}</span>
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleClose}
              className="pointer-events-auto p-4 text-black hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-8 h-8" />
            </button>
          </div>

          {/* ── Signature Canvas (Full Screen, No Borders) ── */}
          <div className="flex-1 relative w-full h-full cursor-crosshair">
            {isEmpty && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                <PenLine className="w-32 h-32 text-gray-400" />
              </div>
            )}
            <SignatureCanvas
              ref={sigCanvasRef}
              penColor="#000000"
              minWidth={2}
              maxWidth={5}
              velocityFilterWeight={0.7}
              onEnd={handleStrokeEnd}
              canvasProps={{
                className: 'w-full h-full touch-none',
                style: { width: '100%', height: '100%' },
              }}
            />
          </div>

          {/* ── Bottom Right Actions (Floating) ── */}
          <div className="absolute bottom-0 right-0 p-8 flex gap-4 pointer-events-none z-10">
            <button
              onClick={handleClear}
              disabled={isSubmitting || isEmpty}
              className="pointer-events-auto px-8 py-4 text-black font-bold hover:bg-gray-100 rounded transition disabled:opacity-30 disabled:bg-transparent"
            >
              ล้าง
            </button>
            
            <button
              onClick={handleConfirm}
              disabled={isSubmitting || isEmpty}
              className="pointer-events-auto px-8 py-4 bg-icsn-teal text-white font-bold rounded hover:bg-icsn-teal/90 transition disabled:opacity-30 disabled:bg-gray-300 disabled:text-gray-500 flex items-center gap-3 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" /> กำลังบันทึก...
                </>
              ) : (
                'ยืนยัน'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

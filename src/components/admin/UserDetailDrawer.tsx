"use client";

import React, { useState, useEffect } from 'react';
import { X, User, Loader2 } from 'lucide-react';
import { AdminService } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { AdminManageCreditsModal } from './AdminManageCreditsModal';

// Imported Extracted Sections
import { ChildrenProfileSection } from './user-detail/ChildrenProfileSection';
import { ParentContactSection } from './user-detail/ParentContactSection';
import { PackagesCreditsSection } from './user-detail/PackagesCreditsSection';
import { BookingsSection } from './user-detail/BookingsSection';
import { AdminNotesSection } from './user-detail/AdminNotesSection';

interface UserDetailDrawerProps {
  parentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailDrawer({ parentId, isOpen, onClose }: UserDetailDrawerProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Manage Credits & Booking Modal State
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [manageModalMode, setManageModalMode] = useState<'credits' | 'book'>('credits');

  useEffect(() => {
    if (isOpen && parentId) {
      fetchDetails();
    }
  }, [isOpen, parentId]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const details = await AdminService.getUserFullDetails(parentId);
      setData(details);
    } catch (err: unknown) {
      toast.error("Failed to load user details: " + (err instanceof Error ? err.message : String(err)));
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" 
        onClick={onClose} 
      />
      
      <div className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-icsn-teal/10 flex items-center justify-center text-icsn-teal">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">รายละเอียดผู้ใช้งาน</h2>
              <p className="text-sm text-muted-foreground">ข้อมูลทั้งหมดที่เกี่ยวข้องกับผู้ใช้งานนี้</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted/80 rounded-full transition-colors text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-white">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-icsn-teal" />
            </div>
          ) : data ? (
            <div className="space-y-8">
              
              <ChildrenProfileSection 
                childrenData={data.children} 
                onRefresh={fetchDetails} 
              />

              <ParentContactSection 
                parentId={parentId} 
                data={data} 
                onRefresh={fetchDetails} 
              />

              <PackagesCreditsSection 
                data={data} 
                onOpenCreditModal={() => {
                  setManageModalMode('credits');
                  setIsManageModalOpen(true);
                }}
                onOpenBookingModal={() => {
                  setManageModalMode('book');
                  setIsManageModalOpen(true);
                }}
              />

              <BookingsSection 
                bookings={data.bookings} 
              />

              <AdminNotesSection 
                parentId={parentId} 
                initialNotes={data.admin_notes || ''} 
              />

            </div>
          ) : (
            <div className="text-center text-muted-foreground mt-10">ไม่พบข้อมูล</div>
          )}
        </div>
      </div>

      {data && (
        <AdminManageCreditsModal
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          initialMode={manageModalMode}
          parentId={parentId}
          parentPhone={data.phone}
          childrenList={data.children || []}
          totalCredits={data.packages?.reduce((sum: number, pkg: any) => sum + (pkg.credits_remaining || 0), 0) || 0}
          onSuccess={() => {
            fetchDetails(); // Refresh details to show new credits/bookings
          }}
        />
      )}
    </>
  );
}

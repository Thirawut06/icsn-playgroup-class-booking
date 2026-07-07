"use client";

import React, { useState } from 'react';
import { AlertCircle, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { Child } from '@/types';
import { ParentService } from '@/lib/services/parent.service';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import toast from 'react-hot-toast';

interface MissingPhotoBlockerProps {
  childrenMissingPhotos: Child[];
  parentId: string;
  onUploadSuccess: () => Promise<void>;
}

export function MissingPhotoBlocker({ childrenMissingPhotos, parentId, onUploadSuccess }: MissingPhotoBlockerProps) {
  const { dict } = useDictionary();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorToast, setErrorToast] = useState('');
  
  // Store files per child: childId -> { parentPhoto: File|null, childPhoto: File|null }
  const [files, setFiles] = useState<Record<string, { parentPhoto: File | null, childPhoto: File | null }>>({});

  const handleFileChange = (childId: string, type: 'parent' | 'child', file: File | null) => {
    setFiles(prev => ({
      ...prev,
      [childId]: {
        ...prev[childId],
        [type === 'parent' ? 'parentPhoto' : 'childPhoto']: file
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorToast('');
    setIsSubmitting(true);

    try {
      // Validate all missing files are provided
      for (const child of childrenMissingPhotos) {
        const needsParent = !child.parent_photo_url;
        const needsChild = !child.photo_url;
        const childFiles = files[child.id] || {};

        if (needsParent && !childFiles.parentPhoto) {
          throw new Error(`กรุณาอัปโหลดรูปผู้ปกครองสำหรับน้อง ${child.nickname || child.full_name}`);
        }
        if (needsChild && !childFiles.childPhoto) {
          throw new Error(`กรุณาอัปโหลดรูปของน้อง ${child.nickname || child.full_name}`);
        }
      }

      // Upload and update for each child
      for (const child of childrenMissingPhotos) {
        const childFiles = files[child.id];
        let actualParentPhotoUrl = null;
        let actualChildPhotoUrl = null;

        if (childFiles.parentPhoto) {
          const ext = childFiles.parentPhoto.name.split('.').pop() || 'jpg';
          const fileName = `${parentId}_parent_${Date.now()}.${ext}`;
          actualParentPhotoUrl = await ParentService.uploadFile('profiles', childFiles.parentPhoto, fileName);
        }

        if (childFiles.childPhoto) {
          const ext = childFiles.childPhoto.name.split('.').pop() || 'jpg';
          const fileName = `${parentId}_child_${Date.now()}.${ext}`;
          actualChildPhotoUrl = await ParentService.uploadFile('profiles', childFiles.childPhoto, fileName);
        }

        await ParentService.updateChildPhotos(child.id, actualChildPhotoUrl, actualParentPhotoUrl);
      }

      toast.success('อัปโหลดรูปภาพสำเร็จ');
      await onUploadSuccess();
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      setErrorToast(error.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-icsn-bg/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 font-sarabun overflow-y-auto">
      {errorToast && (
        <div className="fixed top-6 left-1/2 z-[10000] max-w-[400px] w-[calc(100%-48px)]" style={{ transform: 'translateX(-50%)', animation: 'toastIn 0.25s ease-out' }}>
          <div className="bg-error text-white px-5 py-4 rounded-2xl shadow-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="font-bold text-sm leading-snug flex-1">{errorToast}</p>
            <button onClick={() => setErrorToast('')} className="text-white/70 hover:text-white shrink-0">
              <span className="text-lg leading-none">&times;</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-6 md:p-8 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-warning" />
          </div>
          <h2 className="text-2xl font-bold text-icsn-navy mb-2">ข้อมูลรูปภาพไม่ครบถ้วน</h2>
          <p className="text-muted-foreground text-sm">
            กรุณาอัปโหลดรูปภาพเพื่อดำเนินการต่อ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {childrenMissingPhotos.map(child => {
            const needsParent = !child.parent_photo_url;
            const needsChild = !child.photo_url;
            const childFiles = files[child.id] || {};

            return (
              <div key={child.id} className="bg-muted/30 border border-border p-5 rounded-2xl space-y-5">
                <h3 className="font-bold text-icsn-navy flex items-center gap-2 text-lg">
                  <span className="w-2 h-2 rounded-full bg-icsn-teal"></span>
                  น้อง {child.nickname || child.full_name}
                </h3>

                {needsParent && (
                  <div>
                    <label className="block mb-1.5">
                      <span className="text-base font-bold text-foreground">{dict.apply.parentPhoto} <span className="text-error">*</span></span>
                      <span className="block text-sm text-muted-foreground -mt-0.5">{dict.apply.parentPhotoHint}</span>
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      onChange={(e) => handleFileChange(child.id, 'parent', e.target.files?.[0] || null)}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-icsn-teal/10 file:text-icsn-teal hover:file:bg-icsn-teal/20 border border-border rounded-xl bg-white mb-1.5 cursor-pointer outline-none"
                    />
                    <span className="block text-xs text-muted-foreground/70">{dict.apply.uploadLimit}</span>
                    {childFiles.parentPhoto && (
                      <div className="mt-2 text-xs text-success flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-4 h-4" /> เลือกไฟล์แล้ว: {childFiles.parentPhoto.name}
                      </div>
                    )}
                  </div>
                )}

                {needsChild && (
                  <div>
                    <label className="block mb-1.5">
                      <span className="text-base font-bold text-foreground">{dict.apply.childPhoto} <span className="text-error">*</span></span>
                      <span className="block text-sm text-muted-foreground -mt-0.5">{dict.apply.childPhotoHint}</span>
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      onChange={(e) => handleFileChange(child.id, 'child', e.target.files?.[0] || null)}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-icsn-teal/10 file:text-icsn-teal hover:file:bg-icsn-teal/20 border border-border rounded-xl bg-white mb-1.5 cursor-pointer outline-none"
                    />
                    <span className="block text-xs text-muted-foreground/70">{dict.apply.uploadLimit}</span>
                    {childFiles.childPhoto && (
                      <div className="mt-2 text-xs text-success flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-4 h-4" /> เลือกไฟล์แล้ว: {childFiles.childPhoto.name}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 bg-icsn-teal text-white rounded-2xl font-bold text-lg hover:bg-icsn-teal/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-icsn-teal/20"
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Upload className="w-5 h-5" />
                อัปโหลดรูปภาพและดำเนินการต่อ
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

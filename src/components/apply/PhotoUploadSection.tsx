import React from 'react';
import { COPY } from '@/config/copy';

interface PhotoUploadSectionProps {
  path: 'trial' | 'payment' | null;
  parentPhotoData: string;
  setParentPhotoData: (val: string) => void;
  setParentPhotoFile: (file: File | null) => void;
  childPhotoData: string;
  setChildPhotoData: (val: string) => void;
  setChildPhotoFile: (file: File | null) => void;
  handleFile: (e: React.ChangeEvent<HTMLInputElement>, setData: React.Dispatch<React.SetStateAction<string>>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => void;
}

export function PhotoUploadSection({
  path,
  parentPhotoData,
  setParentPhotoData,
  setParentPhotoFile,
  childPhotoData,
  setChildPhotoData,
  setChildPhotoFile,
  handleFile
}: PhotoUploadSectionProps) {
  if (path !== 'trial') return null;

  return (
    <>
      <div className="border-b border-border pb-3 mt-8">
        <h3 className="text-lg font-bold text-icsn-navy">Photos (Trial Only)</h3>
        <p className="text-sm text-muted-foreground font-medium">{COPY.APPLY_FLOW.PHOTO_TITLE}</p>
      </div>

      <div>
        <label className="block mb-1.5">
          <span className="text-base font-bold text-foreground">Individual Parent&apos;s Photo <span className="text-error">*</span></span>
          <span className="block text-sm text-muted-foreground -mt-0.5">{COPY.APPLY_FLOW.PHOTO_PARENT_HINT}</span>
        </label>
        <input
          type="file"
          accept="image/*,.heic,.heif"
          onChange={(e) => handleFile(e, setParentPhotoData as any, setParentPhotoFile as any)}
          required
          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-icsn-teal/10 file:text-icsn-teal hover:file:bg-icsn-teal/20 border border-border rounded-xl bg-white mb-1.5 cursor-pointer outline-none"
        />
        <span className="block text-xs text-muted-foreground/70">{COPY.APPLY_FLOW.UPLOAD_LIMIT}</span>
        {parentPhotoData && (
          <div className="mt-2 w-28 h-28 rounded-xl overflow-hidden border border-border bg-muted">
            <img src={parentPhotoData} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div>
        <label className="block mb-1.5">
          <span className="text-base font-bold text-foreground">Individual Child&apos;s Photo <span className="text-error">*</span></span>
          <span className="block text-sm text-muted-foreground -mt-0.5">{COPY.APPLY_FLOW.PHOTO_CHILD_HINT}</span>
        </label>
        <input
          type="file"
          accept="image/*,.heic,.heif"
          onChange={(e) => handleFile(e, setChildPhotoData as any, setChildPhotoFile as any)}
          required
          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-icsn-teal/10 file:text-icsn-teal hover:file:bg-icsn-teal/20 border border-border rounded-xl bg-white mb-1.5 cursor-pointer outline-none"
        />
        <span className="block text-xs text-muted-foreground/70">{COPY.APPLY_FLOW.UPLOAD_LIMIT}</span>
        {childPhotoData && (
          <div className="mt-2 w-28 h-28 rounded-xl overflow-hidden border border-border bg-muted">
            <img src={childPhotoData} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </>
  );
}

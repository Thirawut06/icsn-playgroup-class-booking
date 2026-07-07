import React from 'react';
import { useDictionary } from '@/lib/i18n/dictionary-context';

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
  const { dict } = useDictionary();
  if (path !== 'trial') return null;

  return (
    <>
      <div className="border-b border-border pb-3 mt-8">
        <h3 className="text-lg font-bold text-icsn-navy">{dict.apply.photosTitle}</h3>
      </div>

      <div>
        <label className="block mb-1.5">
          <span className="text-base font-bold text-foreground">{dict.apply.parentPhoto} <span className="text-error">*</span></span>
          <span className="block text-sm text-muted-foreground -mt-0.5">{dict.apply.parentPhotoHint}</span>
        </label>
        <input
          type="file"
          accept="image/jpeg, image/png, image/webp"
          onChange={(e) => handleFile(e, setParentPhotoData as any, setParentPhotoFile as any)}
          required={!parentPhotoData}
          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-icsn-teal/10 file:text-icsn-teal hover:file:bg-icsn-teal/20 border border-border rounded-xl bg-white mb-1.5 cursor-pointer outline-none"
        />
        <span className="block text-xs text-muted-foreground/70">{dict.apply.uploadLimit}</span>
        {parentPhotoData && (
          <div className="mt-2 w-28 h-28 rounded-xl overflow-hidden border border-border bg-muted">
            <img src={parentPhotoData} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div>
        <label className="block mb-1.5">
          <span className="text-base font-bold text-foreground">{dict.apply.childPhoto} <span className="text-error">*</span></span>
          <span className="block text-sm text-muted-foreground -mt-0.5">{dict.apply.childPhotoHint}</span>
        </label>
        <input
          type="file"
          accept="image/jpeg, image/png, image/webp"
          onChange={(e) => handleFile(e, setChildPhotoData as any, setChildPhotoFile as any)}
          required={!childPhotoData}
          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-icsn-teal/10 file:text-icsn-teal hover:file:bg-icsn-teal/20 border border-border rounded-xl bg-white mb-1.5 cursor-pointer outline-none"
        />
        <span className="block text-xs text-muted-foreground/70">{dict.apply.uploadLimit}</span>
        {childPhotoData && (
          <div className="mt-2 w-28 h-28 rounded-xl overflow-hidden border border-border bg-muted">
            <img src={childPhotoData} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </>
  );
}

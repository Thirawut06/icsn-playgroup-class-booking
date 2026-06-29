import React from 'react';

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
      <div className="border-b border-gray-100 pb-3 mt-8">
        <h3 className="text-lg font-bold text-icsn-navy">Photos (Trial Only)</h3>
        <p className="text-sm text-gray-500 font-medium">รูปถ่ายสำหรับการทดลองเรียน</p>
      </div>

      <div>
        <label className="block mb-1.5">
          <span className="text-base font-bold text-gray-800">Individual Parent&apos;s Photo <span className="text-red-500">*</span></span>
          <span className="block text-sm text-gray-500 -mt-0.5">รูปถ่ายผู้ปกครองเดี่ยวชัดเจน</span>
        </label>
        <input
          type="file"
          accept="image/*,.heic,.heif"
          onChange={(e) => handleFile(e, setParentPhotoData, setParentPhotoFile as any)}
          required
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-icsn-teal/10 file:text-icsn-teal hover:file:bg-icsn-teal/20 border border-gray-200 rounded-xl bg-white mb-1.5 cursor-pointer outline-none"
        />
        <span className="block text-xs text-gray-400">อัปโหลดไฟล์ที่รองรับ 1 รายการ ขนาดสูงสุด 10 MB</span>
        {parentPhotoData && (
          <div className="mt-2 w-28 h-28 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            <img src={parentPhotoData} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div>
        <label className="block mb-1.5">
          <span className="text-base font-bold text-gray-800">Individual Child&apos;s Photo <span className="text-red-500">*</span></span>
          <span className="block text-sm text-gray-500 -mt-0.5">รูปถ่ายบุตรหลานเดี่ยวชัดเจน (ไม่ใส่แว่นกันแดดหรือหมวก)</span>
        </label>
        <input
          type="file"
          accept="image/*,.heic,.heif"
          onChange={(e) => handleFile(e, setChildPhotoData, setChildPhotoFile as any)}
          required
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-icsn-teal/10 file:text-icsn-teal hover:file:bg-icsn-teal/20 border border-gray-200 rounded-xl bg-white mb-1.5 cursor-pointer outline-none"
        />
        <span className="block text-xs text-gray-400">อัปโหลดไฟล์ที่รองรับ 1 รายการ ขนาดสูงสุด 10 MB</span>
        {childPhotoData && (
          <div className="mt-2 w-28 h-28 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            <img src={childPhotoData} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </>
  );
}

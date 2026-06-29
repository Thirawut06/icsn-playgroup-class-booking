import React from 'react';
import { Input } from '@/components/ui/input';

interface ParentInfoSectionProps {
  path: 'trial' | 'payment' | null;
  parentName: string;
  setParentName: (val: string) => void;
  parentPhone: string;
  setParentPhone: (val: string) => void;
  isReturningParent: boolean;
}

export function ParentInfoSection({
  path,
  parentName,
  setParentName,
  parentPhone,
  setParentPhone,
  isReturningParent
}: ParentInfoSectionProps) {
  return (
    <>
      <div className="border-b border-gray-100 pb-3">
        <h3 className="text-lg font-bold text-icsn-navy">
          {path === 'trial' ? 'Further Information' : 'Personal Information'}
        </h3>
        <p className="text-sm text-gray-500 font-medium">
          {path === 'trial' ? 'ข้อมูลเพิ่มเติม' : 'ข้อมูลส่วนบุคคล'}
        </p>
      </div>

      <div>
        <label className="block mb-1.5">
          <span className="text-base font-bold text-gray-800">Parent&apos;s full name <span className="text-red-500">*</span></span>
          <span className="block text-sm text-gray-500 -mt-0.5">ชื่อ-นามสกุลผู้ปกครอง</span>
        </label>
        <Input
          type="text"
          value={parentName}
          onChange={(e) => setParentName(e.target.value)}
          required
          disabled={isReturningParent}
          className="w-full h-12 rounded-xl bg-gray-50/50 disabled:bg-gray-100 disabled:text-gray-400"
        />
      </div>

      <div>
        <label className="block mb-1.5">
          <span className="text-base font-bold text-gray-800">Parent&apos;s telephone number <span className="text-red-500">*</span></span>
          <span className="block text-sm text-gray-500 -mt-0.5">หมายเลขโทรศัพท์ผู้ปกครอง</span>
        </label>
        <Input
          type="tel"
          value={parentPhone}
          onChange={(e) => setParentPhone(e.target.value)}
          required
          disabled={isReturningParent}
          className="w-full h-12 rounded-xl bg-gray-50/50 disabled:bg-gray-100 disabled:text-gray-400"
        />
      </div>
    </>
  );
}

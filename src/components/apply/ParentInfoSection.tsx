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
      <div className="border-b border-border pb-3">
        <h3 className="text-lg font-bold text-icsn-navy">
          {path === 'trial' ? 'Further Information' : 'Personal Information'}
        </h3>
        <p className="text-sm text-muted-foreground font-medium">
          {path === 'trial' ? 'ข้อมูลเพิ่มเติม' : 'ข้อมูลส่วนบุคคล'}
        </p>
      </div>

      <div>
        <label className="block mb-1.5">
          <span className="text-base font-bold text-foreground">Parent&apos;s full name <span className="text-error">*</span></span>
          <span className="block text-sm text-muted-foreground -mt-0.5">ชื่อ-นามสกุลผู้ปกครอง</span>
        </label>
        <Input
          type="text"
          value={parentName}
          onChange={(e) => setParentName(e.target.value)}
          required
          disabled={isReturningParent}
          className="w-full h-12 rounded-xl bg-muted/50 disabled:bg-muted disabled:text-muted-foreground/70"
        />
      </div>

      <div>
        <label className="block mb-1.5">
          <span className="text-base font-bold text-foreground">Parent&apos;s telephone number <span className="text-error">*</span></span>
          <span className="block text-sm text-muted-foreground -mt-0.5">หมายเลขโทรศัพท์ผู้ปกครอง</span>
        </label>
        <Input
          type="tel"
          value={parentPhone}
          onChange={(e) => setParentPhone(e.target.value)}
          required
          disabled={isReturningParent}
          className="w-full h-12 rounded-xl bg-muted/50 disabled:bg-muted disabled:text-muted-foreground/70"
        />
      </div>
    </>
  );
}

import React from 'react';
import { Input } from '@/components/ui/input';
import { useDictionary } from '@/lib/i18n/dictionary-context';

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
  const { dict } = useDictionary();

  return (
    <>
      <div className="border-b border-border pb-3">
        <h3 className="text-lg font-bold text-icsn-navy">
          {path === 'trial' ? dict.apply.furtherInfo : dict.apply.personalInfo}
        </h3>
      </div>

      <div>
        <label className="block mb-1.5">
          <span className="text-base font-bold text-foreground">{dict.apply.parentName} <span className="text-error">*</span></span>
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
          <span className="text-base font-bold text-foreground">{dict.apply.parentPhone} <span className="text-error">*</span></span>
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

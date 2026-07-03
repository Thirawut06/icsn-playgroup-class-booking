import React from 'react';
import { Input } from '@/components/ui/input';
import { useDictionary } from '@/lib/i18n/dictionary-context';

interface ChildInfoSectionProps {
  path: 'trial' | 'payment' | null;
  childName: string;
  setChildName: (val: string) => void;
  childNickname: string;
  setChildNickname: (val: string) => void;
  childDob: string;
  setChildDob: (val: string) => void;
  allergy: string;
  setAllergy: (val: string) => void;
  info: string;
  setInfo: (val: string) => void;
  todayStr: string;
}

export function ChildInfoSection({
  path,
  childName,
  setChildName,
  childNickname,
  setChildNickname,
  childDob,
  setChildDob,
  allergy,
  setAllergy,
  info,
  setInfo,
  todayStr
}: ChildInfoSectionProps) {
  const { dict } = useDictionary();

  return (
    <>
      <div className="border-b border-border pb-3 mt-8">
        <h3 className="text-lg font-bold text-icsn-navy">{dict.apply.studentInfo}</h3>
      </div>

      <div>
        <label className="block mb-1.5">
          <span className="text-base font-bold text-foreground">{dict.apply.childName} <span className="text-error">*</span></span>
        </label>
        <Input type="text" value={childName} onChange={(e) => setChildName(e.target.value)} required className="w-full h-12 rounded-xl bg-muted/50" />
      </div>

      <div>
        <label className="block mb-1.5">
          <span className="text-base font-bold text-foreground">{dict.apply.childNickname} <span className="text-error">*</span></span>
        </label>
        <Input type="text" value={childNickname} onChange={(e) => setChildNickname(e.target.value)} required className="w-full h-12 rounded-xl bg-muted/50" />
      </div>

      <div>
        <label className="block mb-1.5">
          <span className="text-base font-bold text-foreground">{dict.apply.childDob} <span className="text-error">*</span></span>
        </label>
        <Input type="date" value={childDob} max={todayStr} onChange={(e) => setChildDob(e.target.value)} required className="w-full h-12 rounded-xl bg-muted/50" />
      </div>

      {path === 'trial' && (
        <>
          <div>
            <label className="block mb-1.5">
              <span className="text-base font-bold text-foreground">{dict.apply.allergy}</span>
            </label>
            <Input
              type="text"
              value={allergy}
              onChange={(e) => setAllergy(e.target.value)}
              placeholder={dict.apply.allergyPlaceholder}
              className="w-full h-12 rounded-xl bg-muted/50"
            />
          </div>

          <div>
            <label className="block mb-1.5">
              <span className="text-base font-bold text-foreground">{dict.apply.childConcerns}</span>
            </label>
            <textarea
              value={info}
              onChange={(e) => setInfo(e.target.value)}
              rows={3}
              placeholder={dict.apply.childConcernsPlaceholder}
              className="w-full border border-border rounded-xl px-4 py-3 text-base bg-muted/50 outline-none resize-none focus:border-icsn-teal transition-all"
            />
          </div>
        </>
      )}
    </>
  );
}

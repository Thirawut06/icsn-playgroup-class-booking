import React from 'react';
import { useDictionary } from '@/lib/i18n/dictionary-context';

interface AgreementsSectionProps {
  path: 'trial' | 'payment' | null;
  mediaPerm: string;
  setMediaPerm: (val: string) => void;
  noPhotoPerm: boolean;
  setNoPhotoPerm: (val: boolean) => void;
  nonRefundable: boolean;
  setNonRefundable: (val: boolean) => void;
}

export function AgreementsSection({
  path,
  mediaPerm,
  setMediaPerm,
  noPhotoPerm,
  setNoPhotoPerm,
  nonRefundable,
  setNonRefundable
}: AgreementsSectionProps) {
  const { dict } = useDictionary();
  const radioClass = path === 'payment' ? 'custom-radio-pink' : 'custom-radio';
  const checkboxClass = path === 'payment' ? 'custom-checkbox-pink' : 'custom-checkbox';

  return (
    <div className="space-y-5 pt-4 border-t border-border">
      {/* Media Permission */}
      <div>
        <span className="block text-[13.5px] font-medium text-foreground leading-relaxed mb-2">
          {dict.apply.mediaPermission} <span className="text-error">*</span>
        </span>
        <div className="flex gap-6 mt-2 pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="Yes" checked={mediaPerm === 'Yes'} onChange={() => setMediaPerm('Yes')} className={radioClass} />
            <span className="text-[13.5px] font-medium text-foreground">{dict.apply.yes}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="No" checked={mediaPerm === 'No'} onChange={() => setMediaPerm('No')} className={radioClass} />
            <span className="text-[13.5px] font-medium text-foreground">{dict.apply.no}</span>
          </label>
        </div>
      </div>

      {/* Non-refundable (Payment Only) */}
      {path === 'payment' && (
        <div>
          <label className="flex items-start gap-3 cursor-pointer p-3.5 bg-muted rounded-xl border border-border">
            <input
              type="checkbox"
              checked={nonRefundable}
              onChange={(e) => setNonRefundable(e.target.checked)}
              className={`mt-1 ${checkboxClass}`}
            />
            <div>
              <span className="block text-sm font-bold text-foreground leading-relaxed">
                {dict.apply.nonRefundable} <span className="text-error">*</span>
              </span>
            </div>
          </label>
        </div>
      )}

      {/* No Photo Permission */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer p-3.5 bg-muted rounded-xl border border-border">
          <input
            type="checkbox"
            checked={noPhotoPerm}
            onChange={(e) => setNoPhotoPerm(e.target.checked)}
            className={`mt-1 ${checkboxClass}`}
          />
          <div>
            <span className="block text-sm font-bold text-foreground leading-relaxed">
              {dict.apply.noPhotoAgreement} <span className="text-error">*</span>
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}

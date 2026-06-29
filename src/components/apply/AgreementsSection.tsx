import React from 'react';

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
  // We use different radio class based on path for UI consistency
  const radioClass = path === 'payment' ? 'custom-radio-pink' : 'custom-radio';
  const checkboxClass = path === 'payment' ? 'custom-checkbox-pink' : 'custom-checkbox';

  return (
    <div className="space-y-5 pt-4 border-t border-border">
      {/* Media Permission */}
      <div>
        <span className="block text-[13.5px] font-bold text-foreground leading-relaxed mb-2">
          I give permission for ICSN to use photos or videos (i.e. &quot;media&quot;) taken of my child in school-related academic and social activities. I understand and agree that this media may be used for promotional and marketing purposes without compensation. <span className="text-error">*</span><br />
          <span className="text-xs text-muted-foreground font-normal mt-1 block leading-relaxed">
            ข้าพเจ้าอนุญาตให้ ICSN ใช้รูปถ่ายหรือวิดีโอ (หรือที่เรียกว่า &quot;สื่อ&quot;) ที่ถ่ายจากกิจกรรมทางการศึกษาและสังคมของบุตรหลานข้าพเจ้าในโรงเรียน ข้าพเจ้าทราบและยอมรับว่าสื่อดังกล่าวอาจถูกนำไปใช้เพื่อการประชาสัมพันธ์และการตลาดโดยไม่ขอค่าตอบแทน
          </span>
        </span>
        <div className="flex gap-6 mt-2 pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="Yes" checked={mediaPerm === 'Yes'} onChange={() => setMediaPerm('Yes')} className={radioClass} />
            <span className="text-[13.5px] font-medium text-foreground">Yes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="No" checked={mediaPerm === 'No'} onChange={() => setMediaPerm('No')} className={radioClass} />
            <span className="text-[13.5px] font-medium text-foreground">No</span>
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
                By checking this box, you agree that this payment is non-refundable. <span className="text-error">*</span>
              </span>
              <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">
                โดยการทำเครื่องหมายในช่องนี้ ถือว่าท่านยอมรับว่าการชำระเงินนี้ไม่สามารถขอคืนได้
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
              By checking the box, I agree not to take pictures of other students in the school for posting on social media. <span className="text-error">*</span>
            </span>
            <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">
              โดยการเลือกช่องนี้ ข้าพเจ้ายินยอมไม่ถ่ายรูปนักเรียนคนอื่นภายในโรงเรียนเพื่อโพสต์ในสื่อโซเชียล
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}

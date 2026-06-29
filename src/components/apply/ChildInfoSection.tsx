import React from 'react';
import { Input } from '@/components/ui/input';

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
  return (
    <>
      <div className="border-b border-border pb-3 mt-8">
        <h3 className="text-lg font-bold text-icsn-navy">Student Information</h3>
        <p className="text-sm text-muted-foreground font-medium">ข้อมูลนักเรียน</p>
      </div>

      <div>
        <label className="block mb-1.5">
          <span className="text-base font-bold text-foreground">Child&apos;s full name <span className="text-error">*</span></span>
          <span className="block text-sm text-muted-foreground -mt-0.5">ชื่อ-นามสกุลนักเรียน</span>
        </label>
        <Input type="text" value={childName} onChange={(e) => setChildName(e.target.value)} required className="w-full h-12 rounded-xl bg-muted/50" />
      </div>

      <div>
        <label className="block mb-1.5">
          <span className="text-base font-bold text-foreground">Child&apos;s nickname <span className="text-error">*</span></span>
          <span className="block text-sm text-muted-foreground -mt-0.5">ชื่อเล่นนักเรียน</span>
        </label>
        <Input type="text" value={childNickname} onChange={(e) => setChildNickname(e.target.value)} required className="w-full h-12 rounded-xl bg-muted/50" />
      </div>

      <div>
        <label className="block mb-1.5">
          <span className="text-base font-bold text-foreground">Date of birth <span className="text-error">*</span></span>
          <span className="block text-sm text-muted-foreground -mt-0.5">วันเดือนปีเกิด</span>
        </label>
        <Input type="date" value={childDob} max={todayStr} onChange={(e) => setChildDob(e.target.value)} required className="w-full h-12 rounded-xl bg-muted/50" />
      </div>

      {path === 'trial' && (
        <>
          <div>
            <label className="block mb-1.5">
              <span className="text-base font-bold text-foreground">Allergy (if any)</span>
              <span className="block text-sm text-muted-foreground -mt-0.5">มีข้อมูลการแพ้อาหารหรือสิ่งอื่นหรือไม่</span>
            </label>
            <Input
              type="text"
              value={allergy}
              onChange={(e) => setAllergy(e.target.value)}
              placeholder="ระบุอาการแพ้เพื่อความปลอดภัย (หากไม่มีสามารถเว้นว่างได้)"
              className="w-full h-12 rounded-xl bg-muted/50"
            />
          </div>

          <div>
            <label className="block mb-1.5">
              <span className="text-base font-bold text-foreground">Any information or concerns regarding your child that you would like to share with the school?</span>
              <span className="block text-sm text-muted-foreground -mt-0.5">มีข้อมูลหรือข้อกังวลเกี่ยวกับบุตรหลานของท่านที่ต้องการแจ้งให้โรงเรียนทราบหรือไม่</span>
            </label>
            <textarea
              value={info}
              onChange={(e) => setInfo(e.target.value)}
              rows={3}
              placeholder="ระบุพฤติกรรมพิเศษ หรือ สุขภาพที่ทางคุณครูควรดูแลอย่างใกล้ชิด"
              className="w-full border border-border rounded-xl px-4 py-3 text-base bg-muted/50 outline-none resize-none focus:border-icsn-teal transition-all"
            />
          </div>
        </>
      )}
    </>
  );
}

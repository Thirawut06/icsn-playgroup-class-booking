import React from 'react';
import { Ticket, Wallet, ChevronRight } from 'lucide-react';

interface PathSelectorProps {
  setPath: (path: 'trial' | 'payment') => void;
}

export function PathSelector({ setPath }: PathSelectorProps) {
  return (
    <div className="px-6 py-6 relative z-10">
      <h2 className="text-lg font-bold text-center text-icsn-navy mb-6">
        Please select your registration path<br/>
        <span className="text-xs text-muted-foreground font-normal block mt-1">เลือกทางเลือกเพื่อสั่งซื้อสิทธิ์หรือลงทะเบียนเรียน</span>
      </h2>

      <div className="space-y-4">
        <button
          onClick={() => setPath('trial')}
          className="w-full bg-white border-2 border-border hover:border-icsn-teal rounded-2xl p-5 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-icsn-teal/10 text-icsn-teal rounded-full flex items-center justify-center group-hover:bg-icsn-teal group-hover:text-white transition-colors">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-icsn-navy text-lg">Free Trial Class</div>
              <div className="text-sm text-muted-foreground mt-0.5">
                Register for a free 1-session playgroup class<br/>
                <span className="text-xs text-muted-foreground/70 block mt-0.5">ลงทะเบียนทดลองเรียนกลุ่มเล่น ครั้งที่ 1 ฟรี (สิทธิ์ทดลองเรียน)</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground/70 group-hover:text-icsn-teal" />
        </button>

        <button
          onClick={() => setPath('payment')}
          className="w-full bg-white border-2 border-border hover:border-icsn-pink rounded-2xl p-5 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-icsn-pink/10 text-icsn-pink rounded-full flex items-center justify-center group-hover:bg-icsn-pink group-hover:text-white transition-colors">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-icsn-navy text-lg">Purchase Package</div>
              <div className="text-sm text-muted-foreground mt-0.5">
                Buy playgroup session packages and top up credits<br/>
                <span className="text-xs text-muted-foreground/70 block mt-0.5">ซื้อแพ็กเกจเรียนกลุ่มเล่นและเติมเครดิตการเรียน</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground/70 group-hover:text-icsn-pink" />
        </button>
      </div>
    </div>
  );
}


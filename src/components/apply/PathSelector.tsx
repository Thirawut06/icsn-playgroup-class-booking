import React from 'react';
import { Ticket, Wallet, ChevronRight } from 'lucide-react';

interface PathSelectorProps {
  setPath: (path: 'trial' | 'payment') => void;
}

export function PathSelector({ setPath }: PathSelectorProps) {
  return (
    <div className="px-6 py-6 relative z-10">
      <h2 className="text-[17px] font-bold text-center text-[#211551] mb-6">
        Please select your registration path<br/>
        <span className="text-xs text-gray-500 font-normal block mt-1">เลือกทางเลือกเพื่อสั่งซื้อสิทธิ์หรือลงทะเบียนเรียน</span>
      </h2>

      <div className="space-y-4">
        <button
          onClick={() => setPath('trial')}
          className="w-full bg-white border-2 border-gray-100 hover:border-[#00B0B9] rounded-2xl p-5 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#00B0B9]/10 text-[#00B0B9] rounded-full flex items-center justify-center group-hover:bg-[#00B0B9] group-hover:text-white transition-colors">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-[#211551] text-[16px]">Free Trial Class</div>
              <div className="text-[12px] text-gray-500 mt-0.5">
                Register for a free 1-session playgroup class<br/>
                <span className="text-[11px] text-gray-400 block mt-0.5">ลงทะเบียนทดลองเรียนกลุ่มเล่น ครั้งที่ 1 ฟรี (สิทธิ์ทดลองเรียน)</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#00B0B9]" />
        </button>

        <button
          onClick={() => setPath('payment')}
          className="w-full bg-white border-2 border-gray-100 hover:border-[#CC3366] rounded-2xl p-5 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#CC3366]/10 text-[#CC3366] rounded-full flex items-center justify-center group-hover:bg-[#CC3366] group-hover:text-white transition-colors">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-[#211551] text-[16px]">Purchase Package</div>
              <div className="text-[12px] text-gray-500 mt-0.5">
                Buy playgroup session packages and top up credits<br/>
                <span className="text-[11px] text-gray-400 block mt-0.5">ซื้อแพ็กเกจเรียนกลุ่มเล่นและเติมเครดิตการเรียน</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#CC3366]" />
        </button>
      </div>
    </div>
  );
}

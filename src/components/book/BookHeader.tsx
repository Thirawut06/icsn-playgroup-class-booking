import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LogOut, CalendarHeart, Wallet } from 'lucide-react';

interface BookHeaderProps {
  parentName: string;
  creditsRemaining: number;
  onLogout: () => void;
  onTopUpClick: () => void;
}

export function BookHeader({ parentName, creditsRemaining, onLogout, onTopUpClick }: BookHeaderProps) {
  return (
    <>
      {/* Sticky Top Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-xs sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-auto">
              <Image src="/main-logo-icsn.png" alt="ICSN Logo" width={48} height={48} className="w-full h-auto object-contain" priority />
            </div>
            <div>
              <h1 className="font-bold text-[#211551] text-[14px] leading-none">
                ICSN Panda Playgroup
              </h1>
              <p className="text-[10px] text-[#00B0B9] font-extrabold tracking-wider mt-0.5">
                PLAY & LEARN
              </p>
            </div>
          </div>

          {/* Header actions / Navigation */}
          <div className="flex items-center gap-2">
            <Link href="/my-bookings" className="inline-flex items-center justify-center w-10 h-10 bg-gray-50 text-gray-600 hover:text-[#00B0B9] hover:bg-[#00B0B9]/10 rounded-[14px] transition active:scale-95">
              <CalendarHeart className="w-5 h-5" />
            </Link>
            <button onClick={onLogout} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-[14px] hover:bg-red-50 transition active:scale-95" title="Log out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Top Section: Profile & Quick Actions */}
      <div className="px-4 pt-5 pb-1">
        <div className="bg-white rounded-[20px] p-4 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#00B0B9]/10 flex items-center justify-center overflow-hidden border border-[#00B0B9]/20 shrink-0">
              {/* Simulated Parent Avatar using Dicebear */}
              <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${parentName || 'Parent'}&backgroundColor=e2e8f0`} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#211551] leading-tight">
                {parentName || 'คุณพ่อ/คุณแม่'}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[12px] text-gray-500 font-medium">สิทธิ์เรียน:</span>
                <span className="text-[15px] font-black text-[#00B0B9]">{creditsRemaining}</span>
                <span className="text-[11px] text-gray-500 font-medium">ครั้ง</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onTopUpClick} 
            className="bg-[#211551] text-white hover:bg-[#2d1d6e] font-bold px-4 py-2.5 rounded-[14px] text-[12px] flex items-center gap-1.5 shadow-md transition active:scale-95 shrink-0"
          >
            <Wallet className="w-4 h-4" /> Top Up
          </button>
        </div>
      </div>
    </>
  );
}

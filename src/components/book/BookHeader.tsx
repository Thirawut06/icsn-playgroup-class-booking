import React from 'react';
import Image from 'next/image';
import { LogOut, Wallet } from 'lucide-react';

interface BookHeaderProps {
  parentName: string;
  creditsRemaining: number;
  parentPhotoUrl?: string;
  onLogout: () => void;
  onTopUpClick: () => void;
}

export function BookHeader({ parentName, creditsRemaining, parentPhotoUrl, onLogout, onTopUpClick }: BookHeaderProps) {
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
              <h1 className="font-bold text-icsn-navy text-base leading-none">
                ICSN Panda Playgroup
              </h1>
              <p className="text-xs text-icsn-teal font-extrabold tracking-wider mt-0.5">
                PLAY & LEARN
              </p>
            </div>
          </div>

          {/* Header actions / Navigation */}
          <div className="flex items-center gap-2">
            <button onClick={onLogout} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition active:scale-95" title="Log out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Top Section: Profile & Quick Actions */}
      <div className="px-4 pt-5 pb-1">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-icsn-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-icsn-teal/10 flex items-center justify-center overflow-hidden border border-icsn-teal/20 shrink-0">
              {parentPhotoUrl ? (
                <img src={parentPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${parentName || 'Parent'}&backgroundColor=e2e8f0`} alt="Profile" className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-icsn-navy leading-tight">
                {parentName || 'คุณพ่อ/คุณแม่'}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm text-gray-500 font-medium">สิทธิ์เรียน:</span>
                <span className="text-base font-black text-icsn-teal">{creditsRemaining}</span>
                <span className="text-xs text-gray-500 font-medium">ครั้ง</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onTopUpClick} 
            className="bg-icsn-navy text-white hover:bg-icsn-navy/90 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5 shadow-md transition active:scale-95 shrink-0"
          >
            <Wallet className="w-4 h-4" /> Top Up
          </button>
        </div>
      </div>
    </>
  );
}


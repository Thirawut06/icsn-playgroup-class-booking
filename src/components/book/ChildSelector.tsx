import React from 'react';
import Link from 'next/link';
import { User, ChevronRight, Plus } from 'lucide-react';
import type { Child } from '@/types';

interface ChildSelectorProps {
  children: Child[];
  selectedChildId: string;
  onSelectChild: (childId: string) => void;
}

export function ChildSelector({ children, selectedChildId, onSelectChild }: ChildSelectorProps) {
  return (
    <div className="bg-white rounded-[20px] border border-gray-100 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[#211551] flex items-center gap-1.5 text-[15px]">
          <User className="w-5 h-5 text-[#00B0B9]" />
          <span>1. เลือกรายชื่อนักเรียน</span>
        </h3>
        <Link href="/apply?addChild=true" className="text-[12px] font-bold text-[#00B0B9] flex items-center gap-1 bg-[#00B0B9]/10 px-3 py-2 rounded-xl hover:bg-[#00B0B9]/20 transition active:scale-95 border border-[#00B0B9]/10">
          <Plus className="w-3.5 h-3.5" /> เพิ่มชื่อน้อง
        </Link>
      </div>
      
      <div className="relative">
        <select
          value={selectedChildId}
          onChange={(e) => onSelectChild(e.target.value)}
          className="w-full text-[15px] px-4 py-3.5 border border-gray-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-[#00B0B9] focus:border-transparent bg-gray-50 hover:bg-gray-100 transition text-[#211551] font-bold appearance-none cursor-pointer"
        >
          {children.length === 0 && <option value="">-- ยังไม่มีรายชื่อนักเรียน --</option>}
          {children.map(child => (
            <option key={child.id} value={child.id}>
              {child.nickname} ({child.full_name})
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
           <ChevronRight className="w-4 h-4 rotate-90" />
        </div>
      </div>
    </div>
  );
}

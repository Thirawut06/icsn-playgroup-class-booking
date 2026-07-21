import React from 'react';
import { Search, Loader2 } from 'lucide-react';

interface WalkinSearchStepProps {
  phone: string;
  setPhone: (val: string) => void;
  isSearching: boolean;
  handleSearch: (e: React.FormEvent) => void;
}

export function WalkinSearchStep({
  phone,
  setPhone,
  isSearching,
  handleSearch
}: WalkinSearchStepProps) {
  return (
    <form onSubmit={handleSearch} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-bold text-muted-foreground block">เบอร์โทรศัพท์ผู้ปกครอง (Phone Number)</label>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="tel"
            required
            autoFocus
            placeholder="08XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            className="w-full pl-12 pr-4 h-[54px] rounded-xl border border-border focus:border-icsn-teal focus:ring-1 focus:ring-icsn-teal outline-none transition font-bold"
          />
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isSearching || !phone}
        className="w-full h-[54px] bg-icsn-teal text-white rounded-xl font-bold shadow-sm hover:bg-icsn-teal/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ค้นหาข้อมูล'}
      </button>
    </form>
  );
}

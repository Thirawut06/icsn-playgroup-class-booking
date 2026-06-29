import React from 'react';
import Link from 'next/link';
import { User, ChevronRight, Plus } from 'lucide-react';
import { useBookingContext } from './BookingContext';
import { ROUTES } from '@/config/routes';
import { COPY } from '@/config/copy';
export function ChildSelector() {
  const { children, selectedChildId, setSelectedChildId } = useBookingContext();
  const selectedChild = children.find(c => c.id === selectedChildId);

  return (
    <div className="bg-white rounded-2xl border border-border p-4 shadow-icsn-card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-icsn-navy flex items-center gap-1.5 text-base">
          <User className="w-5 h-5 text-icsn-teal" />
          <span>{COPY.BOOKING_FLOW.STEP_1}</span>
        </h3>
        <Link href={ROUTES.APPLY_ADD_CHILD} className="text-sm font-bold text-icsn-teal flex items-center gap-1 bg-icsn-teal/10 px-3 py-2 rounded-xl hover:bg-icsn-teal/20 transition active:scale-95 border border-icsn-teal/10">
          <Plus className="w-3.5 h-3.5" /> เพิ่มชื่อน้อง
        </Link>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Selected Child's Profile Photo on the Left */}
        {children.length > 0 && (
          <div className="w-12 h-12 rounded-full overflow-hidden border border-border shrink-0 bg-muted flex items-center justify-center">
            {selectedChild?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedChild.photo_url} alt={selectedChild.nickname} className="w-full h-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${selectedChild?.nickname || 'Child'}&backgroundColor=c0aede`} alt="Child Avatar" className="w-full h-full object-cover" />
            )}
          </div>
        )}

        {/* Dropdown Select on the Right */}
        <div className="flex-1 relative">
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="w-full text-base pl-4 pr-10 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-icsn-teal focus:border-transparent bg-muted hover:bg-muted/80 transition text-icsn-navy font-bold appearance-none cursor-pointer"
          >
            {children.length === 0 && <option value="">{COPY.BOOKING_FLOW.NO_CHILDREN}</option>}
            {children.map(child => (
              <option key={child.id} value={child.id}>
                {child.nickname} ({child.full_name})
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-muted-foreground/70">
             <ChevronRight className="w-4 h-4 rotate-90" />
          </div>
        </div>
      </div>
    </div>
  );
}


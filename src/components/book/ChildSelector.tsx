import React from 'react';
import Link from 'next/link';
import { ChevronRight, Plus, User } from 'lucide-react';
import { useBookingContext } from './BookingContext';
import { ROUTES } from '@/config/routes';
import { useDictionary } from '@/lib/i18n/dictionary-context';

export function ChildSelector() {
  const { children, selectedChildId, setSelectedChildId } = useBookingContext();
  const { dict, lang } = useDictionary();
  const selectedChild = children.find(c => c.id === selectedChildId);

  return (
    <div className="px-4 py-3 border-b border-border/40">
      {/* Label row */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-icsn-navy flex items-center gap-1.5 text-base">
          <User className="w-5 h-5 text-icsn-teal" />
          <span>{dict.book.step1}</span>
        </h3>
        <Link
          href={ROUTES.APPLY_ADD_CHILD(lang)}
          className="flex items-center gap-1 text-sm font-bold text-icsn-teal hover:underline active:opacity-70 transition"
        >
          <Plus className="w-3.5 h-3.5" /> {dict.book.addChild}
        </Link>
      </div>

      {/* Avatar + Select row */}
      <div className="flex items-center gap-3">
        {children.length > 0 && (
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-muted">
            {selectedChild?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedChild.photo_url} alt={selectedChild.nickname} loading="lazy" className="w-full h-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${selectedChild?.nickname || 'Child'}&backgroundColor=c0aede`} alt="Child Avatar" loading="lazy" className="w-full h-full object-cover" />
            )}
          </div>
        )}

        <div className="flex-1 relative">
          <select
            aria-label="Select child"
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="w-full text-base pl-4 pr-10 py-3 border-b-2 border-border focus:outline-none focus:border-icsn-teal bg-transparent text-icsn-navy font-bold appearance-none cursor-pointer transition"
          >
            {children.length === 0 && <option value="">{dict.book.noChildren}</option>}
            {children.map(child => (
              <option key={child.id} value={child.id}>
                {child.nickname} ({child.full_name})
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-muted-foreground/70">
            <ChevronRight className="w-4 h-4 rotate-90" />
          </div>
        </div>
      </div>
    </div>
  );
}

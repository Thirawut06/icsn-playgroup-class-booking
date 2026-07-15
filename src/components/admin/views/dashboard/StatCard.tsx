import React from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';

const COLOR_MAP: Record<string, string> = {
  blue:   'bg-info/10 text-info',
  amber:  'bg-warning/10 text-warning',
  emerald:'bg-success/10 text-success',
};

interface StatCardProps {
  icon: LucideIcon;
  color: string;
  label: string;
  description?: string;
  value: string | number;
  loading: boolean;
}

export function StatCard({ icon: Icon, color, label, description, value, loading }: StatCardProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4 hover:shadow-md transition duration-300">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${COLOR_MAP[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wide">{label}</p>
        <div className="text-xl font-black text-foreground mt-0.5">
          {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/70 mt-1" /> : value}
        </div>
        {description && (
          <p className="text-[10px] text-muted-foreground/70 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

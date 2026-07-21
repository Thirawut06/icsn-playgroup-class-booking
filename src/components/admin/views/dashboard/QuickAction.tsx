import React from 'react';
import type { QuickActionItem } from './useAdminDashboard';

export function QuickAction({ item }: { item: QuickActionItem }) {
  return (
    <button
      type="button"
      onClick={item.onClick}
      className={`relative bg-white border border-border ${item.hoverBorder} hover:shadow-md transition-all p-5 rounded-2xl flex flex-col items-center justify-center gap-3 text-center group cursor-pointer`}
    >
      {item.badge ? (
        <span className="absolute top-3 right-3 bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm min-w-[20px] h-5 flex items-center justify-center">
          {item.badge}
        </span>
      ) : null}
      <div className={`w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center ${item.hoverBg} transition-colors`}>
        <item.icon className={`w-6 h-6 text-foreground/80 ${item.hoverIcon}`} />
      </div>
      <div>
        <p className="font-bold text-foreground text-sm">{item.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
      </div>
    </button>
  );
}

"use client";

import { ADMIN_NAV_SCHEMA } from '@/config/navigation';
import { TOKENS } from '@/config/theme/tokens';
import { cn } from '@/lib/utils';
import type { AdminTab } from './admin-types';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  pendingSlipCount: number;
}

export function AdminSidebar({ activeTab, onTabChange, pendingSlipCount }: AdminSidebarProps) {
  const nav = TOKENS.COMPONENTS.ADMIN_NAV;

  // Group the navigation items
  const groupedNav = ADMIN_NAV_SCHEMA.reduce((acc, tab) => {
    if (!acc[tab.group]) {
      acc[tab.group] = [];
    }
    acc[tab.group].push(tab);
    return acc;
  }, {} as Record<string, typeof ADMIN_NAV_SCHEMA>);

  return (
    <nav className="flex flex-col gap-6" aria-label="Admin sections">
      {Object.entries(groupedNav).map(([groupName, tabs]) => (
        <div key={groupName} className="flex flex-col gap-1.5">
          <h3 className="px-3 text-[10px] font-black text-muted-foreground/70 tracking-widest uppercase mb-1">
            {groupName}
          </h3>
          <div className={nav.LIST}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  aria-pressed={isActive}
                  className={cn(
                    nav.ITEM,
                    tab.id === 'slips' && 'justify-between',
                    isActive ? nav.ITEM_ACTIVE : nav.ITEM_INACTIVE
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} aria-hidden="true" />
                    <span className="min-w-0 text-left">
                      {tab.label}
                      <br />
                      <span
                        className={cn(
                          nav.DESCRIPTION,
                          isActive ? nav.DESCRIPTION_ACTIVE : nav.DESCRIPTION_INACTIVE
                        )}
                      >
                        {tab.description}
                      </span>
                    </span>
                  </span>
                  {tab.id === 'slips' && pendingSlipCount > 0 ? (
                    <span
                      className={cn(nav.BADGE, isActive ? nav.BADGE_ACTIVE : nav.BADGE_INACTIVE)}
                    >
                      {pendingSlipCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}


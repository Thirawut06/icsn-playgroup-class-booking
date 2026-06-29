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

  return (
    <nav className={nav.LIST} aria-label="Admin sections">
      {ADMIN_NAV_SCHEMA.map(tab => {
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
              <span className="min-w-0">
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
    </nav>
  );
}


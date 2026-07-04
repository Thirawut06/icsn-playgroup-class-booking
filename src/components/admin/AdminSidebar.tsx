"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { ADMIN_NAV_SCHEMA } from '@/config/navigation';
import { TOKENS } from '@/config/theme/tokens';
import { cn } from '@/lib/utils';
import type { AdminTab } from './admin-types';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  pendingSlipCount: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({
  activeTab,
  onTabChange,
  pendingSlipCount,
  isOpen = false,
  onClose,
}: AdminSidebarProps) {
  const nav = TOKENS.COMPONENTS.ADMIN_NAV;

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleTabClick = (tab: AdminTab, isMobile: boolean) => {
    onTabChange(tab);
    if (isMobile && onClose) onClose();
  };

  // Group nav items by their group label
  const groupedNav = ADMIN_NAV_SCHEMA.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof ADMIN_NAV_SCHEMA>);

  const renderNavItems = (isMobile: boolean) => (
    <nav className="flex flex-col gap-5 flex-1" aria-label="Admin navigation">
      {Object.entries(groupedNav).map(([groupName, tabs]) => (
        <div key={groupName}>
          <p className="px-3 mb-1 text-[10px] font-black tracking-widest uppercase text-muted-foreground/60">
            {groupName}
          </p>
          <div className="flex flex-col gap-0.5">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id, isMobile)}
                  aria-pressed={isActive}
                  className={cn(
                    nav.ITEM,
                    tab.id === 'slips' && pendingSlipCount > 0 && 'justify-between',
                    isActive ? nav.ITEM_ACTIVE : nav.ITEM_INACTIVE
                  )}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} aria-hidden />
                    <span className="min-w-0 text-left">
                      <span className="block truncate">{tab.label}</span>
                      <span className={cn(
                        'block text-[11px] font-normal leading-tight truncate',
                        isActive ? 'text-icsn-teal/70' : 'text-muted-foreground/60'
                      )}>
                        {tab.description}
                      </span>
                    </span>
                  </span>
                  {tab.id === 'slips' && pendingSlipCount > 0 && (
                    <span className={cn(nav.BADGE, isActive ? nav.BADGE_ACTIVE : nav.BADGE_INACTIVE)}>
                      {pendingSlipCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  // Shared branding block shown at the top of sidebar / drawer
  const SidebarBranding = () => (
    <div className="flex items-center gap-3 px-3 py-4 border-b border-border/50 shrink-0">
      <Image
        src="/main-logo-icsn.png"
        alt="ICSN"
        width={40}
        height={40}
        className="w-10 h-10 object-contain shrink-0"
      />
      <div className="min-w-0">
        <p className="font-bold text-icsn-navy text-sm font-outfit leading-tight">Admin Backoffice</p>
        <p className="text-[10px] text-icsn-teal font-bold tracking-wider font-outfit">ICSN PLAYGROUP</p>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop: Fixed full-height sidebar ── */}
      <aside className="hidden xl:flex flex-col fixed left-0 top-0 h-screen w-64 bg-white border-r border-border z-40 no-print">
        <SidebarBranding />
        <div className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
          {renderNavItems(false)}
        </div>
      </aside>

      {/* ── Mobile/Tablet: Slide-out drawer ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          {/* Drawer panel */}
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pr-3 border-b border-border/50">
              <SidebarBranding />
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-icsn-bg text-muted-foreground/70 transition-colors shrink-0"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              {renderNavItems(true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setDrawerOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const handleTabClick = (tab: AdminTab) => {
    onTabChange(tab);
    setDrawerOpen(false);
  };

  // Group the navigation items
  const groupedNav = ADMIN_NAV_SCHEMA.reduce((acc, tab) => {
    if (!acc[tab.group]) acc[tab.group] = [];
    acc[tab.group].push(tab);
    return acc;
  }, {} as Record<string, typeof ADMIN_NAV_SCHEMA>);

  // Find current active tab info
  const activeNavItem = ADMIN_NAV_SCHEMA.find(t => t.id === activeTab);
  const ActiveIcon = activeNavItem?.icon;

  // Shared nav list renderer
  const renderNavList = (mobile?: boolean) => (
    <>
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
                  onClick={() => mobile ? handleTabClick(tab.id) : onTabChange(tab.id)}
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
                    <span className={cn(nav.BADGE, isActive ? nav.BADGE_ACTIVE : nav.BADGE_INACTIVE)}>
                      {pendingSlipCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );

  return (
    <>
      {/* ─── Mobile: Hamburger trigger bar ─── */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-left active:scale-[0.99] transition-all"
        >
          <Menu className="w-5 h-5 text-icsn-teal shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-icsn-navy truncate flex items-center gap-2">
              {ActiveIcon && <ActiveIcon className="w-4 h-4 text-icsn-teal shrink-0" />}
              {activeNavItem?.label || 'Menu'}
            </p>
            <p className="text-xs text-muted-foreground truncate">{activeNavItem?.description}</p>
          </div>
          {pendingSlipCount > 0 && (
            <span className="min-w-[20px] h-[20px] flex items-center justify-center rounded-full text-[10px] font-black bg-red-500 text-white px-1.5">
              {pendingSlipCount}
            </span>
          )}
        </button>
      </div>

      {/* ─── Mobile: Slide-out drawer overlay ─── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer panel */}
          <div className="absolute inset-y-0 left-0 w-[300px] max-w-[85vw] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-icsn-navy text-base">Admin Menu</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {renderNavList(true)}
            </div>
          </div>
        </div>
      )}

      {/* ─── Tablet/Desktop: Vertical sidebar (unchanged) ─── */}
      <nav className="hidden md:flex flex-col gap-6" aria-label="Admin sections">
        {renderNavList(false)}
      </nav>
    </>
  );
}

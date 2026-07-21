"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useUnsavedChangesGuard(hasUnsavedChanges: boolean) {
  const router = useRouter();
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  // 1. Browser-level Guard (Reload / Close tab)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Standard native prompt trigger
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // 2. Internal-level Guard (Link Clicks)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!hasUnsavedChanges) return;

      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor && anchor.href && anchor.target !== '_blank') {
        const url = new URL(anchor.href);
        if (url.origin === window.location.origin && url.href !== window.location.href) {
          e.preventDefault();
          e.stopPropagation();
          setPendingPath(anchor.href);
          setIsLeaveModalOpen(true);
        }
      }
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [hasUnsavedChanges]);

  // 3. SPA Tab Guard (Custom Event from AdminPage)
  useEffect(() => {
    const handleTabChangeRequest = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab: string }>;
      if (hasUnsavedChanges) {
        e.preventDefault(); // Prevents AdminPage from changing the tab immediately
        setPendingPath(customEvent.detail.tab);
        setIsLeaveModalOpen(true);
      }
    };
    window.addEventListener('requestTabChange', handleTabChangeRequest);
    return () => window.removeEventListener('requestTabChange', handleTabChangeRequest);
  }, [hasUnsavedChanges]);

  const handleConfirmLeave = () => {
    setIsLeaveModalOpen(false);
    if (pendingPath) {
      if (pendingPath.startsWith('http') || pendingPath.startsWith('/')) {
        // It's a normal URL route change
        router.push(pendingPath);
      } else {
        // It's a SPA tab change
        window.dispatchEvent(new CustomEvent('forceTabChange', { detail: { tab: pendingPath } }));
      }
    }
  };

  const handleCancelLeave = () => {
    setIsLeaveModalOpen(false);
    setPendingPath(null);
  };

  return {
    isLeaveModalOpen,
    handleConfirmLeave,
    handleCancelLeave,
  };
}

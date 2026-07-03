/**
 * DESIGN TOKENS
 * Central registry for design constraints and semantic styles.
 * Ensures UI consistency across the application.
 */

export const TOKENS = {
  // 1. BRAND COLORS (Raw Hex values for JS usage if needed, e.g. Charts)
  COLORS: {
    NAVY: '#211551',
    TEAL: '#00B0B9',
    PINK: '#CC3366',
    YELLOW: '#F6C654',
    GRAY: '#777777',
    BG: '#F8FAFC',
    SUCCESS: '#059669',
    ERROR: '#CC3366',
    WARNING: '#D97706',
    INFO: '#0284C7',
  },

  // 2. RADII (Standard border radius for different UI components)
  RADIUS: {
    CARD: 'rounded-2xl',
    MODAL: 'rounded-3xl',
    BUTTON: 'rounded-xl',
    INPUT: 'rounded-lg',
    BADGE: 'rounded-full',
  },

  // 3. SHADOWS (Standard elevations)
  SHADOWS: {
    CARD: 'shadow-sm',
    MODAL: 'shadow-2xl',
    DROPDOWN: 'shadow-lg',
  },

  // 4. COMMON COMPONENTS (Semantic combinations of Tailwind classes)
  COMPONENTS: {
    PAGE_CONTAINER: 'max-w-[1600px] w-full mx-auto px-4 py-6',
    CARD_BASE: 'bg-white border border-border rounded-2xl shadow-sm',
    INPUT_BASE: 'w-full px-3 py-2 border border-border rounded-lg focus:border-icsn-teal focus:ring-1 focus:ring-icsn-teal outline-none transition',
    ADMIN_NAV: {
      LIST: 'xl:w-64 shrink-0 space-y-1.5 no-print',
      ITEM: 'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-icsn-teal/30 focus-visible:ring-offset-2',
      ITEM_ACTIVE: 'bg-icsn-teal/10 text-icsn-teal',
      ITEM_INACTIVE: 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
      DESCRIPTION: 'mt-0.5 hidden text-[11px] font-normal leading-tight xl:block',
      DESCRIPTION_ACTIVE: 'text-icsn-teal/80',
      DESCRIPTION_INACTIVE: 'text-muted-foreground/70',
      BADGE: 'rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0',
      BADGE_ACTIVE: 'bg-icsn-teal text-white shadow-sm',
      BADGE_INACTIVE: 'bg-error text-white shadow-sm',
    },
  }
} as const;

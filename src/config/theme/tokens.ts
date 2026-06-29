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
      LIST: 'md:w-64 shrink-0 space-y-3 no-print',
      ITEM: 'w-full flex min-h-[72px] items-center gap-3 rounded-[28px] border px-4 py-3 text-left text-xs font-semibold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-icsn-teal/30 focus-visible:ring-offset-2',
      ITEM_ACTIVE: 'border-icsn-teal bg-icsn-teal text-white shadow-sm',
      ITEM_INACTIVE: 'border-border bg-white text-foreground hover:border-icsn-teal/40 hover:bg-icsn-teal/5 hover:text-icsn-navy',
      DESCRIPTION: 'mt-0.5 hidden text-xs font-normal leading-snug md:block',
      DESCRIPTION_ACTIVE: 'text-white/80',
      DESCRIPTION_INACTIVE: 'text-muted-foreground',
      BADGE: 'rounded-full px-2 py-0.5 text-xs font-bold shrink-0',
      BADGE_ACTIVE: 'bg-white text-success',
      BADGE_INACTIVE: 'bg-error text-white',
    },
  }
} as const;

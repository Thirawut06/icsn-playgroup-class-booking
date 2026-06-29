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
    CARD_BASE: 'bg-white border border-gray-200 rounded-2xl shadow-sm',
    INPUT_BASE: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-icsn-teal focus:ring-1 focus:ring-icsn-teal outline-none transition',
  }
};

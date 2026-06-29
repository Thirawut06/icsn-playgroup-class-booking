export const STORAGE_KEYS = {
  PARENT_ID: 'icsn_parent_id',
  PARENT_NAME: 'icsn_parent_name',
  PARENT_PHONE: 'icsn_parent_phone',
  PARENT_EMAIL: 'icsn_parent_email',
} as const;

export const BOOKING_STATUS = {
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
} as const;

export const CLASS_CONFIG = {
  DEFAULT_CAPACITY: 12,
  DEFAULT_TIME_LABEL: 'เช้า (09:30 - 11:30)',
} as const;

export const UI_TEXT = {
  STATUS_OPEN: 'เปิดรับจอง',
  STATUS_FULL: 'เต็มแล้ว / ปิดรับจอง',
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
} as const;

export const BOOKING_RULES = {
  CUTOFF_HOUR_MORNING: 7, // 07:00
  START_HOUR_MORNING: 9,  // 09:00
} as const;

export const VALIDATION = {
  PHONE_MIN_LENGTH: 9,
  PHONE_MAX_LENGTH: 10,
  PASSWORD_MIN_LENGTH: 6,
} as const;

export const EXTERNAL_URLS = {
  AVATAR_NOTIONISTS: 'https://api.dicebear.com/7.x/notionists/svg',
  AVATAR_FUN_EMOJI: 'https://api.dicebear.com/7.x/fun-emoji/svg',
} as const;

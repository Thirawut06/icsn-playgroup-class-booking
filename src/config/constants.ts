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
  DEFAULT_CAPACITY: 15,
  DEFAULT_TIME_LABEL: 'เช้า (09:30 - 11:30)',
} as const;

export const UI_TEXT = {
  STATUS_OPEN: 'เปิดรับจอง',
  STATUS_FULL: 'เต็มแล้ว / ปิดรับจอง',
} as const;

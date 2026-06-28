/**
 * Constants for date calculations
 */
const THAI_YEAR_OFFSET = 543;
const CUTOFF_HOUR_FOR_SAME_DAY_BOOKING = 7;
const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const THAI_MONTHS_MIN = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

/**
 * Returns the Thai month name and year (e.g., "มกราคม 2567")
 * @param date The date to format
 * @returns Formatted Thai month and year string
 */
export function getThaiMonthName(date: Date): string {
  const monthName = THAI_MONTHS[date.getMonth()];
  const thaiYear = date.getFullYear() + THAI_YEAR_OFFSET;
  return `${monthName} ${thaiYear}`;
}

/**
 * Returns the abbreviated Thai month name (e.g., "ม.ค.")
 * @param date The date to format
 * @returns Abbreviated Thai month string
 */
export function getThaiMonthMin(date: Date): string {
  return THAI_MONTHS_MIN[date.getMonth()];
}

/**
 * Returns the full Thai date string with weekday (e.g., "วันจันทร์ที่ 1 มกราคม 2567")
 * @param date The date to format
 * @returns Full formatted Thai date string
 */
export function formatThaiFullDate(date: Date): string {
  return date.toLocaleDateString('th-TH', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

/**
 * Checks if a given date is bookable based on business rules:
 * 1. Cannot book past dates.
 * 2. Cannot book today if the current time is past the cutoff hour.
 * 3. Cannot book on weekends (Sunday=0, Saturday=6).
 * 
 * @param dateStr The date string to check (YYYY-MM-DD)
 * @returns true if bookable, false otherwise
 */
export function checkIsBookableDate(dateStr: string): boolean {
  const targetDate = new Date(dateStr);
  targetDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Cannot book past dates
  if (targetDate < today) {
    return false;
  }
  
  // 2. Cannot book today if past cutoff time
  const isToday = targetDate.getTime() === today.getTime();
  if (isToday && new Date().getHours() >= CUTOFF_HOUR_FOR_SAME_DAY_BOOKING) {
    return false;
  }

  // 3. Cannot book on weekends
  const dayOfWeek = targetDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  if (isWeekend) {
    return false;
  }

  return true;
}

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
 * 4. Cannot book on blockout dates (admin-defined holidays).
 * 
 * @param dateStr The date string to check (YYYY-MM-DD)
 * @param blockoutDates Optional array of blocked date strings (YYYY-MM-DD)
 * @param cutoffHour Optional hour of the day (0-23) after which same-day booking is disallowed (default 7)
 * @param closures Array of SchoolClosure objects
 * @param operatingDays Array of operating days (0=Sunday, 6=Saturday)
 * @returns true if bookable, false otherwise
 */
export function checkIsBookableDate(
  dateStr: string, 
  closures: import('@/types').SchoolClosure[] = [], 
  operatingDays: number[] = [0,1,2,3,4,5,6], 
  cutoffHour: number = 7
): boolean {
  const today = new Date();
  
  // Format today as YYYY-MM-DD in local time
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  // 1. Cannot book past dates
  if (dateStr < todayStr) {
    return false;
  }
  
  // 2. Cannot book today if past cutoff time
  const isToday = dateStr === todayStr;
  if (isToday && today.getHours() >= cutoffHour) {
    return false;
  }

  // 3. Determine base operating status
  const targetDate = new Date(dateStr);
  const dayOfWeek = targetDate.getDay();
  let isBookable = operatingDays.includes(dayOfWeek);

  // 4. Check closures and overrides
  const closureForDate = closures.find(c => dateStr >= c.start_date && dateStr <= c.end_date && !c.time_label);
  if (closureForDate) {
    if (closureForDate.is_force_open) {
      isBookable = true;
    } else {
      isBookable = false;
    }
  }

  return isBookable;
}

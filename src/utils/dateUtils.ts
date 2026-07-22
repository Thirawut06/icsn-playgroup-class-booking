/**
 * Constants for date calculations
 */
const THAI_YEAR_OFFSET = 543;

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
 * Formats a Date object into a YYYY-MM-DD string in local time.
 */
export function formatISODateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns an array of YYYY-MM-DD date strings between start and end inclusive, using timezone-safe UTC date arithmetic.
 */
export function getDateRangeArray(startDateStr: string, endDateStr: string): string[] {
  if (!startDateStr || !endDateStr || startDateStr > endDateStr) return [];

  const [startY, startM, startD] = startDateStr.split('-').map(Number);
  const [endY, endM, endD] = endDateStr.split('-').map(Number);

  const dates: string[] = [];
  const curr = new Date(Date.UTC(startY, startM - 1, startD));
  const endDateObj = new Date(Date.UTC(endY, endM - 1, endD));

  while (curr <= endDateObj) {
    const yyyy = curr.getUTCFullYear();
    const mm = String(curr.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(curr.getUTCDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  return dates;
}

/**
 * Checks if a given date is bookable based on business rules:
 * 1. Cannot book past dates.
 * 2. Cannot book beyond +60 days from today.
 * 3. Cannot book today if the current time is past the cutoff hour.
 * 4. Cannot book on non-operating days or closed dates (unless force open).
 * 
 * @param dateStr The date string to check (YYYY-MM-DD)
 * @param closures Array of SchoolClosure objects
 * @param operatingDays Array of operating days (0=Sunday, 6=Saturday)
 * @param cutoffHour Optional hour of the day (0-23) after which same-day booking is disallowed (default 7)
 * @returns true if bookable, false otherwise
 */
export function checkIsBookableDate(
  dateStr: string, 
  closures: import('@/types').SchoolClosure[] = [], 
  operatingDays: number[] = [0,1,2,3,4,5,6], 
  cutoffHour: number = 7
): boolean {
  const today = new Date();
  const todayStr = formatISODateString(today);

  // 1. Cannot book past dates
  if (dateStr < todayStr) {
    return false;
  }
  
  // 2. Cannot book beyond +60 days from today
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 60);
  const maxDateStr = formatISODateString(maxDate);
  
  if (dateStr > maxDateStr) {
    return false;
  }
  
  // 3. Cannot book today if past cutoff time
  const isToday = dateStr === todayStr;
  if (isToday && today.getHours() >= cutoffHour) {
    return false;
  }

  // 3. Determine base operating status
  const targetDate = new Date(dateStr + "T00:00:00Z");
  const dayOfWeek = targetDate.getUTCDay();
  let isBookable = operatingDays.includes(dayOfWeek);

  // 4. Check closures and overrides with single-day exception precedence
  const closureForDate = findClosureForDate(closures, dateStr);
  if (closureForDate) {
    if (closureForDate.is_force_open) {
      isBookable = true;
    } else {
      isBookable = false;
    }
  }

  return isBookable;
}

/**
 * Finds the applicable closure record for a specific date with precedence:
 * Single-day (exact date) records override broad multi-day ranges.
 */
export function findClosureForDate(
  closures: import('@/types').SchoolClosure[] = [],
  dateStr: string
): import('@/types').SchoolClosure | undefined {
  const matching = closures.filter(
    c => dateStr >= c.start_date && dateStr <= c.end_date && !c.time_label
  );
  if (matching.length === 0) return undefined;

  // Single-day (exact date) record takes precedence over broad date range
  const singleDayMatch = matching.find(c => c.start_date === c.end_date && c.start_date === dateStr);
  if (singleDayMatch) return singleDayMatch;

  // Otherwise return the first matching range
  return matching[0];
}

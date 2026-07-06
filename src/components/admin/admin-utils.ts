const THAI_FULL_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

export function formatThaiFullDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  return `${d} ${THAI_FULL_MONTHS[m - 1]} ${y + 543}`;
}

export function formatAgeDisplay(age: number | string | null | undefined): string {
  if (age === null || age === undefined || age === '') return '-';
  return `${age} yrs (${age} ขวบ)`;
}

export function formatAgeYMD(dobString?: string | null): string {
  if (!dobString) return '-';
  const dob = new Date(dobString);
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  let days = now.getDate() - dob.getDate();
  if (days < 0) {
    months--;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return `${years} ปี ${months} เดือน ${days} วัน`;
}

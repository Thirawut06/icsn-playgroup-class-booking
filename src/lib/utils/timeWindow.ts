export function isWithinWindow(start: string, end: string, current: string): boolean {
  if (start < end) {
      return current >= start && current <= end;
  } else {
      // crosses midnight
      return current >= start || current <= end;
  }
}

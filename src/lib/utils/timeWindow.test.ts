import { describe, it, expect } from 'vitest';
import { isWithinWindow } from './timeWindow';

describe('isWithinWindow', () => {
  it('should return true when current time is strictly within a same-day window', () => {
    // 09:00 to 17:00
    expect(isWithinWindow('09:00', '17:00', '12:00:00')).toBe(true);
    expect(isWithinWindow('09:00', '17:00', '16:59:59')).toBe(true);
  });

  it('should return false when current time is outside a same-day window', () => {
    // 09:00 to 17:00
    expect(isWithinWindow('09:00', '17:00', '08:59:59')).toBe(false);
    expect(isWithinWindow('09:00', '17:00', '17:00:01')).toBe(false);
  });

  it('should return true when current time is within a cross-midnight window (e.g. 17:00 to 07:00)', () => {
    // After 17:00
    expect(isWithinWindow('17:00', '07:00', '18:00:00')).toBe(true);
    expect(isWithinWindow('17:00', '07:00', '23:59:59')).toBe(true);
    // Before 07:00
    expect(isWithinWindow('17:00', '07:00', '00:00:00')).toBe(true);
    expect(isWithinWindow('17:00', '07:00', '06:59:59')).toBe(true);
  });

  it('should return false when current time is outside a cross-midnight window (e.g. 17:00 to 07:00)', () => {
    // Between 07:00 and 17:00
    expect(isWithinWindow('17:00', '07:00', '07:00:01')).toBe(false);
    expect(isWithinWindow('17:00', '07:00', '12:00:00')).toBe(false);
    expect(isWithinWindow('17:00', '07:00', '16:59:59')).toBe(false);
  });

  it('should handle exact boundary times accurately (string comparison edge cases)', () => {
    // Exactly at start time
    expect(isWithinWindow('17:00', '07:00', '17:00:00')).toBe(true);
    
    // Exactly at end time (Wait! "07:00:00" <= "07:00" is FALSE in JS)
    // In our edge function, current comes from toLocaleTimeString ('HH:MM:SS')
    // We should test if it behaves as expected at exactly 07:00:00.
    // "07:00:00" <= "07:00" is false! So it stops approving precisely at 07:00:00, which is perfectly acceptable.
    expect(isWithinWindow('17:00', '07:00', '07:00:00')).toBe(false);
    expect(isWithinWindow('17:00', '07:00', '17:00')).toBe(true);
    expect(isWithinWindow('17:00', '07:00', '07:00')).toBe(true);
  });
});

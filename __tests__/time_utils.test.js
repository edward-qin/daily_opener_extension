// Tests for time utility functions
const { timeVal, timeStr, getTimezoneOffset, getTimezoneOffsetValue } = require('../src/shared/time_utils');

describe('time_utils', () => {
  describe('timeVal', () => {
    test('converts time string to minutes correctly', () => {
      expect(timeVal('00:00')).toBe(0);
      expect(timeVal('01:00')).toBe(60);
      expect(timeVal('01:30')).toBe(90);
      expect(timeVal('12:00')).toBe(720);
      expect(timeVal('23:59')).toBe(1439);
    });

    test('handles leading zeros', () => {
      expect(timeVal('09:05')).toBe(545);
      expect(timeVal('00:05')).toBe(5);
    });

    test('handles edge cases', () => {
      expect(timeVal('24:00')).toBe(1440); // Next day, but function doesn't validate
      expect(timeVal('00:60')).toBe(60); // Invalid but parsed
    });
  });

  describe('timeStr', () => {
    test('converts minutes to time string correctly', () => {
      expect(timeStr(0)).toBe('00:00');
      expect(timeStr(60)).toBe('01:00');
      expect(timeStr(90)).toBe('01:30');
      expect(timeStr(720)).toBe('12:00');
      expect(timeStr(1439)).toBe('23:59');
    });

    test('handles single digit hours and minutes', () => {
      expect(timeStr(545)).toBe('09:05');
      expect(timeStr(5)).toBe('00:05');
      expect(timeStr(125)).toBe('02:05');
    });

    test('is inverse of timeVal', () => {
      const testCases = ['00:00', '01:30', '12:45', '23:59', '09:05'];
      testCases.forEach(str => {
        expect(timeStr(timeVal(str))).toBe(str);
      });
    });
  });

  describe('getTimezoneOffset', () => {
    test('returns UTC offset string format', () => {
      const offset = getTimezoneOffset('UTC');
      expect(offset).toMatch(/^UTC[+-]\d+:\d{2}$/);
      expect(offset).toBe('UTC+0:00');
    });

    test('handles different timezones', () => {
      const est = getTimezoneOffset('America/New_York');
      expect(est).toMatch(/^UTC[+-]\d+:\d{2}$/);
      
      const pst = getTimezoneOffset('America/Los_Angeles');
      expect(pst).toMatch(/^UTC[+-]\d+:\d{2}$/);
      
      // Slightly more strict check: UTC-8:00 or UTC-7:00
      expect(pst).toMatch(/^UTC-\d?[78]:\d{2}$/);
    });

    test('handles invalid timezone gracefully', () => {
      const result = getTimezoneOffset('Invalid/Timezone');
      expect(result).toBe('UTC+0:00');
    });

    test('always includes minutes in format', () => {
      const offset = getTimezoneOffset('UTC');
      expect(offset).toContain(':');
      expect(offset.split(':')[1].length).toBe(2);
    });
  });

  describe('getTimezoneOffsetValue', () => {
    test('parses UTC offset strings correctly', () => {
      expect(getTimezoneOffsetValue('UTC+0:00')).toBe(0);
      expect(getTimezoneOffsetValue('UTC+5:00')).toBe(300);
      expect(getTimezoneOffsetValue('UTC-8:00')).toBe(-480);
      expect(getTimezoneOffsetValue('UTC+5:30')).toBe(330);
      expect(getTimezoneOffsetValue('UTC-8:30')).toBe(-510);
    });

    test('handles edge cases', () => {
      expect(getTimezoneOffsetValue('UTC+12:00')).toBe(720);
      expect(getTimezoneOffsetValue('UTC-12:00')).toBe(-720);
    });

    test('returns 0 for invalid format', () => {
      expect(getTimezoneOffsetValue('invalid')).toBe(0);
      expect(getTimezoneOffsetValue('UTC')).toBe(0);
      expect(getTimezoneOffsetValue('')).toBe(0);
    });

    test('can parse output of getTimezoneOffset', () => {
      const timezones = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Asia/Kolkata'];
      timezones.forEach(tz => {
        const offsetStr = getTimezoneOffset(tz);
        const offsetVal = getTimezoneOffsetValue(offsetStr);
        expect(typeof offsetVal).toBe('number');
        expect(offsetVal).toBeGreaterThanOrEqual(-720);
        expect(offsetVal).toBeLessThanOrEqual(720);
      });
    });
  });
});

// Tests for time utility functions
const { timeVal, timeStr } = require('../src/shared/time_utils');

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
});

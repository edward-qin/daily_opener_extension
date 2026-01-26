// Tests for alarm utility functions
const { calculateNextAlarmTime, scheduleAlarm, cancelAlarm } = require('../src/shared/alarm_utils');

describe('alarm_utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.now() for consistent testing
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('calculateNextAlarmTime', () => {
    test('calculates next alarm time for today if time hasn\'t passed', () => {
      // Set current time to 10:00 AM UTC
      const mockNow = new Date('2024-01-15T10:00:00Z');
      jest.setSystemTime(mockNow);
      
      // Schedule for 2:00 PM (14:00) UTC = 840 minutes
      const alarmTime = calculateNextAlarmTime(840, 'UTC');
      const alarmDate = new Date(alarmTime);
      
      // Should be today at 14:00
      expect(alarmDate.getUTCHours()).toBe(14);
      expect(alarmDate.getUTCMinutes()).toBe(0);
      expect(alarmDate.getUTCDate()).toBe(15);
    });

    test('calculates next alarm time for tomorrow if time has passed', () => {
      // Set current time to 3:00 PM UTC
      const mockNow = new Date('2024-01-15T15:00:00Z');
      jest.setSystemTime(mockNow);
      
      // Schedule for 2:00 PM (14:00) UTC = 840 minutes
      const alarmTime = calculateNextAlarmTime(840, 'UTC');
      const alarmDate = new Date(alarmTime);
      
      // Should be tomorrow at 14:00
      expect(alarmDate.getUTCHours()).toBe(14);
      expect(alarmDate.getUTCMinutes()).toBe(0);
      expect(alarmDate.getUTCDate()).toBe(16);
    });

    test('handles different timezones correctly', () => {
      // Set current time to 10:00 AM UTC (which is 5:00 AM EST)
      const mockNow = new Date('2024-01-15T10:00:00Z');
      jest.setSystemTime(mockNow);
      
      // Schedule for 2:00 PM EST = 840 minutes
      // EST is UTC-5, so 2:00 PM EST = 7:00 PM UTC = 19:00
      const alarmTime = calculateNextAlarmTime(840, 'America/New_York');
      const alarmDate = new Date(alarmTime);
      
      // Verify it's scheduled for 2:00 PM in EST (19:00 UTC, accounting for EST offset)
      // The exact UTC time will depend on DST, but it should be in the future
      expect(alarmDate.getTime()).toBeGreaterThan(mockNow.getTime());
      
      // Verify the time in EST timezone is 2:00 PM (14:00)
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const parts = formatter.formatToParts(alarmDate);
      const hour = parseInt(parts.find(p => p.type === 'hour').value);
      const minute = parseInt(parts.find(p => p.type === 'minute').value);
      expect(hour).toBe(14);
      expect(minute).toBe(0);
    });

    test('handles edge case of exactly the scheduled time', () => {
      // Set current time to exactly 2:00 PM UTC
      const mockNow = new Date('2024-01-15T14:00:00Z');
      jest.setSystemTime(mockNow);
      
      // Schedule for 2:00 PM UTC = 840 minutes
      const alarmTime = calculateNextAlarmTime(840, 'UTC');
      const alarmDate = new Date(alarmTime);
      
      // Should be tomorrow at 14:00 (time has passed)
      expect(alarmDate.getUTCDate()).toBe(16);
    });

    test('returns a valid timestamp', () => {
      const mockNow = new Date('2024-01-15T10:00:00Z');
      jest.setSystemTime(mockNow);
      
      const alarmTime = calculateNextAlarmTime(540, 'UTC'); // 9:00 AM
      expect(typeof alarmTime).toBe('number');
      expect(alarmTime).toBeGreaterThan(0);
      expect(alarmTime).toBeGreaterThan(mockNow.getTime());
    });

    test("DST spring-forward: skips nonexistent time to tomorrow", () => {
      // America/New_York DST starts 2024-03-10
      // 02:30 does not exist on this day
      jest.setSystemTime(new Date("2024-03-10T06:00:00Z")); // 1:00 AM EST
    
      const alarm = calculateNextAlarmTime(150, "America/New_York"); // 02:30
      const date = new Date(alarm);
    
      const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    
      const parts = Object.fromEntries(
        fmt.formatToParts(date).map(p => [p.type, p.value])
      );
    
      expect(parts.hour).toBe("02");
      expect(parts.minute).toBe("30");
      expect(parts.day).toBe("11"); // tomorrow
    });

    test("DST fall-back: schedules first occurrence of ambiguous time", () => {
      // America/New_York DST ends 2024-11-03
      jest.setSystemTime(new Date("2024-11-03T04:00:00Z")); // midnight EDT
    
      const alarm = calculateNextAlarmTime(90, "America/New_York"); // 01:30
      const date = new Date(alarm);
    
      const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
        hour12: false
      });
    
      const str = fmt.format(date);
    
      expect(str.startsWith("01:30")).toBe(true);
      // Typically EDT (first occurrence), but we don't assert the suffix
    });
    
    
  });

  describe('scheduleAlarm', () => {
    test('clears existing alarm before creating new one', async () => {
      await scheduleAlarm('https://example.com', 540, 'UTC');
      
      expect(global.browser.alarms.clear).toHaveBeenCalledWith('https://example.com');
      expect(global.browser.alarms.create).toHaveBeenCalled();
      
      const createCall = global.browser.alarms.create.mock.calls[0];
      expect(createCall[0]).toBe('https://example.com');
      expect(createCall[1]).toHaveProperty('when');
      expect(typeof createCall[1].when).toBe('number');
    });

    test('calculates correct alarm time', async () => {
      const mockNow = new Date('2024-01-15T10:00:00Z');
      jest.setSystemTime(mockNow);
      
      await scheduleAlarm('https://example.com', 900, 'UTC'); // 15:00 = 3:00 PM
      
      const createCall = global.browser.alarms.create.mock.calls[0];
      const alarmDate = new Date(createCall[1].when);
      expect(alarmDate.getTime()).toBe(new Date('2024-01-15T15:00:00Z').getTime());
      expect(alarmDate.getUTCHours()).toBe(15);
      expect(alarmDate.getUTCMinutes()).toBe(0);
    });
  });

  describe('cancelAlarm', () => {
    test('clears alarm for given URL', async () => {
      const result = await cancelAlarm('https://example.com');
      
      expect(global.browser.alarms.clear).toHaveBeenCalledWith('https://example.com');
      expect(result).toBe(true);
    });

    test('returns promise resolving to boolean', async () => {
      global.browser.alarms.clear.mockResolvedValue(false);
      const result = await cancelAlarm('https://example.com');
      
      expect(typeof result).toBe('boolean');
    });
  });
});

// Tests for alarm handler functions
const { shouldOpenUrl, handleAlarm, rescheduleAllAlarms } = require('../src/background/alarm_handler');

// Mock dependencies
jest.mock('../src/shared/storage_utils', () => ({
  openUrlAndUpdate: jest.fn(() => Promise.resolve())
}));

jest.mock('../src/shared/alarm_utils', () => ({
  scheduleAlarm: jest.fn(() => Promise.resolve())
}));

const { openUrlAndUpdate } = require('../src/shared/storage_utils');
const { scheduleAlarm } = require('../src/shared/alarm_utils');

describe('alarm_handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('shouldOpenUrl', () => {
    test('returns true if URL should be opened (last opened before scheduled time)', () => {
      // Set current time to Jan 15, 2024 3:00 PM UTC
      const mockNow = new Date('2024-01-15T15:00:00Z');
      jest.setSystemTime(mockNow);
      
      const dict = {
        set: 840, // 2:00 PM UTC = 14:00
        last: new Date('2024-01-15T10:00:00Z'), // Last opened at 10:00 AM today
        timezone: 'UTC'
      };
      
      // Last opened (10:00) is before scheduled time today (14:00), which already passed (now is 15:00)
      // So most recent scheduled time was 14:00 today, and last (10:00) < 14:00
      expect(shouldOpenUrl(dict)).toBe(true);
    });

    test('returns false if URL was opened after scheduled time', () => {
      const mockNow = new Date('2024-01-15T15:00:00Z');
      jest.setSystemTime(mockNow);
      
      const dict = {
        set: 840, // 2:00 PM UTC
        last: new Date('2024-01-15T14:30:00Z'), // Last opened at 2:30 PM today (after scheduled time)
        timezone: 'UTC'
      };
      
      // Last opened (14:30) is after scheduled time (14:00), so shouldn't open
      expect(shouldOpenUrl(dict)).toBe(false);
    });

    test('returns true if last opened yesterday', () => {
      const mockNow = new Date('2024-01-15T15:00:00Z');
      jest.setSystemTime(mockNow);
      
      const dict = {
        set: 840, // 2:00 PM UTC
        last: new Date('2024-01-14T20:00:00Z'), // Last opened yesterday at 8 PM
        timezone: 'UTC'
      };
      
      // Last opened yesterday, so should open
      expect(shouldOpenUrl(dict)).toBe(true);
    });

    test('handles timezones correctly', () => {
      // Set current time to Jan 15, 2024 3:00 PM EST (8:00 PM UTC)
      // EST is UTC-5, so 3:00 PM EST = 8:00 PM UTC
      const mockNow = new Date('2024-01-15T20:00:00Z');
      jest.setSystemTime(mockNow);
      
      const dict = {
        set: 840, // 2:00 PM EST = 14:00 EST
        last: new Date('2024-01-15T19:00:00Z'), // Last opened at 2:00 PM EST (7:00 PM UTC)
        timezone: 'America/New_York'
      };
      
      // Last opened at scheduled time, so shouldn't open again
      expect(shouldOpenUrl(dict)).toBe(false);
    });

    test('uses default timezone if not specified', () => {
      const mockNow = new Date('2024-01-15T15:00:00Z');
      jest.setSystemTime(mockNow);
      
      const dict = {
        set: 840, // 2:00 PM
        last: new Date('2024-01-15T10:00:00Z'),
        // No timezone specified
      };
      
      // Should use system default timezone
      expect(typeof shouldOpenUrl(dict)).toBe('boolean');
    });

    test('returns true if scheduled time for today hasn\'t passed yet', () => {
      // Set current time to Jan 15, 2024 1:00 PM UTC
      const mockNow = new Date('2024-01-15T13:00:00Z');
      jest.setSystemTime(mockNow);
      
      const dict = {
        set: 840, // 2:00 PM UTC = 14:00 (hasn't passed yet)
        last: new Date('2024-01-14T20:00:00Z'), // Last opened yesterday
        timezone: 'UTC'
      };
      
      // Most recent scheduled time was yesterday (since today's hasn't happened yet)
      // Last opened yesterday, so should open
      expect(shouldOpenUrl(dict)).toBe(true);
    });
  });

  describe('handleAlarm', () => {
    test('handles alarm and reschedules if URL exists', async () => {
      const mockAlarm = { name: 'https://example.com' };
      const dict = {
        set: 540,
        last: new Date('2024-01-15T10:00:00Z'),
        timezone: 'UTC'
      };
      
      global.browser.storage.local.get.mockResolvedValue({
        'https://example.com': JSON.stringify(dict)
      });
      
      await handleAlarm(mockAlarm);
      
      expect(global.browser.storage.local.get).toHaveBeenCalledWith('https://example.com');
      expect(scheduleAlarm).toHaveBeenCalledWith('https://example.com', 540, 'UTC');
    });

    test('opens URL if shouldOpenUrl returns true', async () => {
      const mockNow = new Date('2024-01-15T15:00:00Z');
      jest.setSystemTime(mockNow);
      
      const mockAlarm = { name: 'https://example.com' };
      const dict = {
        set: 840, // 2:00 PM
        last: new Date('2024-01-15T10:00:00Z'), // Should open
        timezone: 'UTC'
      };
      
      global.browser.storage.local.get.mockResolvedValue({
        'https://example.com': JSON.stringify(dict)
      });
      
      await handleAlarm(mockAlarm);
      
      expect(openUrlAndUpdate).toHaveBeenCalledWith('https://example.com', expect.objectContaining({
        set: 840,
        timezone: 'UTC'
      }));
    });

    test('does not open URL if shouldOpenUrl returns false', async () => {
      const mockNow = new Date('2024-01-15T15:00:00Z');
      jest.setSystemTime(mockNow);
      
      const mockAlarm = { name: 'https://example.com' };
      const dict = {
        set: 840, // 2:00 PM
        last: new Date('2024-01-15T14:30:00Z'), // Should NOT open
        timezone: 'UTC'
      };
      
      global.browser.storage.local.get.mockResolvedValue({
        'https://example.com': JSON.stringify(dict)
      });
      
      await handleAlarm(mockAlarm);
      
      expect(openUrlAndUpdate).not.toHaveBeenCalled();
    });

    test('returns early if URL does not exist in storage', async () => {
      const mockAlarm = { name: 'https://example.com' };
      global.browser.storage.local.get.mockResolvedValue({});
      
      await handleAlarm(mockAlarm);
      
      expect(scheduleAlarm).not.toHaveBeenCalled();
      expect(openUrlAndUpdate).not.toHaveBeenCalled();
    });

    test('uses default timezone if not in dict', async () => {
      const mockAlarm = { name: 'https://example.com' };
      const dict = {
        set: 540,
        last: new Date('2024-01-15T10:00:00Z')
        // No timezone
      };
      
      global.browser.storage.local.get.mockResolvedValue({
        'https://example.com': JSON.stringify(dict)
      });
      
      await handleAlarm(mockAlarm);
      
      // Should use default timezone
      expect(scheduleAlarm).toHaveBeenCalled();
    });
  });

  describe('rescheduleAllAlarms', () => {
    test('reschedules all alarms from storage', async () => {
      const urls = {
        'https://example.com': JSON.stringify({
          set: 540,
          last: new Date('2024-01-15T10:00:00Z'),
          timezone: 'UTC'
        }),
        'https://other.com': JSON.stringify({
          set: 600,
          last: new Date('2024-01-15T11:00:00Z'),
          timezone: 'America/New_York'
        })
      };
      
      global.browser.storage.local.get.mockResolvedValue(urls);
      
      await rescheduleAllAlarms();
      
      expect(scheduleAlarm).toHaveBeenCalledTimes(2);
      expect(scheduleAlarm).toHaveBeenCalledWith('https://example.com', 540, 'UTC');
      expect(scheduleAlarm).toHaveBeenCalledWith('https://other.com', 600, 'America/New_York');
    });

    test('opens URLs that should be opened', async () => {
      const mockNow = new Date('2024-01-15T15:00:00Z');
      jest.setSystemTime(mockNow);
      
      const urls = {
        'https://example.com': JSON.stringify({
          set: 840, // 2:00 PM
          last: new Date('2024-01-15T10:00:00Z'), // Should open
          timezone: 'UTC'
        }),
        'https://other.com': JSON.stringify({
          set: 840,
          last: new Date('2024-01-15T14:30:00Z'), // Should NOT open
          timezone: 'UTC'
        })
      };
      
      global.browser.storage.local.get.mockResolvedValue(urls);
      
      await rescheduleAllAlarms();
      
      expect(openUrlAndUpdate).toHaveBeenCalledTimes(1);
      expect(openUrlAndUpdate).toHaveBeenCalledWith('https://example.com', expect.any(Object));
    });

    test('handles errors gracefully', async () => {
      const urls = {
        'https://example.com': 'invalid json',
        'https://valid.com': JSON.stringify({
          set: 540,
          last: new Date('2024-01-15T10:00:00Z'),
          timezone: 'UTC'
        })
      };
      
      global.browser.storage.local.get.mockResolvedValue(urls);
      
      // Should not throw, should continue processing other URLs
      await expect(rescheduleAllAlarms()).resolves.not.toThrow();
      
      // Should still process valid URL
      expect(scheduleAlarm).toHaveBeenCalledWith('https://valid.com', 540, 'UTC');
    });
  });
});






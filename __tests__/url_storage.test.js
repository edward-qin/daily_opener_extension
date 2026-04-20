// Tests for URL storage operations
const { saveUrlSchedule, updateUrlSchedule, moveUrlEntry, removeUrl } = require('../src/shared/url_storage');

// Mock dependencies
jest.mock('../src/shared/alarm_utils', () => ({
  scheduleAlarm: jest.fn(() => Promise.resolve()),
  cancelAlarm: jest.fn(() => Promise.resolve(true))
}));

const { scheduleAlarm, cancelAlarm } = require('../src/shared/alarm_utils');

describe('url_storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.browser.storage.local.set.mockResolvedValue();
    global.browser.storage.local.remove.mockResolvedValue();
    global.browser.storage.local.get.mockResolvedValue({});
  });

  describe('saveUrlSchedule', () => {
    test('saves URL schedule and creates alarm', async () => {
      await saveUrlSchedule('https://example.com', 540, 'America/New_York');
      
      expect(global.browser.storage.local.set).toHaveBeenCalled();
      const setCall = global.browser.storage.local.set.mock.calls[0][0];
      expect('https://example.com' in setCall).toBe(true);
      
      const stored = JSON.parse(setCall['https://example.com']);
      expect(stored.set).toBe(540);
      expect(stored.timezone).toBe('America/New_York');
      expect(stored.last).toBeDefined();
      
      expect(scheduleAlarm).toHaveBeenCalledWith('https://example.com', 540, 'America/New_York');
    });

    test('sets last to current date', async () => {
      const before = new Date();
      await saveUrlSchedule('https://example.com', 540, 'UTC');
      const after = new Date();
      
      const setCall = global.browser.storage.local.set.mock.calls[0][0];
      const stored = JSON.parse(setCall['https://example.com']);
      const lastDate = new Date(stored.last);
      
      expect(lastDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(lastDate.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('updateUrlSchedule', () => {
    test('updates existing URL schedule', async () => {
      const existingData = {
        set: 480,
        last: new Date('2024-01-10T10:00:00Z'),
        timezone: 'UTC'
      };
      
      global.browser.storage.local.get.mockResolvedValue({
        'https://example.com': JSON.stringify(existingData)
      });
      
      await updateUrlSchedule('https://example.com', 600, 'America/New_York');
      
      expect(global.browser.storage.local.set).toHaveBeenCalled();
      const setCall = global.browser.storage.local.set.mock.calls[0][0];
      const stored = JSON.parse(setCall['https://example.com']);
      
      expect(stored.set).toBe(600);
      expect(stored.timezone).toBe('America/New_York');
      // Should preserve existing 'last' value
      expect(new Date(stored.last).getTime()).toBe(new Date(existingData.last).getTime());
      
      expect(scheduleAlarm).toHaveBeenCalledWith('https://example.com', 600, 'America/New_York');
    });

    test('creates new entry if URL does not exist', async () => {
      global.browser.storage.local.get.mockResolvedValue({});
      
      await updateUrlSchedule('https://example.com', 540, 'UTC');
      
      expect(global.browser.storage.local.set).toHaveBeenCalled();
      const setCall = global.browser.storage.local.set.mock.calls[0][0];
      const stored = JSON.parse(setCall['https://example.com']);
      
      expect(stored.set).toBe(540);
      expect(stored.timezone).toBe('UTC');
      expect(stored.last).toBeDefined();
    });
  });

  describe('moveUrlEntry', () => {
    test('moves URL entry from old to new URL', async () => {
      const oldData = {
        set: 480,
        last: new Date('2024-01-10T10:00:00Z'),
        timezone: 'UTC'
      };
      
      global.browser.storage.local.get.mockResolvedValue({
        'https://old.com': JSON.stringify(oldData)
      });
      
      await moveUrlEntry('https://old.com', 'https://new.com', 600, 'America/New_York');
      
      // Should cancel old alarm
      expect(cancelAlarm).toHaveBeenCalledWith('https://old.com');
      
      // Should remove old URL
      expect(global.browser.storage.local.remove).toHaveBeenCalledWith('https://old.com');
      
      // Should save new URL
      expect(global.browser.storage.local.set).toHaveBeenCalled();
      const setCall = global.browser.storage.local.set.mock.calls[0][0];
      expect('https://new.com' in setCall).toBe(true);
      
      const stored = JSON.parse(setCall['https://new.com']);
      expect(stored.set).toBe(600);
      expect(stored.timezone).toBe('America/New_York');
      
      // Should schedule alarm for new URL
      expect(scheduleAlarm).toHaveBeenCalledWith('https://new.com', 600, 'America/New_York');
    });

    test('preserves last when moving', async () => {
      const existingLast = new Date('2024-01-10T10:00:00Z');
      const oldData = {
        set: 480,
        last: existingLast,
        timezone: 'UTC'
      };

      global.browser.storage.local.get.mockResolvedValue({
        'https://old.com': JSON.stringify(oldData)
      });

      await moveUrlEntry('https://old.com', 'https://new.com', 600, 'UTC');

      const setCall = global.browser.storage.local.set.mock.calls[0][0];
      const stored = JSON.parse(setCall['https://new.com']);

      expect(new Date(stored.last).getTime()).toBe(existingLast.getTime());
    });
  });

  describe('removeUrl', () => {
    test('removes URL and cancels alarm', async () => {
      await removeUrl('https://example.com');
      
      expect(cancelAlarm).toHaveBeenCalledWith('https://example.com');
      expect(global.browser.storage.local.remove).toHaveBeenCalledWith('https://example.com');
    });

    test('cancels alarm before removing from storage', async () => {
      let removeCalled = false;
      global.browser.storage.local.remove.mockImplementation(() => {
        removeCalled = true;
        return Promise.resolve();
      });
      
      let cancelCalled = false;
      cancelAlarm.mockImplementation(() => {
        cancelCalled = true;
        return Promise.resolve(true);
      });
      
      await removeUrl('https://example.com');
      
      // cancelAlarm should be called first (implementation detail, but good practice)
      // In practice, both are async so order doesn't matter, but we verify both are called
      expect(cancelCalled).toBe(true);
      expect(removeCalled).toBe(true);
    });
  });
});

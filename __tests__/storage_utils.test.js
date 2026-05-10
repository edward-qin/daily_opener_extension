// Tests for storage utility functions
// Mock error handler
jest.mock('../src/shared/error_utils', () => ({
  onError: jest.fn()
}));

const { openUrlAndUpdate } = require('../src/shared/storage_utils');
const { onError } = require('../src/shared/error_utils');

describe('storage_utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.browser.storage.local.set.mockResolvedValue();
    global.browser.tabs.create.mockResolvedValue();
  });

  describe('openUrlAndUpdate', () => {
    test('updates last time and saves to storage', async () => {
      const url = 'https://example.com';
      const dict = {
        set: 540,
        last: new Date('2024-01-10T10:00:00Z'),
        timezone: 'UTC'
      };
      
      const before = new Date();
      await openUrlAndUpdate(url, dict);
      const after = new Date();
      
      // Should update last time
      expect(dict.last).toBeInstanceOf(Date);
      expect(dict.last.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(dict.last.getTime()).toBeLessThanOrEqual(after.getTime());
      
      // Should save to storage
      expect(global.browser.storage.local.set).toHaveBeenCalledWith({
        [url]: JSON.stringify(dict)
      });
    });

    test('opens URL in new tab', async () => {
      const url = 'https://example.com';
      const dict = {
        set: 540,
        last: new Date(),
        timezone: 'UTC'
      };
      
      await openUrlAndUpdate(url, dict);
      
      expect(global.browser.tabs.create).toHaveBeenCalledWith({ url: url });
    });

    test('handles tab creation errors gracefully', async () => {
      const url = 'https://example.com';
      const dict = {
        set: 540,
        last: new Date(),
        timezone: 'UTC'
      };
      
      const error = new Error('Tab creation failed');
      global.browser.tabs.create.mockRejectedValue(error);
      
      await openUrlAndUpdate(url, dict);
      
      // Should still update storage
      expect(global.browser.storage.local.set).toHaveBeenCalled();
      
      // Should call error handler
      expect(onError).toHaveBeenCalledWith(error);
    });

    test('mutates dict object directly', async () => {
      const url = 'https://example.com';
      const originalLast = new Date('2024-01-10T10:00:00Z');
      const dict = {
        set: 540,
        last: originalLast,
        timezone: 'UTC'
      };
      
      await openUrlAndUpdate(url, dict);
      
      // Should mutate the same object
      expect(dict.last).not.toBe(originalLast);
      expect(dict.last.getTime()).toBeGreaterThan(originalLast.getTime());
    });
  });
});

// Tests for URL utility functions
const { normalizeUrl, valUrl } = require('../src/shared/url_utils');

// Mock browser storage
const mockStorage = {};
global.browser = {
  storage: {
    local: {
      get: jest.fn(() => Promise.resolve(mockStorage))
    }
  }
};

describe('url_utils', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    jest.clearAllMocks();
  });

  describe('normalizeUrl', () => {
    test('normalizes URLs correctly', () => {
      expect(normalizeUrl('https://example.com')).toBe('https://example.com');
      expect(normalizeUrl('http://example.com')).toBe('https://example.com'); // http->https
      expect(normalizeUrl('example.com')).toBe('https://example.com');
      expect(normalizeUrl('Example.COM')).toBe('https://example.com'); // lowercase domain
    });

    test('handles paths correctly', () => {
      expect(normalizeUrl('https://example.com/path')).toBe('https://example.com/path');
      expect(normalizeUrl('https://example.com/path/')).toBe('https://example.com/path'); // removes trailing slash
      expect(normalizeUrl('https://example.com/')).toBe('https://example.com/'); // keeps root slash
    });

    test('preserves query strings and fragments', () => {
      expect(normalizeUrl('https://example.com?query=1')).toBe('https://example.com?query=1');
      expect(normalizeUrl('https://example.com#fragment')).toBe('https://example.com#fragment');
      expect(normalizeUrl('https://example.com/path?q=1#f')).toBe('https://example.com/path?q=1#f');
    });

    test('treats http and https as same for duplicate detection', () => {
      expect(normalizeUrl('http://example.com')).toBe(normalizeUrl('https://example.com'));
      expect(normalizeUrl('HTTP://Example.COM')).toBe(normalizeUrl('https://example.com'));
    });

    test('handles edge cases', () => {
      expect(normalizeUrl('')).toBe('');
      expect(normalizeUrl('   ')).toBe('');
      expect(normalizeUrl(null)).toBe('');
      expect(normalizeUrl(undefined)).toBe('');
    });

    test('handles invalid URLs gracefully', () => {
      // Returns as-is if URL parsing fails
      const invalid = 'not-a-valid-url';
      const result = normalizeUrl(invalid);
      expect(typeof result).toBe('string');
    });

    test('handles ports', () => {
      expect(normalizeUrl('https://example.com:8080')).toBe('https://example.com:8080');
      expect(normalizeUrl('http://example.com:8080/path')).toBe('https://example.com:8080/path');
    });
  });

  describe('valUrl', () => {
    test('validates and adds protocol if missing', async () => {
      const result = await valUrl('example.com', false);
      expect(result).toBe('https://example.com');
      
      const result2 = await valUrl('https://example.com', false);
      expect(result2).toBe('https://example.com');
    });

    test('rejects invalid URLs', async () => {
      const result = await valUrl('not a url', false);
      expect(result).toBe('');
      
      const result2 = await valUrl('', false);
      expect(result2).toBe('');
    });

    test('checks for duplicates when dupe=true', async () => {
      // Add a URL to storage
      mockStorage['https://example.com'] = JSON.stringify({ set: 60, last: new Date() });
      
      // Try to add the same URL
      const result = await valUrl('https://example.com', true);
      expect(result).toBe(''); // Rejected as duplicate
      
      // Try to add a different URL
      const result2 = await valUrl('https://other.com', true);
      expect(result2).toBe('https://other.com'); // Allowed
    });

    test('treats http and https as duplicates', async () => {
      // Add http URL
      mockStorage['https://example.com'] = JSON.stringify({ set: 60, last: new Date() });
      
      // Try to add https version
      const result1 = await valUrl('https://example.com', true);
      expect(result1).toBe(''); // Rejected
      
      // Try to add http version
      const result2 = await valUrl('http://example.com', true);
      expect(result2).toBe(''); // Also rejected (treated as same)
    });

    test('excludes URL from duplicate check when provided', async () => {
      // Add a URL
      mockStorage['https://example.com'] = JSON.stringify({ set: 60, last: new Date() });
      
      // Editing the same URL should be allowed
      const result = await valUrl('https://example.com', true, 'https://example.com');
      expect(result).toBe('https://example.com');
      
      // But changing to a duplicate of another URL should fail
      mockStorage['https://other.com'] = JSON.stringify({ set: 60, last: new Date() });
      const result2 = await valUrl('https://other.com', true, 'https://example.com');
      expect(result2).toBe(''); // Rejected as duplicate of other.com
    });

    test('does not check duplicates when dupe=false', async () => {
      mockStorage['https://example.com'] = JSON.stringify({ set: 60, last: new Date() });
      
      const result = await valUrl('https://example.com', false);
      expect(result).toBe('https://example.com'); // Allowed even though duplicate
    });

    test('handles case-insensitive domains', async () => {
      mockStorage['https://Example.COM'] = JSON.stringify({ set: 60, last: new Date() });
      
      const result = await valUrl('https://example.com', true);
      // Should be treated as duplicate due to normalization
      expect(result).toBe('');
    });
  });
});

// Polyfill Temporal for Node/Jest (Firefox 139+ provides this natively in the extension)
const { Temporal } = require('@js-temporal/polyfill');
global.Temporal = Temporal;

// Mock browser APIs for testing
global.browser = {
  alarms: {
    create: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve(true)),
    onAlarm: {
      addListener: jest.fn()
    }
  },
  storage: {
    local: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
      remove: jest.fn(() => Promise.resolve())
    }
  },
  tabs: {
    create: jest.fn(() => Promise.resolve())
  },
  runtime: {
    onStartup: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    }
  }
};

// Mock console.log to avoid test output noise
global.console = {
  ...console,
  log: jest.fn()
};

// Jest expects at least one test in this file when run directly.
// This keeps the file usable both as a setup file and as a test file.
test('jest setup runs', () => {
  expect(global.browser).toBeDefined();
});

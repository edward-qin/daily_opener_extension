# Test Suite

This directory contains comprehensive tests for the Daily Opener extension.

## Setup

Install dependencies:
```bash
npm install
```

## Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Test Files

- `time_utils.test.js` - Tests for time conversion and timezone utilities
- `url_utils.test.js` - Tests for URL validation and normalization
- `alarm_utils.test.js` - Tests for alarm scheduling and calculation
- `url_storage.test.js` - Tests for URL storage operations
- `alarm_handler.test.js` - Tests for alarm handling logic
- `storage_utils.test.js` - Tests for storage utilities

## Test Coverage

Tests cover:
- All pure utility functions (time conversion, URL validation)
- Timezone handling and DST transitions
- Duplicate URL detection (including http/https equivalence)
- Alarm scheduling and cancellation
- Storage operations (save, update, move, remove)
- Alarm handling and rescheduling
- Error handling

## Notes

- Browser APIs are mocked using Jest mocks in `setup.js`
- Tests use fake timers for time-based testing
- All async operations are properly tested with async/await

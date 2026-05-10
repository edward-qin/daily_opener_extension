# Changelog

All notable changes to this project will be documented in this file.


## [2.0.0]

### Breaking Changes
- Requires Firefox 139+ (uses native `Temporal` API)

### Added
- URL and time are both editable after adding an entry (changes saved automatically)
- Timezone support: pin a URL to a specific timezone, or use "Local timezone" to follow your device (useful when traveling)
- Status feedback after saving or adding changes
- Test suite (Jest) covering alarm scheduling, URL validation, storage, and time utilities

### Changed
- Scheduling switched from `setInterval` polling to the browser alarms API — URLs now open at the exact scheduled time rather than within a ~60-second window
- Background page is now non-persistent (event-driven)
- DST-correct scheduling via native `Temporal` API — handles spring-forward gaps and fall-back ambiguity
- Codebase restructured into `src/` with separate modules for background, popup, and shared utilities
- Redesigned popup UI and new extension icon


## [1.1.0] - (Rolled back in 1.1.1)

*Note: This version was rolled back due to a bug. Changes were re-investigated and included in 2.0.0.*

## [1.0.1]

- Fix bug where background script was not run persistently

## [1.0.0] - Initial Release

- Daily URL opening functionality
- Popup interface for managing scheduled URLs
- Automatic opening of tabs at specified times

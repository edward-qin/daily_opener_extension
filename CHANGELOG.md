# Changelog

All notable changes to this project will be documented in this file.


## [2.0.1]

### Fixed
- Double tab open on browser restart — `rescheduleAllAlarms` no longer opens tabs directly; overdue URLs are instead scheduled as a near-future alarm so `handleAlarm` is the sole opener, eliminating the race with stale pending alarms Firefox fires on startup
- Tabs not opening after system suspend/resume — a 1-minute periodic watchdog alarm now calls `checkOverdue` on wake, catching any URL alarms Firefox did not fire while the system was asleep
- Toolbar theme icons not switching — corrected `size` values in `theme_icons` from 48 to 16/32 (the sizes Firefox requests for the toolbar) and swapped the `light`/`dark` keys to match Firefox's naming convention (key describes the icon color, not the toolbar color)


## [2.0.0]

### Breaking Changes
- Requires Firefox 142+ (uses native `Temporal` API)

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

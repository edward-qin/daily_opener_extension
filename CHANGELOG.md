# Changelog

All notable changes to this project will be documented in this file.


## [1.2.0]

- URLs now open at the exact scheduled time (or as close to the top of the minute) instead of within a 60-second window
  - `alarms` permission to manifest.json (required for Browser Alarms API)
- Include initially rolled back changes from 1.1.0

## [1.1.0] - (Rolled back in 1.1.1)

*Note: This version was rolled back due to a bug. Changes will be re-investigated and included in a future release.*

* Support editing entries after adding them
* Add status flash after a change is saved
* Add timezone support

## [1.0.1]

- Fix bug where backgroudn script was not run persistently

## [1.0.0] - Initial Release

- Daily URL opening functionality
- Time-based scheduling with timezone support
- Popup interface for managing scheduled URLs
- Automatic opening of tabs at specified times
- Support for editing and removing scheduled URLs


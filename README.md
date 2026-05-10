# daily_opener_extension

Firefox extension (139+) to open tabs daily, but only once.

## Features

- Input URLs to open in a new tab on a daily basis; the scheduled time is set per URL
- Both the URL and time are editable after adding (changes saved automatically)
- Timezone is configurable per URL — defaults to your device's local timezone
- If the browser is closed or suspended past the scheduled time, the URL still opens on next launch
- Event-driven scheduling via the browser alarms API (no polling)

Below is an example of how to fill out the popup.
![example showing how to fill out extension](assets/example.png)

## Requirements

- Firefox 139 or later (uses native `Temporal` API for DST-safe scheduling)

## Small Note
This was my first extension and JavaScript project.
The extension can definitely be improved in both frontend and functionality.
Feel free to contribute!

## Generating a new version
Run the following, where `x.y.z` is the version number.
```bash
zip -r daily_opener-x.y.z.zip . \
  -x ".git/*" \
  -x "web-ext-artifacts/*" \
  -x "node_modules/*" \
  -x "__tests__/*" \
  -x "coverage/*" \
  -x "package*.json" \
  -x "babel.config.js" \
  -x ".*"
```

## Technical Details

### Storage Structure

The extension uses `browser.storage.local` to store scheduled URLs.

- **Key**: URL string (e.g., `"https://example.com"`)
- **Value**: JSON stringified object with the following properties:
  - `set`: `number` — Time in minutes since midnight (60 × hours + minutes). E.g. 9:30 AM = 570
  - `last`: `string` — ISO 8601 timestamp of when the URL was last opened by the extension
  - `timezone`: `string | null` — IANA timezone identifier (e.g., `"America/New_York"`), or `null` if "Local timezone" is selected. When `null`, the device's current timezone is resolved at alarm fire time.

Example storage entry:
```json
{
  "https://example.com": "{\"set\":570,\"last\":\"2024-01-15T14:30:00.000Z\",\"timezone\":\"America/New_York\"}"
}
```

### Alarm Scheduling

Each URL gets a named `browser.alarms` entry (keyed by URL). Alarms are rescheduled after every fire. On browser start or extension update, all alarms are rebuilt from storage so no opens are missed.

`null` timezone entries resolve to `Intl.DateTimeFormat().resolvedOptions().timeZone` at the moment the alarm is scheduled — meaning they follow device timezone changes automatically without requiring a storage update.

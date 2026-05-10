import { onError } from '../shared/error_utils.js';
import { scheduleAlarm } from '../shared/alarm_utils.js';
import { openUrlAndUpdate } from '../shared/storage_utils.js';

// Prevents two concurrent handleAlarm calls from both opening the same URL
// (e.g. a stale pre-close alarm and a freshly-scheduled near-future alarm
// both queued when the browser restarts).
const opening = new Set();

/**
 * Determines if a URL should be opened based on its last opened time and scheduled time.
 *
 * Semantics (matching tests):
 * - If the URL has **not been opened today** in the target timezone -> open once today
 * - If it **has** been opened today:
 *   - Open only if the scheduled time has already passed today
 *   - And the last-open time was **before** today's scheduled time
 *
 * This keeps behavior intuitive while still respecting timezones and DST via Intl.
 *
 * @param {Object} dict - The storage dictionary for the URL
 * @returns {boolean} True if URL should be opened, false otherwise
 */
function shouldOpenUrl(dict) {
  const set = dict["set"];
  const timezone = dict["timezone"] || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const last = new Date(dict["last"]);

  const now = Temporal.Now.zonedDateTimeISO(timezone);
  const lastInTz = Temporal.Instant.fromEpochMilliseconds(last.getTime())
    .toZonedDateTimeISO(timezone);

  const lastIsToday =
    lastInTz.year === now.year &&
    lastInTz.month === now.month &&
    lastInTz.day === now.day;

  const nowTotalMin = now.hour * 60 + now.minute;
  const lastTotalMin = lastInTz.hour * 60 + lastInTz.minute;

  const needsCheckToday = !lastIsToday || lastTotalMin < set;
  const needsTrigger = needsCheckToday && nowTotalMin >= set;
  return needsTrigger;
}

async function handleAlarm(alarm) {
  const url = alarm.name;
  const result = await browser.storage.local.get(url);

  if (alarm.name === '__watchdog__') {
    await checkOverdue();
    return;
  }
  if (!result[url]) {
    return;
  }

  const url = alarm.name;

  if (opening.has(url)) return;
  opening.add(url);

  try {
    const result = await browser.storage.local.get(url);
    if (!result[url]) return;

    const dict = JSON.parse(result[url]);
    if (shouldOpenUrl(dict)) {
      await openUrlAndUpdate(url, dict);
    }
    await scheduleAlarm(url, dict["set"], dict["timezone"]);
  } finally {
    opening.delete(url);
  }
}

// Opens any URLs that should have fired but didn't (e.g. alarm missed during
// system sleep). Schedules a near-future alarm so handleAlarm does the open,
// keeping the mutex and fresh-storage-read protections in place.
async function checkOverdue() {
  const results = await browser.storage.local.get(null);
  for (const url of Object.keys(results)) {
    try {
      const dict = JSON.parse(results[url]);
      if (shouldOpenUrl(dict)) {
        await browser.alarms.clear(url);
        await browser.alarms.create(url, { when: Date.now() + 3000 });
      }
    } catch (error) {
      onError(error);
    }
  }
}

// Reschedules all alarms from storage. For overdue URLs, schedules a near-future
// alarm instead of opening directly — this avoids a race with any stale pending
// alarm Firefox fires on browser restart (both would read stale storage and both
// would open the tab).
async function rescheduleAllAlarms() {
  const results = await browser.storage.local.get(null);

  for (const url of Object.keys(results)) {
    try {
      const dict = JSON.parse(results[url]);
      if (shouldOpenUrl(dict)) {
        await browser.alarms.clear(url);
        await browser.alarms.create(url, { when: Date.now() + 3000 });
      } else {
        await scheduleAlarm(url, dict["set"], dict["timezone"]);
      }
    } catch (error) {
      onError(error);
    }
  }
}

export { shouldOpenUrl, handleAlarm, rescheduleAllAlarms, checkOverdue };

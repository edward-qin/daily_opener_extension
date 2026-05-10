// Alarm handling logic for background script
import { onError } from '../shared/error_utils.js';
import { scheduleAlarm } from '../shared/alarm_utils.js';
import { openUrlAndUpdate } from '../shared/storage_utils.js';

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

  if (!lastIsToday) return true;

  const nowTotalMin = now.hour * 60 + now.minute;
  const lastTotalMin = lastInTz.hour * 60 + lastInTz.minute;

  return nowTotalMin >= set && lastTotalMin < set;
}

/**
 * Handles alarm events and opens URLs if needed
 * @param {browser.alarms.Alarm} alarm - The alarm event
 * @returns {Promise<void>}
 */
async function handleAlarm(alarm) {
  const url = alarm.name;
  const result = await browser.storage.local.get(url);
  if (!result[url]) {
    return;
  }

  const dict = JSON.parse(result[url]);
  
  if (shouldOpenUrl(dict)) {
    await openUrlAndUpdate(url, dict);
  }

  await scheduleAlarm(url, dict["set"], dict["timezone"]);
}

/**
 * Reschedules all alarms from storage
 * @returns {Promise<void>}
 */
async function rescheduleAllAlarms() {
  const results = await browser.storage.local.get(null);
  const keys = Object.keys(results);
  
  for (let url of keys) {
    try {
      const dict = JSON.parse(results[url]);

      if (shouldOpenUrl(dict)) {
        await openUrlAndUpdate(url, dict);
      }

      await scheduleAlarm(url, dict["set"], dict["timezone"]);
    } catch (error) {
      onError(error);
    }
  }
}

export { shouldOpenUrl, handleAlarm, rescheduleAllAlarms };

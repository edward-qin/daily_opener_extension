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
  const timezone =
    dict["timezone"] || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const last = new Date(dict["last"]);

  const hours = Math.floor(set / 60);
  const minutes = set % 60;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const extract = (date) => {
    const parts = formatter.formatToParts(date);
    const get = (type) =>
      parseInt(parts.find((p) => p.type === type).value, 10);

    const hour = get("hour");
    const minute = get("minute");

    return {
      year: get("year"),
      month: get("month"),
      day: get("day"),
      hour,
      minute,
      totalMinutes: hour * 60 + minute
    };
  };

  const nowInfo = extract(new Date());
  const lastInfo = extract(last);

  const targetTotalMin = hours * 60 + minutes;

  const lastIsToday =
    lastInfo.year === nowInfo.year &&
    lastInfo.month === nowInfo.month &&
    lastInfo.day === nowInfo.day;

  // If we haven't opened the URL today in this timezone, we should open it once today.
  if (!lastIsToday) {
    return true;
  }

  // Last open was today: only open again if we haven't yet opened after today's scheduled time.
  const nowHasPassedSchedule = nowInfo.totalMinutes >= targetTotalMin;
  const lastBeforeSchedule = lastInfo.totalMinutes < targetTotalMin;

  return nowHasPassedSchedule && lastBeforeSchedule;
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

  const set = dict["set"];
  const timezone = dict["timezone"] || Intl.DateTimeFormat().resolvedOptions().timeZone;
  await scheduleAlarm(url, set, timezone);
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
      const set = dict["set"];
      const timezone = dict["timezone"] || Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      if (shouldOpenUrl(dict)) {
        await openUrlAndUpdate(url, dict);
      }
      
      await scheduleAlarm(url, set, timezone);
    } catch (error) {
      onError(error);
    }
  }
}

// ES module exports
export { shouldOpenUrl, handleAlarm, rescheduleAllAlarms };

// CommonJS export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { shouldOpenUrl, handleAlarm, rescheduleAllAlarms };
}

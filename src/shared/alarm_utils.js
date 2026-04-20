// Shared alarm utilities used by both the background script and the popup
import { Temporal } from '@js-temporal/polyfill';

/**
 * Returns the next UTC timestamp (ms) at which the local time in `timeZone`
 * equals `set` (minutes since midnight).
 * Policy:
 * - If the time has passed today -> tomorrow
 * - If the local time does not exist today (DST gap) -> tomorrow
 * - On DST fall-back ambiguity -> first occurrence
 * 
 * @param {number} set - Time in minutes (60*hours + minutes)
 * @param {string} timeZone - Timezone string
 * @returns {number} Timestamp in milliseconds
 */
function calculateNextAlarmTime(set, timeZone) {
  const setHour = Math.floor(set / 60);
  const setMinute = set % 60;

  // Get current time in the target timezone
  const now = Temporal.Now.zonedDateTimeISO(timeZone);
  const nowMinutes = now.hour * 60 + now.minute;

  // Start with today, move to tomorrow if time has passed
  let targetDate = {
    year: now.year,
    month: now.month,
    day: now.day
  };
  
  if (set <= nowMinutes) {
    const tomorrow = now.add({ days: 1 });
    targetDate = {
      year: tomorrow.year,
      month: tomorrow.month,
      day: tomorrow.day
    };
  }

  // Create a PlainDateTime for the target wall-clock time
  const plainDateTime = Temporal.PlainDateTime.from({
    ...targetDate,
    hour: setHour,
    minute: setMinute,
    second: 0,
    millisecond: 0
  });

  // Convert to ZonedDateTime with disambiguation options
  // 'earlier' picks the first occurrence for ambiguous times (DST fall-back)
  let nextAlarm = plainDateTime.toZonedDateTime(timeZone, { disambiguation: 'earlier' });
  
  // Check if the resulting time matches what we requested
  // If not, the time doesn't exist (DST spring-forward gap) - move to tomorrow
  if (nextAlarm.hour !== setHour || nextAlarm.minute !== setMinute ||
      nextAlarm.year !== targetDate.year || nextAlarm.month !== targetDate.month || 
      nextAlarm.day !== targetDate.day) {
    // Time doesn't exist today, use tomorrow
    const tomorrow = now.add({ days: 1 });
    const tomorrowPlain = Temporal.PlainDateTime.from({
      year: tomorrow.year,
      month: tomorrow.month,
      day: tomorrow.day,
      hour: setHour,
      minute: setMinute,
      second: 0,
      millisecond: 0
    });
    nextAlarm = tomorrowPlain.toZonedDateTime(timeZone, { disambiguation: 'earlier' });
  }

  // Convert to UTC timestamp in milliseconds
  return nextAlarm.toInstant().epochMilliseconds;
}



/**
 * Schedules an alarm for a URL (clears existing alarm first to avoid duplicates)
 * @param {string} url - The URL to schedule
 * @param {number} set - Time in minutes (60*hours + minutes)
 * @param {string} timezone - Timezone string
 */
async function scheduleAlarm(url, set, timezone) {
  // Clear any existing alarm first to prevent duplicates
  await browser.alarms.clear(url);
  const alarmTime = calculateNextAlarmTime(set, timezone);
  await browser.alarms.create(url, { when: alarmTime });
}

/**
 * Cancels an alarm for a URL
 * @param {string} url - The URL to cancel
 * @returns {Promise<boolean>} True if alarm was cleared
 */
async function cancelAlarm(url) {
  return await browser.alarms.clear(url);
}

export { calculateNextAlarmTime, scheduleAlarm, cancelAlarm };


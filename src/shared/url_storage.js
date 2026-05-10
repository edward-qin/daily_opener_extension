// URL storage operations for managing URLs in browser storage
import { scheduleAlarm, cancelAlarm } from './alarm_utils.js';

/**
 * Saves a URL with its schedule settings to storage and schedules an alarm
 * @param {string} url - The URL to save
 * @param {number} time - Time in minutes (60*hours + minutes)
 * @param {string} timezone - Timezone string
 * @returns {Promise<void>}
 */
async function saveUrlSchedule(url, time, timezone) {
  let dict = {
    set: time,
    last: new Date(),
    timezone: timezone,
  };
  await browser.storage.local.set({ [url]: JSON.stringify(dict) });
  await scheduleAlarm(url, time, timezone);
}

/**
 * Updates an existing URL's schedule settings
 * @param {string} url - The URL to update
 * @param {number} time - Time in minutes (60*hours + minutes)
 * @param {string} timezone - Timezone string
 * @returns {Promise<void>}
 */
async function updateUrlSchedule(url, time, timezone) {
  const oldData = await browser.storage.local.get(url);
  let dict = oldData[url] ? JSON.parse(oldData[url]) : {
    set: time,
    last: new Date(),
    timezone: timezone,
  };
  
  // Update with new time/timezone
  dict.set = time;
  dict.timezone = timezone;
  // Keep existing 'last' opened time value unless this is a new entry
  
  await browser.storage.local.set({ [url]: JSON.stringify(dict) });
  await scheduleAlarm(url, time, timezone);
}

/**
 * Moves a URL entry from one URL to another (for URL editing)
 * @param {string} oldUrl - The old URL to remove
 * @param {string} newUrl - The new URL to create
 * @param {number} time - Time in minutes (60*hours + minutes)
 * @param {string} timezone - Timezone string
 * @returns {Promise<void>}
 */
async function moveUrlEntry(oldUrl, newUrl, time, timezone) {
  const oldData = await browser.storage.local.get(oldUrl);
  let dict = oldData[oldUrl] ? JSON.parse(oldData[oldUrl]) : {
    set: time,
    last: new Date(),
    timezone: timezone,
  };
  
  // Update with new time/timezone, preserve existing last-opened time
  dict.set = time;
  dict.timezone = timezone;
  
  // Cancel old alarm, remove old URL, add new URL
  await cancelAlarm(oldUrl);
  await browser.storage.local.remove(oldUrl);
  await browser.storage.local.set({ [newUrl]: JSON.stringify(dict) });
  await scheduleAlarm(newUrl, time, timezone);
}

/**
 * Removes a URL from storage and cancels its alarm
 * @param {string} url - The URL to remove
 * @returns {Promise<void>}
 */
async function removeUrl(url) {
  await cancelAlarm(url);
  await browser.storage.local.remove(url);
}

export { saveUrlSchedule, updateUrlSchedule, moveUrlEntry, removeUrl };

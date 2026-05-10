import { handleAlarm, rescheduleAllAlarms } from './alarm_handler.js';

browser.alarms.onAlarm.addListener(handleAlarm);

browser.runtime.onStartup.addListener(() => {
  rescheduleAllAlarms();
  browser.alarms.create('__watchdog__', { periodInMinutes: 1 });
});

browser.runtime.onInstalled.addListener(() => {
  rescheduleAllAlarms();
  browser.alarms.create('__watchdog__', { periodInMinutes: 1 });
});

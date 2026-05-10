// Background script - sets up alarm listeners and initialization
import { handleAlarm, rescheduleAllAlarms } from './alarm_handler.js';

browser.alarms.onAlarm.addListener(handleAlarm);

// onStartup: catches any opens missed while browser was closed
// onInstalled: sets up alarms after install or update (migration from old setInterval approach)
browser.runtime.onStartup.addListener(() => rescheduleAllAlarms());
browser.runtime.onInstalled.addListener(() => rescheduleAllAlarms());


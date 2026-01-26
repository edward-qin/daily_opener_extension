// Background script - sets up alarm listeners and initialization
import { handleAlarm, rescheduleAllAlarms } from './alarm_handler.js';

browser.alarms.onAlarm.addListener(handleAlarm);

// Handle browser restart and extension installation
browser.runtime.onStartup.addListener(() => rescheduleAllAlarms());
browser.runtime.onInstalled.addListener(() => rescheduleAllAlarms());

// Handle fallback
rescheduleAllAlarms();



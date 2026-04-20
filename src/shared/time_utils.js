// Time utility functions

/**
 * Converts time string (HH:mm) to minutes value
 * @param {string} timeString - Time string in HH:mm format
 * @returns {number} Time in minutes (60*hours + minutes)
 */
const timeVal = (timeString) => {
  return (
    parseInt(timeString.substring(0, 2)) * 60 +
    parseInt(timeString.substring(3))
  );
};

/**
 * Converts time value (minutes) to time string (HH:mm)
 * @param {number} timeValue - Time in minutes (60*hours + minutes)
 * @returns {string} Time string in HH:mm format
 */
const timeStr = (timeValue) => {
  return (
    Math.floor(timeValue / 60)
      .toString()
      .padStart(2, "0") +
    ":" +
    (timeValue % 60).toString().padStart(2, "0")
  );
};

/**
 * Gets UTC offset string for a timezone (e.g., "UTC-8", "UTC+5:30")
 * @param {string} timezone - Timezone string
 * @returns {string} UTC offset string
 */
function getTimezoneOffset(timezone) {
  try {
    const now = new Date();
    // Use Intl.DateTimeFormat to get timezone offset
    // Format a date in UTC and in the target timezone, compare the hour/minute values
    const utcFormatter = new Intl.DateTimeFormat("en", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    const tzFormatter = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    
    const utcParts = utcFormatter.formatToParts(now);
    const tzParts = tzFormatter.formatToParts(now);
    
    const utcHour = parseInt(utcParts.find(p => p.type === "hour").value);
    const utcMin = parseInt(utcParts.find(p => p.type === "minute").value);
    const tzHour = parseInt(tzParts.find(p => p.type === "hour").value);
    const tzMin = parseInt(tzParts.find(p => p.type === "minute").value);
    
    // Calculate difference in minutes
    const utcTotalMin = utcHour * 60 + utcMin;
    const tzTotalMin = tzHour * 60 + tzMin;
    const diffMin = tzTotalMin - utcTotalMin;
    
    // Handle day boundary (timezone could be on different day)
    let offsetMin = diffMin;
    if (Math.abs(diffMin) > 12 * 60) {
      // Likely crossed day boundary, adjust
      if (diffMin > 0) {
        offsetMin = diffMin - 24 * 60;
      } else {
        offsetMin = diffMin + 24 * 60;
      }
    }
    
    const sign = offsetMin >= 0 ? "+" : "-";
    const hours = Math.floor(Math.abs(offsetMin) / 60);
    const minutes = Math.abs(offsetMin) % 60;
    
    // Always use h:mm format (include :00 even for whole hours)
    return `UTC${sign}${hours}:${minutes.toString().padStart(2, "0")}`;
  } catch (e) {
    return "UTC+0:00";
  }
}

/**
 * Gets numeric offset value for sorting (in minutes from UTC)
 * @param {string} offsetString - UTC offset string (e.g., "UTC+5:30")
 * @returns {number} Offset in minutes from UTC
 */
function getTimezoneOffsetValue(offsetString) {
  // Parse "UTC+5:30" or "UTC-8:00" format (always includes :mm)
  const match = offsetString.match(/UTC([+-])(\d+):(\d+)/);
  if (!match) return 0;
  
  const sign = match[1] === "+" ? 1 : -1;
  const hours = parseInt(match[2]);
  const minutes = parseInt(match[3]);
  
  return sign * (hours * 60 + minutes);
}

export { timeVal, timeStr, getTimezoneOffset, getTimezoneOffsetValue };

/**
 * runs a check over all urls in the storage, opening the url in a tab if
 * it has passed the set time to open
 */
function runCheck() {
  let gettingAllStorageItems = browser.storage.local.get(null);

  // iterate over all stored urls
  gettingAllStorageItems.then((results) => {
    let keys = Object.keys(results);
    for (let url of keys) {
      let dict = JSON.parse(results[url]);
      const set = dict["set"];
      const last = new Date(dict["last"]);
      const timezone = dict["timezone"] || Intl.DateTimeFormat().resolvedOptions().timeZone;

      // get last time the tab should have been opened in the specified timezone
      let curr = new Date();
      const hours = Math.floor(set / 60);
      const minutes = set % 60;
      
      // Get current date/time components in the target timezone
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
      
      const parts = formatter.formatToParts(curr);
      const year = parseInt(parts.find(p => p.type === "year").value);
      const month = parseInt(parts.find(p => p.type === "month").value) - 1; // 0-indexed
      const day = parseInt(parts.find(p => p.type === "day").value);
      const currHour = parseInt(parts.find(p => p.type === "hour").value);
      const currMin = parseInt(parts.find(p => p.type === "minute").value);
      
      // Calculate timezone offset by comparing a known UTC time with its representation in target timezone
      // Use noon to avoid DST edge cases
      const noonUTC = new Date(Date.UTC(year, month, day, 12, 0, 0));
      const noonInTzParts = formatter.formatToParts(noonUTC);
      const noonTzHour = parseInt(noonInTzParts.find(p => p.type === "hour").value);
      const offsetHours = noonTzHour - 12;
      
      // Create target time in UTC (adjusting for timezone offset)
      let targetUTC = new Date(Date.UTC(year, month, day, hours - offsetHours, minutes, 0));
      
      // Verify and adjust: format the target UTC time back to target timezone to check
      const verifyParts = formatter.formatToParts(targetUTC);
      const verifyHour = parseInt(verifyParts.find(p => p.type === "hour").value);
      const verifyMin = parseInt(verifyParts.find(p => p.type === "minute").value);
      
      // If verification doesn't match, adjust (handles DST)
      if (verifyHour !== hours || verifyMin !== minutes) {
        const diff = (hours * 60 + minutes) - (verifyHour * 60 + verifyMin);
        targetUTC = new Date(targetUTC.getTime() + diff * 60000);
      }
      
      const currSet = targetUTC;
      
      // If target time hasn't occurred today in target timezone, check yesterday
      if (hours * 60 + minutes > currHour * 60 + currMin) {
        currSet.setUTCDate(currSet.getUTCDate() - 1);
      }

      // open if was not opened since the last time
      if (last < currSet) {
        dict["last"] = new Date();
        browser.storage.local.set({[url]: JSON.stringify(dict)});

        let creating = browser.tabs.create({
          url: url
        });
        creating.then(() => void 0, onError);
      }
    }
  }, onError);
}

// handles error
function onError(error) {
  console.log(`Error: ${error}`);
}

// run checks on startup and every minute
browser.runtime.onStartup.addListener(() => runCheck());
setInterval(() => runCheck(), 60000);



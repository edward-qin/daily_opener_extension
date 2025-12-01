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
      const hours = Math.floor(set / 60);
      const minutes = set % 60;

      // Current time in local (browser) timezone
      const now = new Date();

      // Current time interpreted in the target timezone.
      // toLocaleString with a timeZone gives us the wall-clock time in that zone;
      // constructing a Date from it gives a local Date with the same Y/M/D H:M.
      const nowInTz = new Date(now.toLocaleString("en-US", { timeZone: timezone }));

      // Build "today at HH:MM in that timezone" as a Date in that timezone's wall-clock.
      const targetInTz = new Date(nowInTz);
      targetInTz.setHours(hours, minutes, 0, 0);

      // Compute offset between that timezone and local time once, then reuse.
      const offsetMs = nowInTz.getTime() - now.getTime();

      // Convert the target-in-timezone Date to the equivalent UTC/local instant.
      const currSet = new Date(targetInTz.getTime() - offsetMs);

      // If target time hasn't occurred today in target timezone, check yesterday.
      if (targetInTz > nowInTz) {
        currSet.setDate(currSet.getDate() - 1);
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



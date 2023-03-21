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

      // get last time the tab should have been opened
      let curr = new Date();
      let currSet = new Date(curr);
      currSet.setHours(Math.floor(set/60), set % 60, 0, 0);
      if (currSet > curr) {
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
browser.runtime.onStartup.addListener(() => runCheck);
setInterval(function () {runCheck()}, 60000);



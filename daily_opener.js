function runCheck() {
  console.log("entered runCheck");
  let gettingAllStorageItems = browser.storage.local.get(null);

  // iterate over all stored urls
  gettingAllStorageItems.then((results) => {
    let keys = Object.keys(results);
    for (let url of keys) {
      let dict = JSON.parse(results[url]);
      const set = dict["set"];
      const last = new Date(dict["last"]);
      console.log(url, set, last);

      // get last time the tab should have been opened
      let curr = new Date();
      let currSet = new Date(curr);
      currSet.setHours(Math.floor(set/60), set % 60, 0, 0);
      if (currSet > curr) {
        currSet.setDate(currSet.getDate() - 1);
      }

      // open if was not opened since the last time
      if (last < currSet) {
        console.log("will change", currSet);
        dict["last"] = new Date();
        browser.storage.local.set({[url]: JSON.stringify(dict)});

        let creating = browser.tabs.create({
          url: url
        });
        creating.then(console.log("opened", url), onError);
      }
    }
  }, onError);
}

function onError(error) {
  console.log(`Error: ${error}`);
}

browser.runtime.onStartup.addListener(() => runCheck);
setInterval(function () {runCheck()}, 60000);



/**
 * creates and returns a line in the popup for user to input url and time to open url
 * @param {string} url url to put in the input element; set to "" if this line is empty
 * @param {number} time int representing time (60*h + m) to be set; only passed in when creating line for existing url schedule
 */
function createLine(url, time) {
  const line = document.createElement("div");
  line.setAttribute("class", "line");

  // Create the input field for the URL
  const inputUrl = document.createElement("input");
  inputUrl.setAttribute("type", "text");
  inputUrl.setAttribute("class", "input-url");

  // Create the input field for the time
  const inputTime = document.createElement("input");
  inputTime.setAttribute("type", "time");
  inputTime.setAttribute("class", "input-time");

  const button = document.createElement("button");

  // adds url and time to storage
  async function addHandler() {
    const url = await valUrl(inputUrl.value, true);
    if (url === "") {
      return;
    }

    const time = timeVal(inputTime.value);
    let dict = {
      set: time,
      last: new Date(),
    };

    let stored = browser.storage.local.set({ [url]: JSON.stringify(dict) });
    stored.then(() => {
      // change to remove button
      button.textContent = "Remove";
      button.removeEventListener("click", addHandler);
      button.addEventListener("click", removeHandler);
      inputUrl.readOnly = true;
      inputTime.addEventListener("change", updateHandler);
      createLine("", 0);
    });
  }

  // updates the url/time
  async function updateHandler() {
    const url = await valUrl(inputUrl.value, false);
    if (url === "") {
      return;
    }

    const time = timeVal(inputTime.value);
    let dict = {
      set: time,
      last: new Date(),
    };
    await browser.storage.local.set({ [url]: JSON.stringify(dict) });
  }

  // remove url from storage, remove line
  function removeHandler() {
    const url = inputUrl.value;
    let removed = browser.storage.local.remove(url);
    removed.then(() => {
      line.remove();
    });
  }

  // set button to add/remove
  if (url === "") {
    button.textContent = "Add";
    button.addEventListener("click", addHandler);
    inputTime.value = "00:00";
  } else {
    inputUrl.value = url;
    inputTime.value = timeStr(time);
    button.textContent = "Remove";
    button.addEventListener("click", removeHandler);
    inputUrl.readOnly = true;
    inputTime.addEventListener("change", updateHandler);
  }

  // add to document body
  line.appendChild(inputUrl);
  line.appendChild(inputTime);
  line.appendChild(button);
  document.body.appendChild(line);
}

/**
 * fills the popup with lines from storage and one new line to add in
 */
function fill() {
  let gettingAllStorageItems = browser.storage.local.get(null);
  console.log("initial state:");
  // iterate over all stored urls, add to form
  gettingAllStorageItems.then((results) => {
    results[""] = 0;
    let keys = Object.keys(results);
    for (let url of keys) {
      let dict = JSON.parse(results[url]);
      const time = dict["set"];
      console.log(url, time, new Date(dict["last"]));
      createLine(url, time);
    }
  });
}

// handles error
function onError(error) {
  console.log(`Error: ${error}`);
}

// checks that the url is valid, non-duplicate
// adds 'https://' if does not exist
// dupe is set to true if we want to prevent duplicates, false otherwise
async function valUrl(url, dupe) {
  if (!isValidUrl(url)) {
    return "";
  }
  url = url.indexOf("://") === -1 ? "https://" + url : url; // cannot have '://' elsewhere in url

  let items = await browser.storage.local.get(null);
  if (dupe && url in items) {
    return "";
  }
  return url;
}

// checks if a url is valid
const isValidUrl = (urlString) => {
  var urlPattern = new RegExp(
    "^(https?:\\/\\/)?" + // validate protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // validate domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // validate OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // validate port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // validate query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // validate fragment locator
  return !!urlPattern.test(urlString);
};

// gets time value
const timeVal = (timeString) => {
  return (
    parseInt(timeString.substring(0, 2)) * 60 +
    parseInt(timeString.substring(3))
  );
};

// gets time string
const timeStr = (timeValue) => {
  return (
    Math.floor(timeValue / 60)
      .toString()
      .padStart(2, "0") +
    ":" +
    (timeValue % 60).toString().padStart(2, "0")
  );
};

// fill the popup form
fill();

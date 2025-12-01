/**
 * creates and returns a line in the popup for user to input url and time to open url
 * @param {string} url url to put in the input element; set to "" if this line is empty
 * @param {number} time int representing time (60*h + m) to be set; only passed in when creating line for existing url schedule
 * @param {string} timezone timezone string; only passed in when creating line for existing url schedule
 */
function createLine(url, time, timezone) {
  const line = document.createElement("div");
  line.setAttribute("class", "line");

  // Create the input field for the URL
  const inputUrl = document.createElement("input");
  inputUrl.setAttribute("type", "text");
  inputUrl.setAttribute("class", "input-url");

  // Create a container for time and timezone (combined)
  const timeContainer = document.createElement("div");
  timeContainer.setAttribute("class", "time-container");
  
  // Create the input field for the time
  const inputTime = document.createElement("input");
  inputTime.setAttribute("type", "time");
  inputTime.setAttribute("class", "input-time");

  // Create the timezone selector
  const inputTimezone = document.createElement("select");
  inputTimezone.setAttribute("class", "input-timezone");
  
  // Populate timezone options with UTC offset, sorted by offset
  const timezones = Intl.supportedValuesOf('timeZone');
  const timezonesWithOffset = timezones.map(tz => {
    const offset = getTimezoneOffset(tz);
    const offsetValue = getTimezoneOffsetValue(offset);
    return { tz, offset, offsetValue };
  });
  
  // Sort by offset value (most negative to most positive)
  timezonesWithOffset.sort((a, b) => a.offsetValue - b.offsetValue);
  
  timezonesWithOffset.forEach(({ tz, offset }) => {
    const option = document.createElement("option");
    option.value = tz;
    option.textContent = `${tz} (${offset})`;
    inputTimezone.appendChild(option);
  });
  
  // Add both to container
  timeContainer.appendChild(inputTime);
  timeContainer.appendChild(inputTimezone);

  const button = document.createElement("button");
  const statusMessage = document.createElement("span");
  statusMessage.setAttribute("class", "status-message");
  statusMessage.style.display = "none";
  const statusContainer = document.createElement("div");
  statusContainer.style.marginLeft = "3%";
  statusContainer.appendChild(statusMessage);

  // adds url and time to storage
  async function addHandler() {
    const normalizedUrl = normalizeUrl(inputUrl.value);
    const url = await valUrl(normalizedUrl, true);
    
    if (url === "") {
      // Show error message
      inputUrl.classList.add("error");
      statusMessage.textContent = "Invalid URL or duplicate";
      statusMessage.classList.add("error");
      statusMessage.style.display = "block";
      setTimeout(() => {
        inputUrl.classList.remove("error");
        statusMessage.style.display = "none";
      }, 1500);
      return;
    }

    const time = timeVal(inputTime.value);
    const tz = inputTimezone.value;
    let dict = {
      set: time,
      last: new Date(),
      timezone: tz,
    };

    let stored = browser.storage.local.set({ [url]: JSON.stringify(dict) });
    stored.then(() => {
      // Visual feedback
      line.classList.add("success");
      statusMessage.textContent = "✓ Added";
      statusMessage.classList.remove("error");
      statusMessage.style.display = "block";
      setTimeout(() => {
        line.classList.remove("success");
        statusMessage.style.display = "none";
      }, 1000);
      
      // Update originalUrl to the newly added URL
      originalUrl = url;
      
      // change to remove button and enable editing
      button.textContent = "Remove";
      button.removeEventListener("click", addHandler);
      button.addEventListener("click", removeHandler);
      inputUrl.addEventListener("blur", urlChangeHandler);
      inputTimezone.disabled = false;
      inputTime.addEventListener("change", updateHandler);
      inputTimezone.addEventListener("change", updateHandler);
      createLine("", 0, null);
    });
  }

  // Track original URL for editing (set when line is created or URL is added)
  let originalUrl = url || "";
  
  // updates the time/timezone
  async function updateHandler() {
    const normalizedUrl = normalizeUrl(inputUrl.value);
    const currentUrl = await valUrl(normalizedUrl, false);
    if (currentUrl === "") {
      return;
    }

    const time = timeVal(inputTime.value);
    const tz = inputTimezone.value;
    let dict = {
      set: time,
      last: new Date(),
      timezone: tz,
    };
    await browser.storage.local.set({ [currentUrl]: JSON.stringify(dict) });
    
    // Visual feedback
    line.classList.add("success");
    statusMessage.textContent = "✓ Saved";
    statusMessage.classList.remove("error");
    statusMessage.style.display = "block";
    setTimeout(() => {
      line.classList.remove("success");
      statusMessage.style.display = "none";
    }, 1000);
  }
  
  // handles URL changes (editing existing entries)
  async function urlChangeHandler() {
    const normalizedNewUrl = normalizeUrl(inputUrl.value);
    const newUrl = await valUrl(normalizedNewUrl, true, originalUrl);
    
    if (newUrl === "") {
      // Invalid or duplicate URL
      inputUrl.classList.add("error");
      statusMessage.textContent = "Invalid URL or duplicate";
      statusMessage.classList.add("error");
      statusMessage.style.display = "block";
      setTimeout(() => {
        inputUrl.classList.remove("error");
        statusMessage.style.display = "none";
      }, 1500);
      // Restore original URL
      inputUrl.value = originalUrl;
      return;
    }
    
    if (normalizeUrl(newUrl) === normalizeUrl(originalUrl)) {
      // URL hasn't actually changed (maybe just formatting)
      return;
    }
    
    // Get current settings
    const time = timeVal(inputTime.value);
    const tz = inputTimezone.value;
    const oldData = await browser.storage.local.get(originalUrl);
    let dict = oldData[originalUrl] ? JSON.parse(oldData[originalUrl]) : {
      set: time,
      last: new Date(),
      timezone: tz,
    };
    
    // Update with current time/timezone
    dict.set = time;
    dict.timezone = tz;
    dict.last = new Date();
    
    // Remove old URL, add new URL
    await browser.storage.local.remove(originalUrl);
    await browser.storage.local.set({ [newUrl]: JSON.stringify(dict) });
    
    // Update original URL reference
    originalUrl = newUrl;
    inputUrl.value = newUrl;
    
    // Visual feedback
    line.classList.add("success");
    statusMessage.textContent = "✓ Updated";
    statusMessage.classList.remove("error");
    statusMessage.style.display = "block";
    setTimeout(() => {
      line.classList.remove("success");
      statusMessage.style.display = "none";
    }, 1000);
  }

  // remove url from storage, remove line
  function removeHandler() {
    const urlToRemove = inputUrl.value;
    let removed = browser.storage.local.remove(urlToRemove);
    removed.then(() => {
      line.remove();
      statusContainer.remove();
    });
  }

  // set button to add/remove
  if (url === "") {
    button.textContent = "Add";
    button.addEventListener("click", addHandler);
    inputTime.value = "00:00";
    inputTimezone.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } else {
    inputUrl.value = url;
    inputTime.value = timeStr(time);
    const defaultTz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Find matching timezone option (with offset display)
    const tzOptions = Array.from(inputTimezone.options);
    const matchingOption = tzOptions.find(opt => opt.value === defaultTz);
    if (matchingOption) {
      inputTimezone.value = defaultTz;
    } else {
      inputTimezone.value = defaultTz;
    }
    button.textContent = "Remove";
    button.addEventListener("click", removeHandler);
    // URL is editable for existing entries
    inputUrl.addEventListener("blur", urlChangeHandler);
    inputTimezone.disabled = false;
    inputTime.addEventListener("change", updateHandler);
    inputTimezone.addEventListener("change", updateHandler);
  }

  // add to document body
  line.appendChild(inputUrl);
  line.appendChild(timeContainer);
  line.appendChild(button);
  document.body.appendChild(line);
  document.body.appendChild(statusContainer);
}

/**
 * fills the popup with lines from storage and one new line to add in
 */
function fill() {
  let gettingAllStorageItems = browser.storage.local.get(null);
  console.log("initial state:");
  // iterate over all stored urls, add to form
  gettingAllStorageItems.then((results) => {
    let keys = Object.keys(results);
    for (let url of keys) {
      let dict = JSON.parse(results[url]);
      const time = dict["set"];
      const timezone = dict["timezone"];
      console.log(url, time, new Date(dict["last"]), timezone);
      createLine(url, time, timezone);
    }
    // Add empty line for new entry
    createLine("", 0, null);
  });
}

// handles error
function onError(error) {
  console.log(`Error: ${error}`);
}

// Normalizes URL for duplicate checking
function normalizeUrl(url) {
  if (!url || url.trim() === "") {
    return "";
  }
  
  // Add protocol if missing
  if (url.indexOf("://") === -1) {
    url = "https://" + url;
  }
  
  try {
    const urlObj = new URL(url);
    // Normalize: lowercase domain, remove trailing slash from path
    let normalized = urlObj.protocol.toLowerCase() + "//" + urlObj.hostname.toLowerCase();
    let path = urlObj.pathname;
    if (path.endsWith("/") && path.length > 1) {
      path = path.slice(0, -1);
    }
    normalized += path;
    if (urlObj.search) {
      normalized += urlObj.search;
    }
    if (urlObj.hash) {
      normalized += urlObj.hash;
    }
    return normalized;
  } catch (e) {
    return url; // Return as-is if URL parsing fails
  }
}

// checks that the url is valid, non-duplicate
// adds 'https://' if does not exist
// dupe is set to true if we want to prevent duplicates, false otherwise
// excludeUrl is the URL to exclude from duplicate check (for editing)
async function valUrl(url, dupe, excludeUrl = null) {
  if (!isValidUrl(url)) {
    return "";
  }
  url = url.indexOf("://") === -1 ? "https://" + url : url; // cannot have '://' elsewhere in url

  // Normalize URL for duplicate checking
  const normalizedUrl = normalizeUrl(url);
  const normalizedExclude = excludeUrl ? normalizeUrl(excludeUrl) : null;
  
  let items = await browser.storage.local.get(null);
  if (dupe) {
    // Check against normalized versions of stored URLs
    for (let storedUrl of Object.keys(items)) {
      const normalizedStored = normalizeUrl(storedUrl);
      // Skip if this is the URL we're editing
      if (normalizedExclude && normalizedStored === normalizedExclude) {
        continue;
      }
      if (normalizedStored === normalizedUrl) {
        return "";
      }
    }
  }
  return url; // Return original URL (not normalized) for storage
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

// gets UTC offset string for a timezone (e.g., "UTC-8", "UTC+5:30")
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

// gets numeric offset value for sorting (in minutes from UTC)
function getTimezoneOffsetValue(offsetString) {
  // Parse "UTC+5:30" or "UTC-8:00" format (always includes :mm)
  const match = offsetString.match(/UTC([+-])(\d+):(\d+)/);
  if (!match) return 0;
  
  const sign = match[1] === "+" ? 1 : -1;
  const hours = parseInt(match[2]);
  const minutes = parseInt(match[3]);
  
  return sign * (hours * 60 + minutes);
}

// fill the popup form
fill();

// Popup UI - Main entry point
import { onError } from '../shared/error_utils.js';
import { valUrl, normalizeUrl } from '../shared/url_utils.js';
import { timeVal, timeStr } from '../shared/time_utils.js';
import { saveUrlSchedule, updateUrlSchedule, moveUrlEntry, removeUrl } from '../shared/url_storage.js';
import { createTimezoneSelect, createStatusContainer, showErrorStatus, showSuccessStatus } from './dom_utils.js';

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
  const inputTimezone = createTimezoneSelect();
  
  // Add both to container
  timeContainer.appendChild(inputTime);
  timeContainer.appendChild(inputTimezone);

  const button = document.createElement("button");
  const { statusContainer, statusMessage } = createStatusContainer();

  // adds url and time to storage
  async function addHandler() {
    const validatedUrl = await valUrl(inputUrl.value, true);
    
    if (validatedUrl === "") {
      showErrorStatus(statusMessage, inputUrl, "Invalid URL or duplicate");
      return;
    }

    const time = timeVal(inputTime.value);
    const tz = inputTimezone.value || null;

    try {
      await saveUrlSchedule(validatedUrl, time, tz);

      showSuccessStatus(line, statusMessage, "✓ Added");

      originalUrl = validatedUrl;
      
      // change to remove button and enable editing
      button.textContent = "Remove";
      button.classList.replace("btn-primary", "btn-danger");
      button.removeEventListener("click", addHandler);
      button.addEventListener("click", removeHandler);
      inputUrl.addEventListener("blur", urlChangeHandler);
      inputTime.addEventListener("change", updateHandler);
      inputTimezone.addEventListener("change", updateHandler);
      createLine("", 0, null);
    } catch (error) {
      onError(error);
    }
  }

  // Track original URL for editing (set when line is created or URL is added)
  let originalUrl = url || "";
  
  // updates the time/timezone
  async function updateHandler() {
    // Don't normalize here - valUrl will handle it
    const currentUrl = await valUrl(inputUrl.value, false);
    if (currentUrl === "") {
      return;
    }

    const time = timeVal(inputTime.value);
    const tz = inputTimezone.value || null;

    try {
      await updateUrlSchedule(currentUrl, time, tz);
      // Visual feedback
      showSuccessStatus(line, statusMessage, "✓ Saved");
    } catch (error) {
      onError(error);
    }
  }
  
  // handles URL changes (editing existing entries)
  async function urlChangeHandler() {
    // Don't normalize here - valUrl will handle it
    const newUrl = await valUrl(inputUrl.value, true, originalUrl);
    
    if (newUrl === "") {
      // Invalid or duplicate URL
      showErrorStatus(statusMessage, inputUrl, "Invalid URL or duplicate");
      // Restore original URL
      inputUrl.value = originalUrl;
      return;
    }
    
    // Check if URL actually changed (using normalized comparison)
    if (normalizeUrl(newUrl) === normalizeUrl(originalUrl)) {
      // URL hasn't actually changed (maybe just formatting)
      return;
    }
    
    // Get current settings
    const time = timeVal(inputTime.value);
    const tz = inputTimezone.value || null;

    try {
      await moveUrlEntry(originalUrl, newUrl, time, tz);
      
      // Update original URL reference
      originalUrl = newUrl;
      inputUrl.value = newUrl;
      
      // Visual feedback
      showSuccessStatus(line, statusMessage, "✓ Updated");
    } catch (error) {
      onError(error);
    }
  }

  // remove url from storage, remove line
  async function removeHandler() {
    const urlToRemove = inputUrl.value;
    try {
      await removeUrl(urlToRemove);
      line.remove();
      statusContainer.remove();
    } catch (error) {
      onError(error);
    }
  }

  // set button to add/remove
  if (url === "") {
    button.textContent = "Add";
    button.classList.add("btn-primary");
    button.addEventListener("click", addHandler);
    inputTime.value = "00:00";
    inputTimezone.value = "";
  } else {
    inputUrl.value = url;
    inputTime.value = timeStr(time);
    inputTimezone.value = timezone || "";
    button.textContent = "Remove";
    button.classList.add("btn-danger");
    button.addEventListener("click", removeHandler);
    inputUrl.addEventListener("blur", urlChangeHandler);
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
 * Note: Does not reschedule alarms - they are already scheduled by the background script
 */
async function fill() {
  try {
    const results = await browser.storage.local.get(null);
    let keys = Object.keys(results);
    for (let url of keys) {
      try {
        let dict = JSON.parse(results[url]);
        const time = dict["set"];
        const timezone = dict["timezone"] || null;
        createLine(url, time, timezone);
        // Note: We don't reschedule alarms here to avoid duplicates
        // The background script handles alarm scheduling
      } catch (error) {
        onError(error);
      }
    }
    // Add empty line for new entry
    createLine("", 0, null);
  } catch (error) {
    onError(error);
  }
}

fill();

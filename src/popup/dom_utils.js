// DOM utility functions for popup UI
import { getTimezoneOffset, getTimezoneOffsetValue } from '../shared/time_utils.js';

/**
 * Shows an error status message
 * @param {HTMLElement} statusMessage - The status message element
 * @param {HTMLElement} inputElement - The input element to add error class to
 * @param {string} message - The error message to display
 * @param {number} duration - Duration in milliseconds (default: 1500)
 */
function showErrorStatus(statusMessage, inputElement, message, duration = 1500) {
  if (inputElement) {
    inputElement.classList.add("error");
  }
  statusMessage.textContent = message;
  statusMessage.classList.add("error");
  statusMessage.style.display = "block";
  setTimeout(() => {
    if (inputElement) {
      inputElement.classList.remove("error");
    }
    statusMessage.style.display = "none";
  }, duration);
}

/**
 * Shows a success status message
 * @param {HTMLElement} line - The line element to add success class to
 * @param {HTMLElement} statusMessage - The status message element
 * @param {string} message - The success message to display
 * @param {number} duration - Duration in milliseconds (default: 1000)
 */
function showSuccessStatus(line, statusMessage, message, duration = 1000) {
  line.classList.add("success");
  statusMessage.textContent = message;
  statusMessage.classList.remove("error");
  statusMessage.style.display = "block";
  setTimeout(() => {
    line.classList.remove("success");
    statusMessage.style.display = "none";
  }, duration);
}

/**
 * Creates and populates a timezone select dropdown
 * @returns {HTMLSelectElement} The populated timezone select element
 */
function createTimezoneSelect() {
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
  
  return inputTimezone;
}

/**
 * Creates a status message container with status span
 * @returns {Object} Object with statusContainer and statusMessage elements
 */
function createStatusContainer() {
  const statusMessage = document.createElement("span");
  statusMessage.setAttribute("class", "status-message");
  statusMessage.style.display = "none";
  const statusContainer = document.createElement("div");
  statusContainer.style.marginLeft = "3%";
  statusContainer.appendChild(statusMessage);
  return { statusContainer, statusMessage };
}

// ES module exports
export { showErrorStatus, showSuccessStatus, createTimezoneSelect, createStatusContainer };

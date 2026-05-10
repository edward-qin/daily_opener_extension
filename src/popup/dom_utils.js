// DOM utility functions for popup UI

const CURATED_TIMEZONES = [
  { group: 'Americas', zones: [
    { value: 'Pacific/Honolulu',                   label: 'Hawaii' },
    { value: 'America/Anchorage',                  label: 'Alaska' },
    { value: 'America/Los_Angeles',                label: 'Pacific — Los Angeles' },
    { value: 'America/Denver',                     label: 'Mountain — Denver' },
    { value: 'America/Phoenix',                    label: 'Arizona (no DST)' },
    { value: 'America/Chicago',                    label: 'Central — Chicago' },
    { value: 'America/New_York',                   label: 'Eastern — New York' },
    { value: 'America/Toronto',                    label: 'Toronto' },
    { value: 'America/Vancouver',                  label: 'Vancouver' },
    { value: 'America/Mexico_City',                label: 'Mexico City' },
    { value: 'America/Bogota',                     label: 'Bogotá' },
    { value: 'America/Sao_Paulo',                  label: 'São Paulo' },
    { value: 'America/Argentina/Buenos_Aires',     label: 'Buenos Aires' },
    { value: 'America/Santiago',                   label: 'Santiago' },
  ]},
  { group: 'Europe', zones: [
    { value: 'Europe/London',     label: 'London' },
    { value: 'Europe/Lisbon',     label: 'Lisbon' },
    { value: 'Europe/Paris',      label: 'Paris' },
    { value: 'Europe/Berlin',     label: 'Berlin' },
    { value: 'Europe/Rome',       label: 'Rome' },
    { value: 'Europe/Madrid',     label: 'Madrid' },
    { value: 'Europe/Amsterdam',  label: 'Amsterdam' },
    { value: 'Europe/Stockholm',  label: 'Stockholm' },
    { value: 'Europe/Warsaw',     label: 'Warsaw' },
    { value: 'Europe/Helsinki',   label: 'Helsinki' },
    { value: 'Europe/Athens',     label: 'Athens' },
    { value: 'Europe/Bucharest',  label: 'Bucharest' },
    { value: 'Europe/Istanbul',   label: 'Istanbul' },
    { value: 'Europe/Moscow',     label: 'Moscow' },
  ]},
  { group: 'Africa', zones: [
    { value: 'Africa/Casablanca',    label: 'Casablanca' },
    { value: 'Africa/Lagos',         label: 'Lagos' },
    { value: 'Africa/Cairo',         label: 'Cairo' },
    { value: 'Africa/Johannesburg',  label: 'Johannesburg' },
    { value: 'Africa/Nairobi',       label: 'Nairobi' },
  ]},
  { group: 'Asia', zones: [
    { value: 'Asia/Dubai',        label: 'Dubai' },
    { value: 'Asia/Karachi',      label: 'Karachi' },
    { value: 'Asia/Kolkata',      label: 'Mumbai / Kolkata' },
    { value: 'Asia/Dhaka',        label: 'Dhaka' },
    { value: 'Asia/Bangkok',      label: 'Bangkok' },
    { value: 'Asia/Jakarta',      label: 'Jakarta' },
    { value: 'Asia/Singapore',    label: 'Singapore' },
    { value: 'Asia/Shanghai',     label: 'Shanghai / Beijing' },
    { value: 'Asia/Hong_Kong',    label: 'Hong Kong' },
    { value: 'Asia/Taipei',       label: 'Taipei' },
    { value: 'Asia/Seoul',        label: 'Seoul' },
    { value: 'Asia/Tokyo',        label: 'Tokyo' },
    { value: 'Asia/Vladivostok',  label: 'Vladivostok' },
  ]},
  { group: 'Pacific & Oceania', zones: [
    { value: 'Australia/Perth',      label: 'Perth' },
    { value: 'Australia/Darwin',     label: 'Darwin' },
    { value: 'Australia/Adelaide',   label: 'Adelaide' },
    { value: 'Australia/Brisbane',   label: 'Brisbane' },
    { value: 'Australia/Sydney',     label: 'Sydney' },
    { value: 'Australia/Melbourne',  label: 'Melbourne' },
    { value: 'Pacific/Guam',         label: 'Guam' },
    { value: 'Pacific/Fiji',         label: 'Fiji' },
    { value: 'Pacific/Auckland',     label: 'Auckland' },
  ]},
];

/**
 * Creates a timezone select with "Browser timezone" as the default option,
 * followed by a curated list of major zones grouped by region.
 * @returns {HTMLSelectElement}
 */
function createTimezoneSelect() {
  const select = document.createElement("select");
  select.setAttribute("class", "input-timezone");

  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "Local timezone";
  defaultOpt.title = "Uses your device’s current timezone. Re-evaluated each time an alarm fires or the browser restarts — so it follows timezone changes automatically.";
  select.appendChild(defaultOpt);

  for (const { group, zones } of CURATED_TIMEZONES) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group;
    for (const { value, label } of zones) {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      optgroup.appendChild(opt);
    }
    select.appendChild(optgroup);
  }

  return select;
}

/**
 * Shows an error status message
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
 * Creates a status message container with status span
 */
function createStatusContainer() {
  const statusMessage = document.createElement("span");
  statusMessage.setAttribute("class", "status-message");
  statusMessage.style.display = "none";
  const statusContainer = document.createElement("div");
  statusContainer.setAttribute("class", "status-container");
  statusContainer.appendChild(statusMessage);
  return { statusContainer, statusMessage };
}

export { showErrorStatus, showSuccessStatus, createTimezoneSelect, createStatusContainer };

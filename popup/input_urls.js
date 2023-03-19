// creates new line
function createLine() {
  const line = document.createElement("div");
  line.setAttribute("class", "line");

  // Create the input field for the URL
  const inputUrl = document.createElement("input");
  inputUrl.setAttribute("type", "text");
  inputUrl.setAttribute("id", "input-url");

  // Create the select element for the time
  const inputTime = document.createElement("select");
  inputTime.setAttribute("id", "input-time");

  // Create options for the select element
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const option = document.createElement("option");
      option.value = hour * 60 + minute;
      option.text = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      inputTime.appendChild(option);
    }
  }

  // Create the Add button
  const addButton = document.createElement("button");
  addButton.setAttribute("id", "add-button");
  addButton.textContent = "Add";

  // Add button stores URL, adds new line
  addButton.addEventListener("click", () => {
    const url = inputUrl.value;
    const time = inputTime.value;
    storeUrl(url, time);
  });

  // Create the Remove button
  const removeButton = document.createElement("button");
  removeButton.setAttribute("id", "remove-button");
  removeButton.textContent = "Remove";

  // Remove button removes the line
  removeButton.addEventListener("click", () => {
    line.remove()
  });
  
  // Add to div and html body
  line.appendChild(inputUrl);
  line.appendChild(inputTime);
  line.appendChild(addButton);
  line.appendChild(removeButton);
  document.body.appendChild(line);
}

// stores mapping from time to url
function storeUrl(url, time) {
  let stored = browser.storage.local.set({ [time]: url });
  stored.then(() => {
    console.log(time, url);
    createLine();
  });
}

browser.tabs
  .executeScript({ file: "/content_scripts/daily_opener.js" })
  .then(createLine);

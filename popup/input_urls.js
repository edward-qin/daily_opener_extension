function createLine(url, time) {
  console.log("enter create line", url);
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

  const button = document.createElement("button");
  
  // adds url and time to storage
  function addHandler() {
    const url = inputUrl.value;
    const time = inputTime.value;
    if (!isValidUrl(url)) {
      return;
    }

    let stored = browser.storage.local.set({ [url]: time });
    stored.then(() => {
      // change to remove button
      button.textContent = "Remove";
      button.removeEventListener("click", addHandler);
      button.addEventListener("click", removeHandler);

      console.log("added", url, time);
      createLine("", 0);
    });
  }
  
  // remove url from storage, remove line
  function removeHandler() {
    const url = inputUrl.value;
    let removed = browser.storage.local.remove(url);
    removed.then(() => {
      line.remove();
      // document.body.removeChild(button.parentElement);
      console.log("removed", url);
    });
  }

  // set button to add/remove
  if (url === "") {
    button.textContent = "Add";
    button.addEventListener("click", addHandler);
  } else {
    inputUrl.value = url;
    inputTime.value = time;
    button.textContent = "Remove";
    button.addEventListener("click", removeHandler);
  }

  // add to document body
  line.appendChild(inputUrl);
  line.appendChild(inputTime);
  line.appendChild(button);
  document.body.appendChild(line);
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

// fills the popup using urls and times stored in storage
function fill() {
  let gettingAllStorageItems = browser.storage.local.get(null);
  console.log("initial state:");
  // iterate over all stored urls, add to form
  gettingAllStorageItems.then((results) => {
    results[""] = 0;
    let keys = Object.keys(results);
    for (let url of keys) {
      let time = results[url];
      console.log(url, time);
      createLine(url, time);
    }
  });
}
  

// 
browser.tabs
  .executeScript({ file: "/content_scripts/daily_opener.js" })
fill();
console.log(document.body.firstChild);
console.log(document.body.lastChild);
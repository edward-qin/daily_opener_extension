// Storage utility functions
import { onError } from './error_utils.js';

/**
 * Opens a URL in a new tab and updates its last opened time in storage
 * @param {string} url - The URL to open
 * @param {Object} dict - The storage dictionary for this URL
 * @returns {Promise<void>}
 */
async function openUrlAndUpdate(url, dict) {
  dict["last"] = new Date();
  await browser.storage.local.set({ [url]: JSON.stringify(dict) });
  try {
    await browser.tabs.create({ url: url });
  } catch (error) {
    onError(error);
  }
}

// ES module exports
export { openUrlAndUpdate };

// CommonJS export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { openUrlAndUpdate };
}

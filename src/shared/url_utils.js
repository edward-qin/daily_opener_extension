// URL utility functions

/**
 * Checks if a URL string is valid
 * @param {string} urlString - The URL string to validate
 * @returns {boolean} True if valid, false otherwise
 */
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

/**
 * Normalizes URL for duplicate checking
 * Treats http and https as equivalent for duplicate detection
 * @param {string} url - The URL to normalize
 * @returns {string} Normalized URL
 */
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
    // Normalize: treat http/https as same, lowercase domain, remove trailing slash from path
    // Always use https:// for consistency (http and https are treated as duplicates)
    // Preserve port if specified
    let host = urlObj.hostname.toLowerCase();
    if (urlObj.port) {
      host += ":" + urlObj.port;
    }
    let normalized = "https://" + host;
    let path = urlObj.pathname;
    
    // Check if original URL had explicit root slash (ends with / before query/hash)
    const urlBeforeQuery = url.split('?')[0].split('#')[0];
    const hasExplicitRootSlash = urlBeforeQuery.endsWith('/') && urlObj.pathname === '/';
    
    // Remove trailing slash if path is not root
    if (path.endsWith("/") && path.length > 1) {
      path = path.slice(0, -1);
    }
    
    // Add path: always add if not root, or if root and explicitly provided
    if (path !== "/") {
      normalized += path;
    } else if (hasExplicitRootSlash) {
      normalized += "/";
    }
    
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

/**
 * Validates URL and checks for duplicates in storage
 * @param {string} url - The URL to validate
 * @param {boolean} dupe - Whether to check for duplicates
 * @param {string|null} excludeUrl - URL to exclude from duplicate check (for editing)
 * @returns {Promise<string>} Valid URL or empty string if invalid/duplicate
 */
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

export { normalizeUrl, valUrl };

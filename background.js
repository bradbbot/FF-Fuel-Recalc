// Pattern for valid navlog URLs
const NAVLOG_PATTERN = /^https:\/\/plan\.foreflight\.com\/flights\/[\w-]+\/[\w-]+\/navlog$/;

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    // Clear only the storage for this specific URL
    const oldStorageKey = `navlog_${changeInfo.url}`;
    chrome.storage.local.remove([oldStorageKey]);
    
    // Enable/disable extension based on URL pattern
    if (NAVLOG_PATTERN.test(changeInfo.url)) {
      console.log('Valid navlog URL - enabling extension');
      chrome.action.enable(tabId);
      chrome.action.setIcon({
        path: "icon.png",
        tabId: tabId
      });
    } else {
      console.log('Invalid URL - disabling extension');
      chrome.action.disable(tabId);
      chrome.action.setIcon({
        path: "icon-disabled.png",
        tabId: tabId
      });
    }
  }
});

// Check URL when a tab is activated
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && NAVLOG_PATTERN.test(tab.url)) {
      chrome.action.enable(activeInfo.tabId);
      chrome.action.setIcon({
        path: "icon.png",
        tabId: activeInfo.tabId
      });
    } else {
      chrome.action.disable(activeInfo.tabId);
      chrome.action.setIcon({
        path: "icon-disabled.png",
        tabId: activeInfo.tabId
      });
    }
  } catch (error) {
    console.error('Error checking tab URL:', error);
  }
});
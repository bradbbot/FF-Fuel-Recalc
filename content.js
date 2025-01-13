chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getFuelValues") {
    const iframe = document.querySelector('iframe[src*="/flightdata/api/briefing/performance/proxy/iframe"]');
    if (!iframe) {
      sendResponse({ error: "Iframe not found" });
      return;
    }

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    const blockFuelSpan = iframeDoc.querySelector(".performance-metric.block-fuel span");
    const remCells = iframeDoc.querySelectorAll('tr.table-data-row td:nth-child(14)');  // Get all REM cells

    // Store original values
    const remValues = Array.from(remCells).map(cell => ({
      value: parseFloat(cell.textContent) || 0,
      text: cell.textContent  // Keep original text format
    }));

    sendResponse({
      blockFuel: parseFloat(blockFuelSpan?.textContent) || 0,
      remValues: remValues
    });
  }
});

// Listen for URL changes
let lastUrl = window.location.href;
new MutationObserver(() => {
  const url = window.location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Clear storage for the old URL
    const oldStorageKey = `navlog_${lastUrl}`;
    chrome.storage.local.remove([oldStorageKey]);
    chrome.runtime.sendMessage({ action: "urlChanged", url: url });
  }
}).observe(document, { subtree: true, childList: true });
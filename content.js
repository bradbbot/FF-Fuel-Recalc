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
    const waypointCells = iframeDoc.querySelectorAll('tr.table-data-row td:nth-child(1)'); // Get all waypoint cells

    // Store original values
    const remValues = Array.from(remCells).map(cell => ({
      value: parseFloat(cell.textContent) || 0,
      text: cell.textContent  // Keep original text format
    }));

    // Store waypoint values and make them editable
    const waypointValues = Array.from(waypointCells).map(cell => {
      // Make cell editable
      cell.contentEditable = true;
      cell.style.cursor = 'pointer';
      cell.title = 'Click to Rename'; // Add tooltip
      
      // Add tooltip using data attribute and CSS
      cell.setAttribute('data-tooltip', 'Click to Rename');
      cell.style.position = 'relative';
      
      // Add CSS for tooltip if it doesn't exist
      if (!iframeDoc.querySelector('#tooltip-style')) {
        const style = iframeDoc.createElement('style');
        style.id = 'tooltip-style';
        style.textContent = `
          [data-tooltip]:hover:after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 1000;
          }
        `;
        iframeDoc.head.appendChild(style);
      }
      
      // Add hover effect
      cell.addEventListener('mouseover', () => {
        cell.style.backgroundColor = '#f0f0f0';
      });
      cell.addEventListener('mouseout', () => {
        cell.style.backgroundColor = '';
      });

      return {
        original: cell.textContent.trim(),
        current: cell.textContent.trim()
      };
    });

    sendResponse({
      blockFuel: parseFloat(blockFuelSpan?.textContent) || 0,
      remValues: remValues,
      waypointValues: waypointValues
    });
  }

  if (request.action === "makeWaypointsEditable") {
    const iframe = document.querySelector('iframe[src*="/flightdata/api/briefing/performance/proxy/iframe"]');
    if (!iframe) return;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    const waypointCells = iframeDoc.querySelectorAll('tr.table-data-row td:nth-child(1)'); // Get all waypoint cells

    // Make waypoint cells editable
    waypointCells.forEach(cell => {
      cell.contentEditable = true;
      cell.style.cursor = 'pointer';
      cell.title = 'Click to Rename'; // Add tooltip
      
      // Add tooltip using data attribute and CSS
      cell.setAttribute('data-tooltip', 'Click to Rename');
      cell.style.position = 'relative';
      
      // Add CSS for tooltip if it doesn't exist
      if (!iframeDoc.querySelector('#tooltip-style')) {
        const style = iframeDoc.createElement('style');
        style.id = 'tooltip-style';
        style.textContent = `
          [data-tooltip]:hover:after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 1000;
          }
        `;
        iframeDoc.head.appendChild(style);
      }
      
      // Add hover effect
      cell.addEventListener('mouseover', () => {
        cell.style.backgroundColor = '#f0f0f0';
      });
      cell.addEventListener('mouseout', () => {
        cell.style.backgroundColor = '';
      });
    });
  }

  return true;
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
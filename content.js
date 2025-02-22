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

    // First, make all cells in Summary & Times non-editable
    const summaryTimesRows = iframeDoc.querySelectorAll('.summary-times tr.table-data-row');
    summaryTimesRows.forEach(row => {
      const cells = row.querySelectorAll('td');
      cells.forEach(cell => {
        cell.contentEditable = false;
        cell.style.cursor = 'default';
        cell.removeAttribute('data-tooltip');
        cell.title = '';
      });
    });

    // Then, make only the Souls on Board value cell editable
    const soulsOnBoardRow = Array.from(summaryTimesRows).find(row => 
      row.querySelector('td').textContent.trim() === 'Souls on board'
    );
    
    if (soulsOnBoardRow) {
      const soulsOnBoardCell = soulsOnBoardRow.querySelector('td:nth-child(2)');
      if (soulsOnBoardCell) {
        // Make cell editable
        soulsOnBoardCell.contentEditable = true;
        soulsOnBoardCell.style.cursor = 'pointer';
        soulsOnBoardCell.title = 'Click to Edit';
        
        // Add tooltip using data attribute and CSS
        soulsOnBoardCell.setAttribute('data-tooltip', 'Click to Edit');
        soulsOnBoardCell.style.position = 'relative';
        
        // Add hover effect
        soulsOnBoardCell.addEventListener('mouseover', () => {
          soulsOnBoardCell.style.backgroundColor = '#f0f0f0';
        });
        soulsOnBoardCell.addEventListener('mouseout', () => {
          soulsOnBoardCell.style.backgroundColor = '';
        });
      }
    }

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

    // First, make all cells in Summary & Times non-editable
    const summaryTimesRows = iframeDoc.querySelectorAll('.summary-times tr.table-data-row');
    summaryTimesRows.forEach(row => {
      const cells = row.querySelectorAll('td');
      cells.forEach(cell => {
        cell.contentEditable = false;
        cell.style.cursor = 'default';
        cell.removeAttribute('data-tooltip');
        cell.title = '';
      });
    });

    // Then, make only the Souls on Board value cell editable
    const soulsOnBoardRow = Array.from(summaryTimesRows).find(row => 
      row.querySelector('td').textContent.trim() === 'Souls on board'
    );
    
    if (soulsOnBoardRow) {
      const soulsOnBoardCell = soulsOnBoardRow.querySelector('td:nth-child(2)');
      if (soulsOnBoardCell) {
        // Make cell editable
        soulsOnBoardCell.contentEditable = true;
        soulsOnBoardCell.style.cursor = 'pointer';
        soulsOnBoardCell.title = 'Click to Edit';
        
        // Add tooltip using data attribute and CSS
        soulsOnBoardCell.setAttribute('data-tooltip', 'Click to Edit');
        soulsOnBoardCell.style.position = 'relative';
        
        // Add hover effect
        soulsOnBoardCell.addEventListener('mouseover', () => {
          soulsOnBoardCell.style.backgroundColor = '#f0f0f0';
        });
        soulsOnBoardCell.addEventListener('mouseout', () => {
          soulsOnBoardCell.style.backgroundColor = '';
        });
      }
    }
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
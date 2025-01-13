document.addEventListener("DOMContentLoaded", async () => {
  console.log("Popup script loaded.");

  let originalBlockFuel = 0;
  let currentBlockFuel = 0;
  let reserveFuel = 0;
  let extraFuel = 0;
  let originalREMValues = [];

  // Get the current tab's URL to use as part of the storage key
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const storageKey = `navlog_${currentTab.url}`;

  // Try to load stored values when popup opens
  chrome.storage.local.get([storageKey], (result) => {
    if (result[storageKey]) {
      const storedData = result[storageKey];
      originalBlockFuel = storedData.originalBlockFuel;
      originalREMValues = storedData.originalREMValues;
      currentBlockFuel = originalBlockFuel;
      
      // Update UI to show stored values
      document.getElementById('block-fuel').textContent = originalBlockFuel.toFixed(1) + " g";
      
      // Disable load button
      const loadButton = document.getElementById("load-block-fuel");
      loadButton.disabled = true;
      loadButton.textContent = "Loaded";
      loadButton.style.backgroundColor = "#cccccc";
      loadButton.style.cursor = "not-allowed";
    } else {
      // No stored data for this URL, ensure load button is enabled
      const loadButton = document.getElementById("load-block-fuel");
      loadButton.disabled = false;
      loadButton.textContent = "Load";
      loadButton.style.backgroundColor = "";
      loadButton.style.cursor = "pointer";
      document.getElementById('block-fuel').textContent = "Click Load";
    }
  });

  const loadBlockFuel = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        // Verify we're on a valid navlog URL
        const NAVLOG_PATTERN = /^https:\/\/plan\.foreflight\.com\/flights\/[\w-]+\/[\w-]+\/navlog$/;
        if (!NAVLOG_PATTERN.test(tab.url)) {
          document.getElementById('block-fuel').textContent = "Invalid page";
          return;
        }

        chrome.tabs.sendMessage(tab.id, { action: "getFuelValues" }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error getting fuel values:", chrome.runtime.lastError);
            document.getElementById('block-fuel').textContent = "Error loading";
            return;
          }
          if (response && response.blockFuel) {
            originalBlockFuel = response.blockFuel;
            currentBlockFuel = response.blockFuel;
            originalREMValues = response.remValues || [];
            
            // Store values in Chrome storage with URL-specific key
            const storageKey = `navlog_${tab.url}`;
            chrome.storage.local.set({
              [storageKey]: {
                originalBlockFuel: originalBlockFuel,
                originalREMValues: originalREMValues
              }
            });

            document.getElementById('block-fuel').textContent = originalBlockFuel.toFixed(1) + " g";
            console.log("Stored original REM values:", originalREMValues);
            
            // Disable the load button after successful load
            const loadButton = document.getElementById("load-block-fuel");
            loadButton.disabled = true;
            loadButton.textContent = "Loaded";
            loadButton.style.backgroundColor = "#cccccc";
            loadButton.style.cursor = "not-allowed";
          } else {
            document.getElementById('block-fuel').textContent = "No data found";
          }
        });
      }
    } catch (error) {
      console.error("Error in block fuel load:", error);
      document.getElementById('block-fuel').textContent = "Error loading";
    }
  };

  const updateBlockFuelOnPage = (useOriginalREM = false) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        console.error("No active tab found.");
        return;
      }

      const activeTab = tabs[0];
      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          func: (newBlockFuel, reserveFuel, extraFuel, originalREMValues, useOriginalREM) => {
            const frames = document.querySelectorAll("iframe");
            const targetFrame = Array.from(frames).find((frame) =>
              frame.src.includes("/flightdata/api/briefing/performance/proxy/iframe")
            );

            if (!targetFrame) {
              console.error("Target iframe not found.");
              return;
            }

            const iframeDocument = targetFrame.contentDocument || targetFrame.contentWindow.document;

            // Update the top fuel summary values
            const blockFuelSpan = iframeDocument.querySelector(".performance-metric.block-fuel span");
            const reserveFuelSpan = iframeDocument.querySelector(".performance-metric.reserve-fuel span");
            const extraFuelSpan = iframeDocument.querySelector(".performance-metric.extra-fuel span");
            const taxiFuelSpan = iframeDocument.querySelector(".performance-metric.taxi-fuel span");
            const flightFuelSpan = iframeDocument.querySelector(".performance-metric.flight-fuel span");
            const landingFuelSpan = iframeDocument.querySelector(".performance-metric.landing-fuel span");

            if (
              !blockFuelSpan ||
              !reserveFuelSpan ||
              !extraFuelSpan ||
              !taxiFuelSpan ||
              !flightFuelSpan ||
              !landingFuelSpan
            ) {
              console.error("Required fuel fields not found.");
              return;
            }

            blockFuelSpan.textContent = `${newBlockFuel.toFixed(1)} g`;
            reserveFuelSpan.textContent = `${reserveFuel.toFixed(1)} g`;
            extraFuelSpan.textContent = `${extraFuel.toFixed(1)} g`;

            const taxiFuel = parseFloat(taxiFuelSpan.textContent) || 0;
            const flightFuel = parseFloat(flightFuelSpan.textContent) || 0;
            const landingFuel = newBlockFuel - taxiFuel - flightFuel;

            landingFuelSpan.textContent = `${landingFuel.toFixed(1)} g`;

            // Get all data rows
            const allDataRows = iframeDocument.querySelectorAll('tr.table-data-row');
            const dataRowsArray = Array.from(allDataRows);

            if (useOriginalREM) {
              // Restore original REM values
              dataRowsArray.forEach((row, index) => {
                if (originalREMValues[index]) {
                  const fuelRemCell = row.children[13];
                  if (fuelRemCell) {
                    fuelRemCell.textContent = originalREMValues[index].text;
                  }
                }
              });
            } else {
              // Find the Alternate #1 header for normal calculation
              const alternateHeader = iframeDocument.querySelector('tr.sub-header td[title="Alternate 1 Route"]');
              let alternateStartIndex = -1;

              if (alternateHeader) {
                alternateStartIndex = dataRowsArray.findIndex(row => 
                  row.compareDocumentPosition(alternateHeader) & Node.DOCUMENT_POSITION_PRECEDING
                );
              }

              // Process main route rows
              let lastMainRouteREM = 0;
              for (let i = 0; i < (alternateStartIndex !== -1 ? alternateStartIndex : dataRowsArray.length); i++) {
                const row = dataRowsArray[i];
                const fuelUsedCell = row.children[12];
                const fuelRemCell = row.children[13];

                if (!fuelUsedCell || !fuelRemCell) continue;

                const fuelUsed = parseFloat(fuelUsedCell.textContent) || 0;
                const remValue = newBlockFuel - fuelUsed;
                fuelRemCell.textContent = remValue.toFixed(1) + " g";

                if (i === alternateStartIndex - 1) {
                  lastMainRouteREM = remValue;
                }
              }

              // Process alternate section
              if (alternateStartIndex !== -1 && lastMainRouteREM > 0) {
                const alternateBlockFuel = lastMainRouteREM;  // Use this as the new "block fuel" for alternate route
                
                // Process all alternate rows
                for (let i = alternateStartIndex; i < dataRowsArray.length; i++) {
                  const row = dataRowsArray[i];
                  const fuelUsedCell = row.children[12];
                  const fuelRemCell = row.children[13];

                  if (!fuelUsedCell || !fuelRemCell) continue;

                  // For first row (with dash), just set the REM to alternateBlockFuel
                  if (i === alternateStartIndex) {
                    fuelRemCell.textContent = `${alternateBlockFuel.toFixed(1)} g`;
                    continue;
                  }

                  // For all other rows, subtract their USED from alternateBlockFuel
                  const fuelUsed = parseFloat(fuelUsedCell.textContent) || 0;
                  const remValue = alternateBlockFuel - fuelUsed;
                  fuelRemCell.textContent = `${remValue.toFixed(1)} g`;
                }
              }
            }

            // Update the bottom fuel summary
            const bottomSummaryRows = iframeDocument.querySelectorAll(".fuel-weights .dont-break-container tr");
            
            bottomSummaryRows.forEach(row => {
              const label = row.children[0]?.textContent?.trim();
              const valueCell = row.children[1];
              
              if (label === "Block Fuel" && valueCell) {
                valueCell.textContent = `${newBlockFuel.toFixed(1)} g`;
              }
              else if (label === "Reserve Fuel" && valueCell) {
                valueCell.textContent = `${reserveFuel.toFixed(1)} g`;
              }
              else if (label === "Extra Fuel" && valueCell) {
                valueCell.textContent = `${extraFuel.toFixed(1)} g`;
              }
            });
          },
          args: [currentBlockFuel + reserveFuel + extraFuel, reserveFuel, extraFuel, originalREMValues, useOriginalREM],
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error("Script execution failed:", chrome.runtime.lastError.message);
          } else {
            console.log("Fuel values updated.");
          }
        }
      );
    });
  };

  document.getElementById("calculate").addEventListener("click", () => {
    if (originalBlockFuel === 0) {
      alert("Please load block fuel values first");
      return;
    }
    reserveFuel = parseFloat(document.getElementById("reserve-fuel").value) || 0;
    extraFuel = parseFloat(document.getElementById("extra-fuel").value) || 0;
    currentBlockFuel = originalBlockFuel;
    updateBlockFuelOnPage(false);  // Use calculated values
  });

  document.getElementById("reset").addEventListener("click", () => {
    if (originalBlockFuel === 0) {
      alert("Please load block fuel values first");
      return;
    }
    document.getElementById("reserve-fuel").value = "0";
    document.getElementById("extra-fuel").value = "0";
    reserveFuel = 0;
    extraFuel = 0;
    currentBlockFuel = originalBlockFuel;
    updateBlockFuelOnPage(true);  // Use original values
  });

  document.getElementById("load-block-fuel").addEventListener("click", async () => {
    await loadBlockFuel();
  });

  document.getElementById("hide").addEventListener("click", () => {
    window.close();
  });
});
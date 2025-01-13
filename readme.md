# ForeFlight Fuel Recalculator

A Chrome extension that enhances ForeFlight's web-based navlog by allowing quick fuel requirement recalculations.

## Features

- Load and modify block fuel values directly from ForeFlight navlog
- Add reserve and extra fuel amounts
- Automatically recalculates all fuel remaining (REM) values
- Properly handles Alternate #1 fuel calculations
- Updates both top and bottom fuel summaries
- URL-specific storage to handle multiple navlogs
- Reset functionality to restore original values

## Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

. Open a ForeFlight navlog in Chrome
2. Click the extension icon to open the popup
3. Click "Load" to get the current block fuel value
4. Enter desired reserve and/or extra fuel amounts
5. Click "Recalculate Fuel" to update the navlog
6. Use "Reset" to restore original values
7. Use "Hide" to close the popup

## Compatibility

- Works with ForeFlight web-based navlogs
- Requires Chrome browser
- URL pattern: `https://plan.foreflight.com/flights/*/navlog`

## Known Limitations

- Only works with gallons as fuel units
- Must be on a ForeFlight navlog page
- Requires developer mode in Chrome

## Contributing

Feel free to submit issues and enhancement requests!

## License

GNU GPLv3

## Acknowledgments

- Thanks to ForeFlight for their excellent flight planning platform
- Built using Chrome Extension APIs
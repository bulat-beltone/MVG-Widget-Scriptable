# MVG-Abfahrtsmonitor Widget

A Scriptable widget for iOS that displays real-time departure information for Munich's public transportation system (MVG). 
This widget shows current departures for buses, trains, and trams at any specified station in Munich.

## Features

- Real-time departure information from MVG
- Support for multiple transport types:
  - S-Bahn
  - U-Bahn
  - Bus
  - Regional Bus
  - Tram
  - Train
- Customizable display options:
  - Station selection
  - Platform filtering
  - Line filtering
  - Background color customization
- Three widget sizes supported:
  - Small
  - Medium
  - Large
- Color-coded lines for easy identification
- Delay indication with red text
- Automatic updates

## Installation

1. Long press on any app on your home screen
2. Select "Edit Home Screen"
3. Tap the "+" button at the top
4. Scroll down to find "Scriptable" in the list
5. Choose your desired widget size
6. Tap on the new widget
7. Select "MVG-Abfahrtsmonitor" as the script
8. Set "When Interacting" to "Run Script"
9. Enter your desired station name in the Parameter field
10. Done!

## Configuration

### Widget Parameters

The widget accepts parameters in the following format:
```
StationName,Platform,Labels,BackgroundColor
```

Example:
```
Marienplatz,1,S3;S4,#1C1C1C
```

- `StationName`: Required - The name of the station
- `Platform`: Optional - Filter by specific platform number
- `Labels`: Optional - Filter by specific lines (separated by semicolons)
- `BackgroundColor`: Optional - Custom background color (default: #1C1C1C)

### Transport Types

You can enable/disable specific transport types by modifying the boolean variables at the top of the script:
```javascript
const sbahn = true;
const ubahn = false;
const bus = false;
const regionalBus = false;
const tram = false;
const zug = false;
```

## Station Names

For accurate station names, please refer to:
https://www.mvg.de/verbindungen.html

## Credits

- Original version by Jacob Eckert (last version 17.02.2021)
- Updated by Bulat Davletov (28.03.2025)
- Licensed under Apache 2.0 License

## License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.

## Support

For updates and support, visit:
https://github.com/Nisbo/MVG-Abfahrtsmonitor 
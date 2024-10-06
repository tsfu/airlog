# AirLog Changelog


## WIP [1.0.0] - Target 2024.10.20

#### Added
- 

#### Fixed
- 

## WIP [MVP-3] - Target 2024.10.14

#### Added
- One-click demo button to show sample trips.
- Trips page text and buttons new placement.
- function to compare and count route of trips.

#### Fixed
- ID be unique when adding same trip many times.
- Fix toggle table display on mobile.
- AddRow code refactor and use jQuery more instead of DOM.
- Update/Submit button display switch when edit aborted.

## [MVP-2] - 2024.10.3

#### Added
- General UI and color improvements.
- Airline and aircrafts code information in `/data`.
- Airline logos and banners in `/assets`.
- Functions to calculate stats (not including airline and aircraft).
- New reponsive cards UI for stats tab!
- Use code/ID for airlines/aircrafts, enable input suggestion!
- Enhance table UI: airline logos + hover to see full names for airport/airline/aircraft.
- Support omitting city names. Showing IATA codes before names in UI now.
- Add national flag icon next to IATA code.

#### Fixed
- Now use IATA/ICAO codes for airline and aircraft IDs.
- Remove invalid base-layer providers from Cesium picker.
- Fix relative path to assets on host.
- Fix original data for A337 and PKX.
- Fix empty values handling for airline and aircarft.
- Fix unknown/invalid IATA/ICAO codes handling upon submission!
- Fix sessionStorage get cleared too soon during editing.
- Fix some id codes are not converting to upper case for indexing.

## [MVP-1] - 2024.9.30

#### Added
- Export trips to local JSON file.
- Edit a trip (UI and data)!
- Update the route on earth real time.

#### Fixed
- Check ID uniqueness.
- Fix distance/duration loading.
- Fix mobile table UI x-overflow.
- Remove unused things and warning info from Cesium viewer.

## [MVP-0] - 2024.9.28

#### Added 
- Ability to draw a route on earth given depature/arrival!
- Store logs in LocalStorage.
- Upload a JSON file to add multiple trips!
- Table and buttons UI enhancements.
  
#### Fixed
- Fix delete data from storage.

## [Initial-Setup] - 2024.9.20

#### Added
- Intial Commit, first adoption of cesiumJS.
- Added airport data in `/data/airports.csv`.
- Wrote functions to calculate distance and duration from input.
- Basic html/css/js with the help of ChatGPT :)

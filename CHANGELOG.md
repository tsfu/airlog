# AirLog Changelog


## [1.0.0] - Target 2024.10.20

#### Added
- Add trips table search and filter by vanilla JS.
- Adopt `Sortable` library for table sort, add `data-sort` for some columns.
- Small UI change for sortable columns.

#### Changed
- Add/edit/delete row functions now moved to `table.js`.
- Re-arranged some changelog items to `Changed` or `Removed`.

#### Fixed
- Rows were not added to `<tbody>` but `<thead>` (for this whole time...).
- Fix edit trip rowID mismatch with rows now in `<tbody>`.
- UI: search bar radius on iOS/ quick flashes when do empty loading.
- Fix event target and jQuery object mismatch when click outside to close modal.
- Fix unknown airline and aircraft in rankings break LoadStats().


## [MVP-3] - 2024.10.14

#### Added
- One-click demo button to show sample trips.
- function to compare and count route of trips.
- Cool slider info text on trips page.
- Stats page go live: get data from trips.
- UI enhancement and new rankings for stats cards.
- Add total CO2 emission info.
- Add a cool loader on stats page.

#### Changed
- Use defalut token in dev to save Bing Image usage on Cesium Ion. 
- Trips page text and buttons new placement.
- AddRow function refactored to reuse for add/edit
- Use jQuery more instead of DOM.
- Hide all cards and display message when there's no trip.

#### Fixed
- ID be unique when adding same trip many times.
- Fix toggle table display on mobile.
- Update/Submit button display switch when edit aborted.
- Fix noun single/plural on stats tab.
- Fix total time text not showing after update.
- Table shows when resizing window even without trips.


## [MVP-2] - 2024.10.3

#### Added
- General UI and color improvements.
- Airline and aircrafts code information in `/data`.
- Airline logos and banners in `/assets`.
- Functions to calculate stats (not including airline and aircraft).
- New reponsive cards UI for stats tab!
- Use code/ID for airlines/aircrafts, enable input suggestion!
- Enhance table UI: airline logos + hover to see full names for airport/airline/aircraft.
- Add national flag icon next to IATA code.

#### Changed
- Support omitting city names. Showing IATA codes before names in UI now.
- Now use IATA/ICAO codes for airline and aircraft IDs.

#### Fixed
- Fix relative path to assets on host.
- Fix original data for A337 and PKX.
- Fix empty values handling for airline and aircarft.
- Fix unknown/invalid IATA/ICAO codes handling upon submission!
- Fix sessionStorage get cleared too soon during editing.
- Fix some id codes are not converting to upper case for indexing.

#### Removed
- Remove invalid base-layer providers from Cesium picker.


## [MVP-1] - 2024.9.30

#### Added
- Export trips to local JSON file.
- Edit a trip (UI and data)!
- Update the route on earth real time.

#### Fixed
- Check ID uniqueness.
- Fix distance/duration loading.
- Fix mobile table UI x-overflow.

#### Removed
- Remove unused things and warning info from Cesium viewer.


## [MVP-0] - 2024.9.28

#### Added 
- Ability to draw a route on earth given departure/arrival!
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

# AirLog Changelog


## [WIP- 1.0.0] - Target 2024.10.20


## [WIP- MVP2] - 2024.10.

### Added
- UI and color improvements.
- Airline and aircrafts code information in `/data`, airline logos and banners in `/assets`
- Functions to calculate stats (not includinf airline and aircraft)

### Fixed


## [MVP-1] - 2024.9.30

### Added
- Fix Distance/duration loading
- Export trips to local JSON file
- Edit a trip
- Update the route on earth along with trip

### Fixed
- Check ID uniqueness
- Fix mobile table UI x-overflow
- Remove unused things and warning info from Cesium viewer

## [MVP-0] - 2024.9.28

### Added 
- Ability to draw a route on earth given depature/arrival
- Store logs in LocalStorage
- Upload a JSON file to add multiple trips!
  
### Fixed
- Fix delete data from storage

## [Initial-Setup] - 2024.9.20

### Added
- Intial Commit, first adoption of cesiumJS
- Added airport data in `/data/airports.csv`
- Wrote functions to calculate distance and duration from input
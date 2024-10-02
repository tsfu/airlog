# AirLog Changelog


## [WIP- 1.0.0] - Target 2024.10.20

#### Added

#### Fixed


## [MVP-2] - 2024.10.3

#### Added
- General UI and color improvements.
- Airline and aircrafts code information in `/data`
- airline logos and banners in `/assets`
- Functions to calculate stats (not includinf airline and aircraft)
- New reponsive cards UI for stats tab
- Use code/ID for airlines/aircrafts
- Enhance table UI: airline logos + hover to see full names for airport/airline/aircraft

#### Fixed
- Now use IATA/ICAO codes for airline and aircraft IDs
- Remove invalid base-layer providers from Cesium picker
- Fix relative path to assets on host
- Fix original data for A337 and PKX.

## [MVP-1] - 2024.9.30

#### Added
- Export trips to local JSON file
- Edit a trip (UI and data)
- Update the route on earth real time

#### Fixed
- Check ID uniqueness
- Fix distance/duration loading
- Fix mobile table UI x-overflow
- Remove unused things and warning info from Cesium viewer

## [MVP-0] - 2024.9.28

#### Added 
- Ability to draw a route on earth given depature/arrival
- Store logs in LocalStorage
- Upload a JSON file to add multiple trips
- Table and buttons UI enhancements
  
#### Fixed
- Fix delete data from storage

## [Initial-Setup] - 2024.9.20

#### Added
- Intial Commit, first adoption of cesiumJS
- Added airport data in `/data/airports.csv`
- Wrote functions to calculate distance and duration from input
- Basic html/css/js with the help of ChatGPT :)

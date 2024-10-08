<!-- omit in toc -->
# AirLog

- [Introduction](#introduction)
- [Usage](#usage)
  - [Globe](#globe)
  - [Trips](#trips)
  - [Stats](#stats)
- [Data](#data)
  - [Data Source](#data-source)
  - [Data Model](#data-model)
- [TODOs](#todos)
  - [Planned](#planned)
  - [Long term](#long-term)

## Introduction
AirLog is an air travel log tool. It keeps track of and visualizes your past trips in the air (flights logging). 

On an evening of mid September 2024, I was shocked and saddened by the news that "App In The Air", one of my favorite flight map apps, was shutting down. I then decided to create something similar but simpler with the help of ChatGPT. This will combine web development, UI design, and GIS stuff, which are the topics I am most interested in.

The design and idea of this site is inspired by `App In the Air`  and `Flighty`. 
This app is my personal project only. Not for commercial use.

## Usage
This is a pure frontend project. I use CDNs for JS libraries instead of node modules. There is no server-side code(nodeJS, npm, express, sqlite, etc). Also, to keep it simple, there is no framework in use. Therefore, this app does not store your data on a server. Your trips are stored client-side (in your browser) only. This is not likely to change in the short term.

This UI app is hosted on Github Pages (no server-side code supported). You may visit the app here: [AirLog](https://tsfu.github.io/airlog/). 

To test the app locally, you may use `git clone` to grab the code, then:
 - Run `npm install -g http-server`, or use some other light-weight demo server locally.
 - Open terminal and run ` http-server .` to start local server.
 - Go to the prompted address in your browser to view the project site.

There are 3 UI tabs for this app:
- Globe (3D earth view): Uses `CesiumJS` to visualize the routes of a user's past trips on 3D earth.
- Trips (log view): A table that holds all user input (display travel data and serve as data source). User can view, add, and edit trips. Use "Add Trip" to log a trip, or upload a JSON file to batch import trips. Use "Export Trips" to export trips to local file.
- Stats: Get some fun rankings and aggregation from user's travel data.

### Globe
This is made possible by  `CesiumJS` library and ChatGPT JS coding. For every trip you logged, it will draw an estimated flight route on earth, and mark depature/arrival info. When you edit/delete a trip record, the route changes accordingly. The loading of Cesium graphics may be lagging sometimes due to networks.

You can use a basic search bar, a reset button, a 2D/3D switch, and a base-layer image provider picker that all come from default Cesium ion.

When creating a Cesium 3D earth viewer, get an access token at `https://ion.cesium.com/tokens` and you may set your own configurations with your assets.

### Trips
A table that holds your travel records, with detailed information you have added.
This is the soure-of-truth data you provided and we use it to make visualization with other open source data and libraries.

User may use UI to add one trip, or upload JSON file to batch import trips. See `/data/sample_trips.json` to follow the format when you use upload.

When a user lands on the page for the first time (their trips are empty), there is a "demo" button which adds sample trips to showcase the UI.

To ensure your data won't get lost in case the client storage gets cleared, use the "Export Trips" to download trips into a local JSON file. You can keep it safe and import them back anytime.

### Stats
Some useful stats for user's travel history. Rankings, collections, aggregations, etc. The calculations mostly use javascript data structures' utility, and can all be found in `stats.js`. The stats data will re-calculate everytime the trips get updated. This page is view only. 


## Data
All data is obtained from user or public available resources. This app only operates users' trip info that they agreed to share. 

This is a pure client side app, which means we do not save or keep your data. The trips you added are stored within your web browser's `localStorage`. The LocalStorage data remains saved until it's explicitly cleared by the user(you). Closing browser or powering off your computer will not clear it. However, you should NOT assume the data is 100% safely stored or won't get lost.

This also means that your data will not sync between devices. It's client specific. Using 2 broswers on a same device (or use browser incognito window) will not share data as well. Before external data storage is implemented (nowhere close), I recommend keep a local copy of your trips data in a `.json` file.  

You may delete the locally saved data from your browser's developer tool UI, or use script. The storage usage of a typical user's trips would normally be smaller than 1MB.

### Data Source
This app uses open source data on the internet to complete and visualize your trips.
These are the dataset or sources it currently uses:

  - Trips: user data
  - Airport: csv file available thanks to [Github: ip2location/ip2location-iata-icao](https://github.com/ip2location/ip2location-iata-icao)
  - Flight: user input only
  - Airline: user input is compared to data at [Github: npow/airline-codes](https://github.com/npow/airline-codes/blob/master/airlines.json)
  - Aircraft: user input is compared to data at [Aircraft Type Designators Wikipedia](https://en.wikipedia.org/wiki/List_of_aircraft_type_designators)
  - Duration/Distance: Calculated from IATA codes upon user input using functions in `utils.js`. Also used `luxon` and `geotz` libraries to do timezone diff.
  - Airline logos and banners are made available thanks to [Github: Jxck-S/airline-logos](https://github.com/Jxck-S/airline-logos/)
  - National flag icons are made available by requesting CDN CSS thanks to [Github: lipis/flag-icons](https://github.com/lipis/flag-icons)

Under directory `/data`, you will find:
 -  `airports.csv` for airport information used for calculations and drawing.  
 -  `aircrafts.json` for aircraft type designators data.
 -  `airlines.json` for airlines IATA/ICAO information (including inactive carriers).
 -  and `sample_trips.json` as a format guide for importing/manipulating trips. 

IATA is a registered trademark of International Air Transport Association.
ICAO is a registered trademark of International Civil Aviation Organization.
All other brands mentioned on this site may be registered trademarks of their respective companies.

### Data Model
For now, the trips of a user are stored in a JS array, which holds multiple "trip" objects.
For each trip, the object looks like this: 
```js client
  {
      "id": "CTUDOH201808220214",
      "departureIATA": "CTU",     // IATA, required
      "arrivalIATA": "DOH",       // IATA, required
      "departureCity": "Chengdu",
      "arrivalCity": "Doha",
      "takeOffTime": "2018-08-22T02:14",    // local time, required
      "landingTime": "2018-08-22T05:25",    // local time, required 
      "duration": "",
      "distance": "",
      "flightNumber": "QR861",
      "airline": "QTR",   // ICAO
      "aircraft": "332",  // IATA
      "tailNumber": "A7-ACM",
      "seatClass": "Economy",
      "seatNumber": "32B"
  }
```
 - The trip's unique identifier `id` is only internally used, and will be generated automatically upon adding if absent. Recommend NOT to include `id`s in your json data for the initial import.
 - Required: `departureIATA`, `arrivalIATA`, `takeOffTime`, `landingTime`.
 - The `departureIATA`, `arrivalIATA` are IATA airports codes, `airline` is airline ICAO (3-letter) code, and `aircraft` is IATA aircraft designator code. These will be IDs for corresponding fields and calculations. 
 - Did not use more well known IATA airline code or ICAO aircraft code (the other way), because we need to make ID unique.
 - The `duration` and `distance` are not required, as they can be calculated upon importing.

## TODOs
  ### Planned
 - Trips Page:
   - Sort records by columns desc or asec
  ### Long term
   - Separate page or modal: single trip view
   - Table pagination? (TBD)
   - Better table UI for mobile (display some columns)
   - Better nav bar UI
   - Get aircraft models' pictures
   - Enhance UI on earth: show pop-up info card on the route when hover over
   - Add support for trains? Check out [this data source](https://brouter.damsy.net/latest/#map=4/50.11/21.52/standard&profile=rail)
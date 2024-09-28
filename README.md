<!-- omit in toc -->
# TravelMap

- [Introduction](#introduction)
- [Usage](#usage)
  - [GlobeView](#globeview)
  - [LogView](#logview)
  - [Stats](#stats)
- [Data](#data)
  - [DataSource](#datasource)
  - [DataModel](#datamodel)
- [CHANGELOG](#changelog)
  - [Initial Setup - 2024.9.20](#initial-setup---2024920)
  - [MVP0 - 2024.9.28](#mvp0---2024928)
- [TODOs](#todos)

## Introduction
This app is a travel log tool. It keeps track of and visualizes your past trips. (flights, and hopefully we can support trains later). 

On an evening of mid September 2024, I was shocked and saddened by the news that "App In The Air", one of my favorite flight map apps, is shutting down. I then decided to create something similar but simpler with the help of ChatGPT. This will combine web development, UI design, and GIS stuff, which are the topics I am most interested in.


The design and idea of this site is inspired by `App In the Air`  and `Flighty`. 
This app is my personal project only. Not for commercial use.

## Usage
This is a pure frontend project. I used CDNs instead of node modules. There is no server-side code(nodeJS, npm, express, sqlite, etc), also to keep this simple there is no framework in use. Therefore, this app does not store your data on server-side. Your added trips are stored client-side only. (This is not likely to change in the short term)

When at least an MVP is complete, I will likely host this site on Github Pages (that's why no server-side code). But to test or run this app locally, you may use `git clone` to grab the code, then:
 - Run `npm install -g http-server`, or use some other light-weight demo server locally.
 - Open terminal and run ` http-server .` to start server.
 - Go to the prompted address in your browser to view the project site.

There are 3 UI tabs for this app:
- Globe view: Uses `CesiumJS` to visualize the routes of a user's past trips on 3D earth.
- Log View: A table that holds all user input (display travel data and serve as data source). Use "Add Trip" to log a trip, or upload a JSON file to batch import trips. 
- Stats: Get some fun rankings and aggregation from user's travel data.

### GlobeView
This is made possible by  `CesiumJS` library and ChatGPT JS coding. For every trip you logged, it will draw an estimated flight route on earth, and mark depature/arrival info. When you delete a trip record, for now you need to refresh the page to see the route disappear.

### LogView
A table that holds your travel records, with detailed information you have added.
This is the soure-of-truth data you provided and we use it to make visualization with other open source data and libraries.

User may use form UI to add one trip, or upload JSON file to batch import trips. See `/data/sample_trips.json` to follow the format when you use upload.

### Stats
Some useful stats for user's travel history. Rankings, collections, progress, etc.


## Data
All data is obtained from user or public available resources. This app only operates users' trip info that they agreed to share. 

This is a pure client side app, which means we do not save or keep your data. The trips you added are stored within your web browser's `localStorage`. The LocalStorage data remains saved until it's explicitly cleared by the user(you). Closing browser or powering off your computer will not clear it. However, you should NOT assume the data is 100% safely stored or won't get lost.

You may delete the locally saved data from your browser's developer tool UI, or use script. The storage usage of a typical user's trips would normally be smaller than 1MB.

### DataSource
This app uses open source data on the internet to complete and visualize your trips.
These are the dataset or sources it currently uses:

  - Trips: user data
  - Airport: https://github.com/ip2location/ip2location-iata-icao
  - Flight: user input only
  - Airline: user input (may add auto-suggestion later)
  - Aircraft: user input (may add auto-suggestion later)
  - Duration/Distance: Calculated from IATA codes upon user input using functions in `utils.js`. Also used `luxon` and `geotz` libraries to do timezone diff.

Under directory `/data`, you will find `airports.csv` for airport information used for calculation above and drawing, and also `sample_trips.json` as a format guide for importing/manipulating trips. 

### DataModel
For now, the trips of a user are stored in a JS array, which holds multiple "trip" objects.
For each trip, the object looks like this: 
```js client
  {
      "id": "CTUDOH201808220214",
      "departureCity": "Chengdu",
      "departureIATA": "CTU",
      "arrivalCity": "Doha",
      "arrivalIATA": "DOH",
      "takeOffTime": "2018-08-22T02:14",
      "landingTime": "2018-08-22T05:25",
      "duration": "",
      "distance": "",
      "flightNumber": "QR861",
      "airline": "Qatar Airways",
      "aircraft": "Airbus A330-200",
      "tailNumber": "A7-ACM",
      "seatClass": "Economy",
      "seatNumber": "32B"
  }
```
 - The trip's unique identifier `id` is only internally used, and will be generated automatically upon adding if absent. Recommend NOT to include this in your json data for import.
 - The `duration` and `distance` are not required, as they can be calculated upon importing.

## CHANGELOG
### Initial Setup - 2024.9.20
- Intial Commit, first adoption of cesiumJS
- Added airport data in data/airports.csv
- Wrote functions to calculate distance and duration from input!
### MVP0 - 2024.9.28
- Ability to draw a route on earth given depature/arrival!
- Store logs in LocalStorage
- Upload a JSON file to add multiple trips!
- fix delete data from storage

## TODOs
 - Enhance Ui on earth: small info cards on the route?
 - Grab Airline logos
 - Grab national flag icons
 - Complete the log table as data source for globe view
   - Edit a record 
   - Sort records by columns?
   - Export .json file
 - Enhance LogView UI:
   - hover airport display full name
   - national flag icon next to city name
   - carrier logo next to airline   
 - Complete basic Global view:
   - Add basic flight info on the route, show as a card when hover on line
   - Add more info from log when expand the flight info card
 - Stats Page:
   - Get stats for route, airline, airport, aircraft ranking
   - Get stats for different time ranges
   - Get stats for different regions 
   - Collection: Aircraft, Country, Continents, etc... 
   - Progress: total hours, distance, ratio to the moon, etc.
 - Long term, add support for trains?
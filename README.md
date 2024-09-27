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
  - [Initial Setup - 2024.9](#initial-setup---20249)
- [TODOs](#todos)

## Introduction
This app is a travel log tool. It keeps track of and visualizes your past trips. (flights, and hopefully we can support trains later). 

On an evening of mid September 2024, I was shocked and saddened by the news that "App In The Air", one of my favorite flight map apps, is shutting down. I then decided to create something similar but simpler with the help of ChatGPT. This will combine web development, UI design, and GIS stuff, which are the topics I am most interested in.


The design and idea of this site is inspired by `App In the Air`  and `flighty`. 
This app is my personal project only. Not for commercial use.

## Usage
This is a pure frontend project. I used CDNs instead of node modules. There is no server-side code(nodeJS, npm, express, sqlite, etc), also to keep this simple there is no framework in use.

When complete, I will likely host this site on Github Pages (that's why no server-side code). Before that, to test or run it locally, you may:
 - Run `npm install -g http-server`, or use some other light-weight demo server locally.
 - Open terminal and run ` http-server .` to start server.
 - Go to the prompted address in your browser to view the project site.

There are 3 UI tabs for this app:
- Globe view: Uses `CesiumJS` to visualize the routes of a user's past trips on 3D earth.
- Log View: A table that holds all user input (display travel data and serve as data source)
- Stats: Get some fun rankings and aggregation from user's travel data.

### GlobeView
This is made possible by  `CesiumJS` library and ChatGPT JS coding.

### LogView
A table that holds your travel records, with detailed information you have added.
This is the soure-of-truth data you provided and we use it to make visualization with other open source data and libraries.

### Stats
Some useful stats for user's travel history. Rankings, collections, progress, etc.


## Data
All data is obtained from user or public available resources. This app only stores (if any) users' trip info that they provided to us.

### DataSource
This app uses open source data on the internet to complete and visualize your trips.
These are the dataset or sources it currently uses:

  - Trips: user data
  - Airport: https://github.com/ip2location/ip2location-iata-icao
  - Flight: user input only
  - Airline: user input (add auto-suggestion?)
  - Aircraft: user input (add auto-suggestion?)
  - Duration/Distance: Calculated upon user input using my helper methods in `airport.js`

### DataModel
TODO: Insert a data model diagram here.

## CHANGELOG
### Initial Setup - 2024.9
- Intial Commit, first adoption of cesiumJS
- Added airport data in data/airports.csv
- Wrote functions to calculate distance and duration from input!
- Ability to draw a route on earth given depature/arrival!

## TODOs
 - Enhance Ui on earth: small info cards on the route?
 - Grab Airline logos
 - Grab national flag icons
 - Complete the log table as data source for globe view
   - Edit a record 
   - Sort records by columns?
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
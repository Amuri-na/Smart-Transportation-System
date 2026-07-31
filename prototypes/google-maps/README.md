# Google Maps Integration Prototype

## Purpose

Validate whether passengers can quickly identify the best boarding station for their selected destination using an interactive map.

This prototype focuses only on validating the map-based station selection workflow. It is not intended to represent the final application.

---

## Hypothesis

If users can select their destination and compare nearby stations based on queue length, taxi availability, waiting time, and distance, they will make faster and better transportation decisions.

---

## Validation Questions

- Can users easily select their destination?
- Can users understand which stations serve that destination?
- Can users quickly compare available stations?
- Do waiting time and queue information influence station choice?
- Is navigation to the recommended station clear?
- Does map visualization improve decision-making?

---

## Features

- Detect user's current location
- Destination selection
- Display stations serving the selected destination
- Show destination-specific:
  - Queue length
  - Available taxis
  - Estimated waiting time
- Calculate distance to each station
- Recommend the best station
- Display navigation route
- Investigate traffic information availability

---

## Current Status

Prototype in development.

Transportation data is currently simulated for validation purposes.

---

## Technologies

- Leaflet
- OpenStreetMap
- HTML
- CSS
- JavaScript

> Technology choices for the final MVP (Flutter, React, etc.) will be decided after prototype validation.
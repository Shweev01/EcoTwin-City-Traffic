# EcoTwin Frontend

## Project

React-based dashboard for the EcoTwin urban traffic and carbon dispersal simulation.

The frontend visualizes live simulation data received through the FastAPI WebSocket backend.

## Frontend Responsibilities

- Display the simulated city grid
- Visualize live vehicle positions
- Display traffic-light states
- Visualize CO₂/carbon concentration
- Display live traffic and environmental metrics
- Display simulation status
- Integrate live simulation data through WebSockets

## Technology

- React
- Vite
- JavaScript
- Leaflet
- React-Leaflet
- WebSockets

## Frontend Structure

```text
src/
├── components/
│   └── CityMap.jsx
├── services/
│   ├── websocket.js
│   └── simulationData.js
├── App.jsx
├── App.css
├── index.css
└── main.jsx
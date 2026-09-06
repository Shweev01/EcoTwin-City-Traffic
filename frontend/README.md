# EcoTwin Frontend

## Project

EcoTwin is a Digital Twin traffic-control system that uses Reinforcement Learning to optimize urban traffic while considering carbon emissions.

## Frontend Role

The frontend provides a real-time cityscape dashboard for visualizing the EcoTwin simulation.

### Dashboard Responsibilities

- Display the simulated city grid
- Visualize vehicle positions
- Display traffic-light states
- Visualize carbon/CO₂ concentration
- Display traffic and environmental metrics
- Display simulation status
- Display Reinforcement Learning information
- Provide live visualization through WebSockets

## Technology

- React
- Vite
- JavaScript
- Deck.gl / Leaflet
- WebSockets

## Development Plan

### Week 1 — Map Scaffolding

- Initialize React application
- Create dashboard layout
- Set up base city-grid view
- Prepare mapping integration

### Week 2 — Live Render

- Connect to WebSocket data
- Render live vehicle coordinates
- Display moving vehicle markers

### Week 3 — Heatmap

- Add dynamic carbon concentration heatmap
- Visualize pollution hotspots

### Week 4 — Analytics

- Add live CO₂ metrics
- Add average waiting-time metrics
- Add charts and dashboard refinements

## Current Progress

### Day 1

- React/Vite application initialized
- EcoTwin dashboard foundation created
- Live metrics section created
- City simulation section created
- Base city-grid scaffold created
- Simulation status section created
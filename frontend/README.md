## Backend Integration

The React dashboard is prepared to receive live simulation data through
the FastAPI WebSocket endpoint:

`ws://127.0.0.1:8000/ws/traffic`

Expected simulation data includes:

- Vehicle ID, X/Y coordinates, speed, and waiting time
- Traffic-light ID, state, and phase
- CO₂ emission values with X/Y coordinates
- Total CO₂, average waiting time, and vehicle count

The frontend currently uses the agreed data structure and is ready for
integration with the real SUMO/TraCI simulation once the backend replaces
the mock simulation data.

## Current Integration Status

The React dashboard is prepared for integration with the FastAPI WebSocket
endpoint:

`ws://127.0.0.1:8000/ws/traffic`

The expected simulation data includes:

- Vehicle ID, X/Y coordinates, speed, and waiting time
- Traffic-light ID, state, and phase
- CO₂ emission values with X/Y coordinates
- Total CO₂, average waiting time, and vehicle count

Sample SUMO simulation data is available for development and validation.
The frontend will be connected to the actual SUMO/TraCI runtime data once
the real simulation-to-backend integration is ready.

No additional mock simulation data is being created in the frontend.
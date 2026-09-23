# EcoTwin Backend API

Backend communication layer for the EcoTwin traffic simulation system.

The backend is built with **FastAPI** and provides REST APIs and WebSocket communication for exchanging real-time simulation data between **SUMO, the future RL component, and the React dashboard**.

---

## 1. Current Architecture

The backend now uses a real SUMO simulation through TraCI.

```text
                    SUMO
                     ↕
                   TraCI
                     ↕
              SimulationService
                     ↕
               FastAPI Backend
                /            \
               /              \
              ↓                ↓
        REST API          WebSocket
              │                │
              ↓                ↓
     Current Snapshot     Live Updates
                                │
                                ↓
                         React Dashboard
```

The backend acts as the communication layer between the SUMO simulation and the React dashboard.

The planned complete architecture will additionally connect the RL component:

```text
                 ┌─────────────┐
                 │    SUMO     │
                 └──────┬──────┘
                        ↕
                      TraCI
                        ↕
                 ┌─────────────┐
                 │   FastAPI   │
                 │   Backend   │
                 └──────┬──────┘
                    ↙        ↘
                  RL          React
             Algorithm      Dashboard
                  │
                Actions
                  │
                  ↓
                 SUMO
```

---

## 2. Technology Stack

* Python 3.11
* FastAPI
* Uvicorn
* Pydantic
* WebSockets
* CORS
* Eclipse SUMO
* TraCI
* React
* Vite
* Leaflet
* React-Leaflet
* Recharts

The backend environment uses:

```text
Conda environment: ecotwin-api
Python: 3.11.16
SUMO: Eclipse SUMO 1.27.1
```

---

## 3. Project Setup

Create and activate the Conda environment:

```bash
conda activate ecotwin-api
```

Start the FastAPI development server from the `backend` directory:

```bash
uvicorn main:app --reload
```

The backend runs at:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

The React frontend runs separately using Vite:

```bash
npm install
npm run dev
```

The frontend is available at:

```text
http://localhost:5173/
```

---

## 4. API Endpoints

### 4.1 Health Check

```text
GET /health
```

Checks whether the backend is running.

Example response:

```json
{
  "status": "ok"
}
```

---

### 4.2 Get Current Simulation State

```text
GET /api/simulation/state
```

Returns one snapshot of the current SUMO simulation state.

The endpoint:

1. Starts the SUMO simulation through TraCI.
2. Advances the simulation.
3. Collects vehicle information.
4. Collects traffic-light information.
5. Collects emission information.
6. Calculates basic metrics.
7. Validates the data using the Pydantic model.
8. Returns the structured simulation state.
9. Closes the SUMO connection.

Example structure:

```json
{
  "type": "simulation_update",
  "timestamp": 1.0,
  "vehicles": [
    {
      "id": "westbound.0",
      "x": 4.8,
      "y": 11.5,
      "speed": 13.89,
      "waiting_time": 0.0
    }
  ],
  "traffic_lights": [
    {
      "id": "A1",
      "state": "GGggrrrrGGGg",
      "phase": 0
    }
  ],
  "emissions": [
    {
      "x": 4.8,
      "y": 11.5,
      "co2": 2058.8563
    }
  ],
  "metrics": {
    "total_co2": 2058.8563,
    "average_wait_time": 0.0,
    "vehicle_count": 1
  }
}
```

The endpoint provides a **single simulation snapshot**, unlike the WebSocket which continuously streams updates.

---

## 5. WebSocket

### 5.1 Traffic WebSocket

```text
WS /ws/traffic
```

The WebSocket continuously streams live simulation updates from SUMO to the React dashboard.

```text
SUMO
  │
  ↓
TraCI
  │
  ↓
SimulationService
  │
  ↓
FastAPI WebSocket
  │
  ├── Update 1
  ├── Update 2
  ├── Update 3
  ├── Update 4
  └── ...
  │
  ↓
React Dashboard
```

Each update contains:

* Simulation timestamp
* Vehicle information
* Traffic-light information
* Emission information
* Overall simulation metrics

The WebSocket currently uses a controlled broadcast frequency rather than sending data blindly on every internal SUMO step.

---

## 6. SUMO and TraCI Integration

The backend has been connected to the real Eclipse SUMO simulation using TraCI.

SUMO configuration:

```text
simulation/demo.sumocfg.xml
```

The backend's `SimulationService` is responsible for starting and closing the SUMO/TraCI connection.

The service also contains the SUMO data-collection methods so that SUMO-specific logic is not placed directly inside `main.py`.

### SimulationService responsibilities

```text
SimulationService
│
├── start()
│   └── Start SUMO through TraCI
│
├── get_vehicles()
│   ├── Vehicle ID
│   ├── X coordinate
│   ├── Y coordinate
│   ├── Speed
│   └── Waiting time
│
├── get_traffic_lights()
│   ├── Traffic-light ID
│   ├── Signal state
│   └── Current phase
│
├── get_emissions()
│   ├── X coordinate
│   ├── Y coordinate
│   └── CO₂ emission
│
└── stop()
    └── Close TraCI connection
```

The backend has been tested successfully with the real SUMO simulation.

---

## 7. Vehicle Data

The backend collects live vehicle information directly from SUMO.

Each vehicle contains:

| Field          | Type   | Description            |
| -------------- | ------ | ---------------------- |
| `id`           | string | Unique SUMO vehicle ID |
| `x`            | float  | SUMO X coordinate      |
| `y`            | float  | SUMO Y coordinate      |
| `speed`        | float  | Vehicle speed          |
| `waiting_time` | float  | Vehicle waiting time   |

The vehicle coordinates are streamed through the WebSocket and rendered by the React dashboard.

The dashboard has been verified to show **vehicles moving according to the live SUMO simulation**.

---

## 8. Traffic-Light Data

The backend collects traffic-light information directly from SUMO.

Each traffic light contains:

| Field   | Type    | Description                    |
| ------- | ------- | ------------------------------ |
| `id`    | string  | SUMO traffic-light ID          |
| `state` | string  | Current red/yellow/green state |
| `phase` | integer | Current active phase index     |

The current SUMO demo contains traffic-light controllers including:

```text
A1
B0
B1
B2
C1
```

The `state` represents the current signal state of the controlled links.

The `phase` represents the active traffic-light program phase.

Traffic-light data is continuously streamed to the frontend.

---

## 9. Emission / CO₂ Data

The backend collects CO₂ emission information from SUMO using TraCI.

Each emission entry contains:

| Field | Type  | Description                    |
| ----- | ----- | ------------------------------ |
| `x`   | float | Emission location X coordinate |
| `y`   | float | Emission location Y coordinate |
| `co2` | float | CO₂ emission value             |

The emission coordinates and values are streamed through the WebSocket.

The React dashboard consumes this information for the current emission visualization and future pollution heatmap.

---

## 10. Simulation Metrics

The backend calculates basic simulation metrics from the live SUMO state.

| Metric              | Description                                      |
| ------------------- | ------------------------------------------------ |
| `total_co2`         | Sum of CO₂ values from the current emission data |
| `average_wait_time` | Average waiting time of active vehicles          |
| `vehicle_count`     | Number of currently active vehicles              |
| `timestamp`         | Current SUMO simulation time                     |

Example:

```json
{
  "metrics": {
    "total_co2": 6456.9560,
    "average_wait_time": 0.0,
    "vehicle_count": 5
  }
}
```

These metrics are included in every WebSocket simulation update.

---

## 11. Controlled Simulation Loop

The WebSocket does not simply broadcast data without controlling the simulation loop.

The current flow is:

```text
1. Advance SUMO
        ↓
2. Read simulation time
        ↓
3. Collect vehicles
        ↓
4. Collect traffic lights
        ↓
5. Collect emissions
        ↓
6. Calculate metrics
        ↓
7. Validate SimulationUpdate
        ↓
8. Broadcast through WebSocket
        ↓
9. Continue simulation
```

This keeps SUMO simulation advancement and data broadcasting coordinated.

---

## 12. WebSocket Update-Frequency Benchmark

The WebSocket update frequency was benchmarked to avoid blindly sending data on every internal SUMO simulation step.

The current configuration uses a **0.2-second simulation/update interval**.

A benchmark at this configuration produced approximately:

```text
Simulation step:     0.2 seconds
Messages/second:     ~3.24
```

This provides a controlled real-time stream to the React dashboard while reducing unnecessary frontend updates compared with broadcasting every internal simulation step.

The update frequency can be adjusted later depending on frontend performance and the requirements of the RL integration.


---

## 13. Pydantic Data Contract

The backend validates outgoing simulation data using Pydantic models.

The WebSocket payload follows the structure:

```json
{
  "type": "simulation_update",
  "timestamp": 145.2,
  "vehicles": [
    {
      "id": "veh_001",
      "x": 152.4,
      "y": 89.1,
      "speed": 8.3,
      "waiting_time": 2.4
    }
  ],
  "traffic_lights": [
    {
      "id": "J1",
      "state": "G",
      "phase": 2
    }
  ],
  "emissions": [
    {
      "x": 150.0,
      "y": 90.0,
      "co2": 82.4
    }
  ],
  "metrics": {
    "total_co2": 1245.6,
    "average_wait_time": 28.4,
    "vehicle_count": 84
  }
}
```

This contract is shared between the backend and frontend.

---

## 14. Frontend Integration

The React dashboard connects to:

```text
ws://127.0.0.1:8000/ws/traffic
```

The frontend WebSocket service:

1. Opens the WebSocket connection.
2. Receives JSON messages.
3. Parses the messages.
4. Normalizes the backend field names.
5. Updates the React state.
6. Updates the dashboard metrics.
7. Updates the map.
8. Updates the analytics chart.
9. Updates the vehicle table.

The frontend normalizes:

```text
Backend:
traffic_lights

        ↓

Frontend:
trafficLights
```

The live dashboard has been successfully tested with the real SUMO backend.

The dashboard currently displays:

* Live connection status
* Active vehicle count
* Total CO₂
* Average waiting time
* Traffic status
* Simulation time
* Moving vehicles
* Traffic lights
* Emission data
* Vehicle table
* Simulation analytics

---

## 15. React Live Simulation Flow

The complete currently working flow is:

```text
┌─────────────┐
│    SUMO     │
└──────┬──────┘
       │
       │ TraCI
       ↓
┌─────────────────────┐
│ SimulationService   │
│                     │
│ Vehicles            │
│ Traffic Lights      │
│ Emissions           │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│      FastAPI        │
│                     │
│ /api/simulation/    │
│ state               │
│                     │
│ /ws/traffic         │
└──────────┬──────────┘
           │
           │ WebSocket
           ↓
┌─────────────────────┐
│   React Dashboard   │
│                     │
│ Moving vehicles     │
│ CO₂ metrics         │
│ Traffic lights      │
│ Analytics           │
└─────────────────────┘
```

This complete path has been verified with real simulation data.

---

## 16. CORS

Development CORS is configured so the React frontend can communicate with FastAPI.

Current development configuration:

```python
allow_origins=["*"]
```

For production, this should be restricted to the actual frontend origin.

---

## 17. Current Development Flow

The previous mock-only architecture:

```text
mock_sumo.py
      ↓
FastAPI
      ↓
React
```

has now been replaced for the main simulation path by:

```text
SUMO
  ↓
TraCI
  ↓
SimulationService
  ↓
FastAPI
  ↓
WebSocket
  ↓
React Dashboard
```

Mock data may still exist in the project for development/testing purposes, but the live dashboard is now receiving **real SUMO/TraCI data**.

---

## 18. Planned RL Integration

The RL component is not owned by the Data API member.

The planned communication flow is:

```text
                 SUMO
                  │
                  ↕
                TraCI
                  │
                  ↓
           FastAPI Backend
             ↙          ↘
          State          React
            ↓
            RL
        Algorithm
            │
          Action
            ↓
        FastAPI
            │
            ↓
           SUMO
```

Expected future interaction:

1. SUMO generates the current traffic state.
2. Backend collects the simulation state.
3. Backend exposes the relevant state to the RL component.
4. RL processes the state.
5. RL produces a traffic-light action.
6. Backend receives the action.
7. Backend applies the action to SUMO through the appropriate interface.
8. SUMO advances with the updated traffic-light control.
9. Backend collects the new simulation state.
10. Backend streams the updated state to React.

The exact RL ↔ backend communication mechanism still needs to be coordinated with the RL member.

The backend should provide a clean interface without coupling the API implementation directly to the RL algorithm.

---

## 19. Development Status

### Completed

* [x] Project setup
* [x] FastAPI server
* [x] Health endpoint
* [x] Simulation data contract
* [x] Pydantic schemas
* [x] Mock simulation data
* [x] REST simulation state endpoint
* [x] WebSocket data streaming
* [x] Development CORS configuration
* [x] API documentation
* [x] Real SUMO integration
* [x] TraCI connection
* [x] `SimulationService`
* [x] Real vehicle data collection
* [x] Vehicle coordinates
* [x] Vehicle speed
* [x] Vehicle waiting time
* [x] Traffic-light data collection
* [x] Traffic-light state
* [x] Traffic-light phase
* [x] CO₂ emission collection
* [x] CO₂ location data
* [x] Total CO₂ metric
* [x] Average waiting-time metric
* [x] Vehicle-count metric
* [x] Simulation timestamp
* [x] Controlled SUMO simulation loop
* [x] WebSocket update-frequency benchmarking
* [x] Live vehicle coordinate streaming
* [x] Live traffic-light streaming
* [x] Live emission streaming
* [x] React WebSocket integration
* [x] Live React dashboard
* [x] Moving vehicles rendered from real SUMO coordinates
* [x] Live simulation metrics displayed in React
* [x] End-to-end SUMO → TraCI → FastAPI → WebSocket → React testing
* [x] Basic connection/disconnection handling
* [x] Minimal multiple-client WebSocket behavior testing

### Remaining / Next Stage

* [ ] Finalize RL ↔ Backend communication interface
* [ ] Backend RL action handling
* [ ] Apply RL traffic-light actions to SUMO
* [ ] Complete SUMO ↔ Backend ↔ RL closed loop
* [ ] Production WebSocket connection management
* [ ] Production CORS configuration
* [ ] Extended error handling and reconnection strategy

---

## 20. Important Current Limitation

The backend currently starts a SUMO/TraCI connection for the simulation stream.

TraCI uses a single default connection in the current implementation.

Therefore, multiple simultaneous WebSocket clients require additional connection/session management before being considered fully supported.

The current single-client flow has been verified successfully:

```text
SUMO
  ↓
TraCI
  ↓
FastAPI
  ↓
WebSocket
  ↓
React
  ↓
Live moving vehicles
```

Multiple-client behavior remains a testing item before declaring the WebSocket layer fully multi-client capable.

---

## 21. Mid-Project Demonstration

The backend can now demonstrate the complete real-data path:

1. Start the SUMO simulation.
2. Start FastAPI.
3. Verify `/health`.
4. Open `/api/simulation/state`.
5. Show real SUMO vehicle data.
6. Show real traffic-light data.
7. Show real CO₂ data.
8. Connect to `/ws/traffic`.
9. Show live JSON updates changing as SUMO advances.
10. Show vehicle coordinates changing over time.
11. Open the React dashboard.
12. Demonstrate vehicles moving using streamed SUMO coordinates.
13. Demonstrate live CO₂ and simulation metrics.
14. Demonstrate traffic-light information.
15. Explain that the same communication layer will later carry RL-controlled traffic-light actions.

---

## 22. What This Member Owns

The Data API member owns:

* FastAPI backend
* Data contracts
* Pydantic validation
* SUMO/TraCI data collection
* Simulation data service
* REST API
* WebSocket streaming
* Backend/frontend communication
* Backend/RL communication interface
* Basic connection handling
* Simulation metrics

The Data API member does **not** own:

* Designing the SUMO road network
* Designing detailed traffic demand
* Designing/training PPO or another RL algorithm
* Building the React map UI
* Designing vehicle markers
* Designing the pollution heatmap
* Designing frontend charts

The backend provides clean interfaces for these components to integrate.

---

## 23. Final Target

The Data API layer has progressed from a mock communication layer to a working real-time bridge between the running SUMO simulation and the React dashboard.

The currently demonstrated pipeline is:

```text
SUMO
 ↓
TraCI
 ↓
FastAPI SimulationService
 ↓
WebSocket
 ↓
React Dashboard
 ↓
Live moving vehicles
```

The next major milestone is to extend this bridge to support the RL-controlled simulation loop:

```text
SUMO
 ↕
TraCI
 ↕
FastAPI
 ↕
RL
 ↕
FastAPI
 ↕
SUMO
 ↓
WebSocket
 ↓
React Dashboard
```

This will complete the communication layer for the full EcoTwin traffic-control system.

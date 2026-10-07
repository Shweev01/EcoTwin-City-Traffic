# EcoTwin City Traffic — Backend

A real-time traffic simulation backend built with **FastAPI, SUMO, TraCI, WebSockets, and Pydantic**.

The backend connects the SUMO traffic simulation with the application layer and provides simulation data, traffic-light control, live WebSocket updates, and a structured Python interface for reinforcement-learning integration.

---

# 1. Overview

The EcoTwin backend acts as the communication layer between the **SUMO traffic simulation** and the application.

It is responsible for:

* Starting and managing the SUMO simulation
* Communicating with SUMO through TraCI
* Collecting vehicle information
* Collecting traffic-light information
* Collecting CO₂ emission data
* Calculating simulation metrics
* Controlling traffic-light phases
* Providing REST APIs
* Streaming real-time simulation updates through WebSockets
* Validating API and simulation data using Pydantic
* Providing structured state and action interfaces for RL integration

### Backend Flow

```text
SUMO
  ↕
TraCI
  ↕
SimulationService
  ↕
SimulationController
  ↕
FastAPI
 ├── REST API
 ├── WebSocket
 └── RLInterface
```

---

# 2. Technology Stack

| Technology  | Purpose                     |
| ----------- | --------------------------- |
| Python 3.11 | Backend development         |
| FastAPI     | REST API framework          |
| Uvicorn     | ASGI server                 |
| SUMO        | Traffic simulation          |
| TraCI       | SUMO communication/control  |
| WebSockets  | Real-time data streaming    |
| Pydantic    | Data validation and schemas |
| Conda       | Environment management      |

---

# 3. Project Structure

```text
backend/
│
├── main.py
├── simulation_service.py
├── simulation_controller.py
├── rl_interface.py
├── requirements.txt
├── README.md
│
├── benchmark_websocket.py
├── mock_sumo.py
├── test_frontend.html
└── test_websocekt.py
```

### Core Backend Files

#### `main.py`

Main FastAPI application.

Responsible for:

* Creating the FastAPI application
* Configuring CORS
* Initializing backend services
* Defining REST endpoints
* Managing WebSocket connections
* Connecting the API layer with the simulation controller

#### `simulation_service.py`

Handles direct communication with SUMO through TraCI.

Responsible for:

* Starting SUMO
* Stopping SUMO
* Advancing simulation steps
* Reading simulation time
* Reading vehicle data
* Reading traffic-light data
* Controlling traffic-light phases
* Reading lane-level metrics
* Reading CO₂ emissions

#### `simulation_controller.py`

Acts as the control layer between FastAPI and `SimulationService`.

Responsible for:

* Simulation state management
* Simulation controls
* Snapshot generation
* Action handling
* Controller state
* RL state generation

#### `rl_interface.py`

Provides a structured Python interface for RL integration.

Responsible for:

* RL state models
* RL action models
* State retrieval
* Action validation
* Applying traffic-light actions

---

# 4. Environment Setup

The backend uses Python 3.11.

Create or activate the Conda environment:

```bash
conda create -n ecotwin-api python=3.11
conda activate ecotwin-api
```

Install the required Python packages:

```bash
pip install -r requirements.txt
```

---

# 5. SUMO Setup

The backend requires **Eclipse SUMO**.

The backend communicates with SUMO through **TraCI**.

Example SUMO installation:

```text
C:\Program Files (x86)\Eclipse\Sumo\bin
```

Verify the installation:

```bash
sumo --version
```

The project was developed and tested with:

```text
Eclipse SUMO 1.27.1
```

The simulation configuration used by the backend is located in:

```text
simulation/demo.sumocfg.xml
```

---

# 6. Running the Backend

Navigate to the backend directory:

```bash
cd C:\EcoTwin-City-Traffic\backend
```

Activate the environment:

```bash
conda activate ecotwin-api
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

FastAPI documentation is available at:

```text
http://127.0.0.1:8000/docs
```

---

# 7. API Endpoints

The backend currently provides the following endpoints.

| Method    | Endpoint                           | Purpose                        |
| --------- | ---------------------------------- | ------------------------------ |
| GET       | `/health`                          | Backend health check           |
| GET       | `/api/simulation/status`           | Current simulation status      |
| GET       | `/api/simulation/state`            | Current simulation snapshot    |
| POST      | `/api/simulation/pause`            | Pause simulation               |
| POST      | `/api/simulation/resume`           | Resume simulation              |
| POST      | `/api/simulation/step`             | Advance simulation manually    |
| POST      | `/api/simulation/action`           | Apply traffic-light action     |
| GET       | `/api/simulation/controller-state` | Get controller state           |
| WebSocket | `/ws/traffic`                      | Stream live simulation updates |

---

# 8. Health Check

### Endpoint

```text
GET /health
```

### Example response

```json
{
  "status": "ok"
}
```

This endpoint is used to verify that the FastAPI backend is running.

---

# 9. Simulation Status

### Endpoint

```text
GET /api/simulation/status
```

Returns the current backend simulation status.

Example:

```json
{
  "running": true,
  "paused": false,
  "websocket_connections": 0
}
```

The endpoint provides information about:

* Whether SUMO is running
* Whether the simulation is paused
* Number of connected WebSocket clients

---

# 10. Simulation State

### Endpoint

```text
GET /api/simulation/state
```

Returns the current simulation snapshot.

The response contains:

```text
timestamp
vehicles
traffic_lights
emissions
metrics
```

Example structure:

```json
{
  "type": "simulation_update",
  "timestamp": 88.5,
  "vehicles": [],
  "traffic_lights": [],
  "emissions": [],
  "metrics": {
    "total_co2": 56705.99,
    "average_wait_time": 15.01,
    "vehicle_count": 33
  }
}
```

The actual response contains the current vehicles, traffic lights, emissions, and metrics from SUMO.

---

# 11. Simulation Controls

The backend provides direct controls for the running simulation.

## Pause

```text
POST /api/simulation/pause
```

Pauses the simulation.

## Resume

```text
POST /api/simulation/resume
```

Resumes the simulation.

## Manual Step

```text
POST /api/simulation/step
```

Advances the simulation manually by one simulation step.

These controls allow the backend and dashboard to control simulation execution without directly interacting with SUMO.

---

# 12. Traffic-Light Control

The backend provides an API for changing traffic-light phases.

### Endpoint

```text
POST /api/simulation/action
```

Example request:

```json
{
  "traffic_light_id": "A1",
  "action": 0
}
```

The backend validates the traffic-light ID and action before sending the command to SUMO.

Traffic-light phase control is handled through TraCI.

---

# 13. Action Validation

The backend validates incoming traffic-light actions.

Invalid actions are rejected.

For example, a negative action:

```json
{
  "traffic_light_id": "A1",
  "action": -1
}
```

returns an error:

```json
{
  "detail": "Action must be a non-negative integer."
}
```

An unknown traffic-light ID is also rejected:

```json
{
  "detail": "Traffic light 'XYZ' not found."
}
```

This prevents invalid commands from reaching the simulation.

---

# 14. Controller State

### Endpoint

```text
GET /api/simulation/controller-state
```

Provides the current state maintained by the simulation controller.

The controller separates API-level requests from the underlying SUMO/TraCI implementation.

---

# 15. WebSocket Live Streaming

The backend provides real-time simulation updates through:

```text
WS /ws/traffic
```

Instead of repeatedly polling the REST API, a client can maintain a WebSocket connection and continuously receive simulation updates.

### Data Flow

```text
SUMO
  ↓
TraCI
  ↓
SimulationService
  ↓
SimulationController
  ↓
WebSocket
  ↓
Client
```

This is useful for the live traffic dashboard.

---

# 16. WebSocket Message Structure

A WebSocket update follows the `SimulationUpdate` structure.

```json
{
  "type": "simulation_update",
  "timestamp": 12.4,
  "vehicles": [
    {
      "id": "vehicle_1",
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
      "co2": 2058.85
    }
  ],
  "metrics": {
    "total_co2": 2058.85,
    "average_wait_time": 0.0,
    "vehicle_count": 1
  }
}
```

---

# 17. Vehicle Data

The backend collects vehicle-level information from SUMO.

Each vehicle can contain:

```text
id
x
y
speed
waiting_time
```

### Meaning

| Field          | Description                    |
| -------------- | ------------------------------ |
| `id`           | Unique vehicle identifier      |
| `x`            | X-coordinate in the simulation |
| `y`            | Y-coordinate in the simulation |
| `speed`        | Current vehicle speed          |
| `waiting_time` | Vehicle waiting time           |

---

# 18. Traffic-Light Data

The backend collects traffic-light information from SUMO.

Each traffic light provides:

```text
id
state
phase
```

Example:

```json
{
  "id": "A1",
  "state": "GGggrrrrGGGg",
  "phase": 0
}
```

The backend can also retrieve the incoming lanes controlled by each traffic light.

---

# 19. CO₂ Emission Data

The backend collects CO₂ emissions directly from SUMO using TraCI.

Emission data is associated with vehicle positions:

```text
x
y
co2
```

The backend also calculates total CO₂ emissions across the simulation.

Example:

```json
{
  "total_co2": 6456.956
}
```

---

# 20. Simulation Metrics

The backend provides simulation-level metrics including:

```text
total_co2
average_wait_time
vehicle_count
```

These metrics provide a high-level view of the current traffic simulation.

---

# 21. Lane-Level Metrics

The backend also provides detailed lane-level metrics for RL state generation.

For each lane:

```text
vehicle_count
queue
avg_speed
waiting_time
co2
```

Example:

```json
{
  "vehicle_count": 5,
  "queue": 2,
  "avg_speed": 3.2,
  "waiting_time": 18.5,
  "co2": 420.5
}
```

### Queue Definition

The current queue metric represents the number of vehicles travelling at or below:

```text
0.1 m/s
```

This provides an approximate count of stopped vehicles.

---

# 22. Pydantic Validation

Pydantic models are used to validate structured backend data.

The backend uses validation for:

* Simulation data
* RL state
* RL actions
* Lane metrics
* Traffic-light state

This ensures that data passed between backend components follows a defined structure.

---

# 23. RL Interface

The backend includes a direct Python interface for reinforcement-learning integration.

The interface is implemented in:

```text
rl_interface.py
```

It provides two main operations:

```python
get_state()
apply_action()
```

The interface communicates directly with `SimulationController`.

```text
RL Component
     ↕
RLInterface
     ↕
SimulationController
     ↕
SimulationService
     ↕
TraCI
     ↕
SUMO
```

The RL interface does not require an additional HTTP endpoint because it is implemented as a direct Python interface.

---

# 24. RL State

The backend provides a structured `RLState`.

The state contains:

```text
timestamp
traffic_lights
```

Each traffic light contains:

```text
phase
lanes
```

Each lane contains:

```text
vehicle_count
queue
avg_speed
waiting_time
co2
```

Example:

```json
{
  "timestamp": 12.4,
  "traffic_lights": {
    "A1": {
      "phase": 2,
      "lanes": {
        "lane_1": {
          "vehicle_count": 5,
          "queue": 2,
          "avg_speed": 3.2,
          "waiting_time": 18.5,
          "co2": 420.5
        }
      }
    }
  }
}
```

---

# 25. RL Action

The backend defines the following traffic-light action representation:

```text
0 → Keep current phase
1 → Switch to next phase
```

Example:

```json
{
  "actions": {
    "A1": 1,
    "B0": 0,
    "B1": 1,
    "B2": 0,
    "C1": 0
  }
}
```

The interface validates that every action is either `0` or `1`.

---

# 26. Multiple Traffic-Light Actions

The backend supports applying actions to multiple traffic lights in a single RL action object.

Example:

```text
A1 → Switch
B0 → Keep
B1 → Switch
B2 → Keep
C1 → Keep
```

This allows the RL interface to control multiple traffic-light controllers through a single structured action.

---

# 27. Dynamic Traffic-Light and Lane Discovery

The backend does not hard-code the lane structure for RL state generation.

Traffic-light IDs are discovered from SUMO:

```python
traci.trafficlight.getIDList()
```

Controlled lanes are obtained using:

```python
traci.trafficlight.getControlledLinks()
```

This allows the backend to construct lane-level state information from the active SUMO network.

Example traffic lights in the demo network:

```text
A1
B0
B1
B2
C1
```

---

# 28. Simulation Service

`SimulationService` isolates SUMO-specific operations from the API layer.

The service is responsible for:

```text
Start SUMO
    ↓
Connect through TraCI
    ↓
Advance simulation
    ↓
Collect simulation data
    ↓
Control traffic lights
    ↓
Provide data to controller
```

This separation keeps SUMO and TraCI logic out of the FastAPI route definitions.

---

# 29. Simulation Controller

`SimulationController` provides the application-level control layer.

Its responsibilities include:

* Calling simulation service methods
* Generating simulation snapshots
* Handling simulation controls
* Handling traffic-light actions
* Generating RL state
* Maintaining separation between API and simulation logic

Architecture:

```text
FastAPI
   ↓
SimulationController
   ↓
SimulationService
   ↓
TraCI
   ↓
SUMO
```

---

# 30. Error Handling

The backend validates important operations before executing them.

Examples include:

* Simulation not running
* Invalid traffic-light ID
* Invalid action value
* Invalid simulation control request

Example:

```text
Traffic light 'XYZ' not found.
```

The API converts backend validation errors into appropriate HTTP error responses.

---

# 31. CORS

The backend includes CORS configuration for local frontend development.

The React development server is allowed to communicate with the FastAPI backend.

Current development origin:

```text
http://localhost:5173
```

---

# 32. Backend Testing

The backend has been tested across multiple layers.

### API Testing

Verified:

* Health endpoint
* Simulation status
* Simulation state
* Pause
* Resume
* Manual simulation step
* Traffic-light actions
* Controller state
* Invalid actions
* Unknown traffic-light IDs

### WebSocket Testing

Verified:

* WebSocket connection
* Continuous simulation updates
* Vehicle data
* Traffic-light data
* CO₂ data
* Simulation metrics
* Client connection/disconnection

Multiple WebSocket connections were also tested.

### RL Interface Testing

Verified:

* RL state generation
* Pydantic RL state validation
* Single traffic-light action
* Multiple traffic-light actions
* Keep-current-phase action
* Switch-to-next-phase action
* Invalid RL actions

---

# 33. Example Backend Data Flow

A typical simulation update follows this pipeline:

```text
SUMO advances simulation
        ↓
TraCI reads simulation data
        ↓
SimulationService collects:
    • Vehicles
    • Traffic lights
    • CO₂
    • Metrics
        ↓
SimulationController builds state
        ↓
FastAPI exposes the data
        ↓
 ┌───────────────┬────────────────┐
 ↓               ↓                ↓
REST          WebSocket       RLInterface
 ↓               ↓                ↓
Snapshot     Live updates     RL State
                              / Action
```

---

# 34. Backend Development Status

## Backend Development — Completed

The backend development scope for the current project stage has been completed.

The completed backend includes:

* [x] FastAPI backend
* [x] SUMO/TraCI integration
* [x] `SimulationService`
* [x] `SimulationController`
* [x] Simulation lifecycle controls
* [x] Pause/resume functionality
* [x] Manual simulation stepping
* [x] Vehicle data collection
* [x] Traffic-light data collection
* [x] Traffic-light phase control
* [x] CO₂ emission collection
* [x] Simulation metrics
* [x] Lane-level traffic metrics
* [x] Pydantic data validation
* [x] REST API layer
* [x] WebSocket live streaming
* [x] Multiple WebSocket client testing
* [x] Traffic-light action validation
* [x] Error handling
* [x] RL state representation
* [x] RL action representation
* [x] Direct Python `RLInterface`
* [x] Multi-traffic-light action handling
* [x] RL state/action validation
* [x] Backend integration testing

### Final Backend Architecture

```text
                         SUMO
                           ↕
                         TraCI
                           ↕
                  SimulationService
                           ↕
                 SimulationController
                           ↕
                      FastAPI
                    /     |      \
                   /      |       \
                  ↓       ↓        ↓
               REST   WebSocket  RLInterface
                 ↓       ↓        ↓
             Control  Live Data  RL State/Action
```

The backend provides the complete simulation communication and control layer required by the EcoTwin application.

---

# 35. Backend Completion Statement

The EcoTwin backend has been implemented as a complete real-time simulation API layer.

It provides:

```text
Real SUMO Simulation
        ↓
      TraCI
        ↓
SimulationService
        ↓
SimulationController
        ↓
     FastAPI
   ┌────┼─────┐
   ↓    ↓     ↓
 REST  WebSocket  RLInterface
   ↓    ↓     ↓
Control Live     State/
       Updates   Actions
```

The backend has been verified through simulation, API, WebSocket, traffic-light control, validation, and RL-interface testing.

**Backend development is complete for the current project stage.**

# EcoTwin Backend API

Backend communication layer for the EcoTwin traffic simulation system.

The backend is built with **FastAPI** and provides REST APIs and WebSocket communication for exchanging simulation data between the simulation/RL components and the React dashboard.

---

## 1. Current Architecture

```text
             Mock SUMO Data
                    │
                    ↓
              FastAPI Backend
               /          \
              /            \
             ↓              ↓
      REST API          WebSocket
         │                  │
         ↓                  ↓
  Current Snapshot     Live Updates
                            │
                            ↓
                       React Dashboard
```

The current implementation uses mock SUMO data for development.

The planned production architecture is:

```text
              SUMO
                ↕
             TraCI
                ↕
          FastAPI Backend
           ↙           ↘
         RL             React
      Algorithm       Dashboard
```

The backend will act as the communication layer between the simulation, RL system, and frontend.

---

## 2. Technology Stack

* Python 3.11
* FastAPI
* Uvicorn
* Pydantic
* WebSockets
* CORS
* Mock SUMO data for development

---

## 3. Project Setup

Create and activate the Conda environment:

```bash
conda activate ecotwin-api
```

Start the FastAPI development server:

```bash
uvicorn main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

Interactive API documentation is available at:

```text
http://127.0.0.1:8000/docs
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

Returns one snapshot of the current simulation state.

Example structure:

```json
{
  "type": "simulation_update",
  "timestamp": 0.0,
  "vehicles": [
    {
      "id": "veh_1",
      "x": 10.0,
      "y": 20.0,
      "speed": 12.5,
      "waiting_time": 3.0
    }
  ],
  "traffic_lights": [
    {
      "id": "tl_1",
      "state": "G",
      "phase": 1
    }
  ],
  "emissions": [
    {
      "x": 10.0,
      "y": 20.0,
      "co2": 15.5
    }
  ],
  "metrics": {
    "total_co2": 15.5,
    "average_wait_time": 3.0,
    "vehicle_count": 1
  }
}
```

This endpoint provides a **single snapshot**, unlike the WebSocket which continuously sends updates.

---

## 5. WebSocket

### 5.1 Traffic WebSocket

```text
WS /ws/traffic
```

The WebSocket provides continuous simulation updates.

After a client connects, the backend sends structured JSON data approximately every second.

```text
Client
   │
   │ WebSocket connection
   ↓
FastAPI
   │
   ├── Update 1
   ├── Update 2
   ├── Update 3
   ├── Update 4
   └── ...
```

The current WebSocket uses mock simulation data.

The endpoint is currently named:

```text
/ws/traffic
```

---

## 6. Data Models

### Vehicle

Represents a vehicle in the simulation.

| Field          | Type   | Description          |
| -------------- | ------ | -------------------- |
| `id`           | string | Unique vehicle ID    |
| `x`            | float  | X coordinate         |
| `y`            | float  | Y coordinate         |
| `speed`        | float  | Vehicle speed        |
| `waiting_time` | float  | Vehicle waiting time |

### TrafficLight

Represents a traffic signal.

| Field   | Type    | Description          |
| ------- | ------- | -------------------- |
| `id`    | string  | Traffic-light ID     |
| `state` | string  | Current signal state |
| `phase` | integer | Current signal phase |

### Emission

Represents emission information.

| Field | Type  | Description        |
| ----- | ----- | ------------------ |
| `x`   | float | X coordinate       |
| `y`   | float | Y coordinate       |
| `co2` | float | CO₂ emission value |

### Metrics

Contains overall simulation metrics.

| Field               | Type    | Description                  |
| ------------------- | ------- | ---------------------------- |
| `total_co2`         | float   | Total CO₂ value              |
| `average_wait_time` | float   | Average vehicle waiting time |
| `vehicle_count`     | integer | Number of vehicles           |

---

## 7. CORS

CORS is configured to allow frontend applications to communicate with the FastAPI backend during development.

Current development configuration allows requests from any origin:

```python
allow_origins=["*"]
```

For production, this should be restricted to the actual frontend origin.

---

## 8. Current Development Flow

At the current stage, SUMO is represented by mock data:

```text
mock_sumo.py
      ↓
generate_simulation_data()
      ↓
FastAPI
      ↓
┌───────────────┬────────────────┐
│               │                │
REST API     WebSocket           │
│               │                │
↓               ↓                │
Snapshot     Live data           │
                │                │
                ↓                │
          React Dashboard
```

The mock data allows frontend development to continue before real SUMO integration is completed.

The mock data will later be replaced by real SUMO/TraCI data.

---

## 9. Planned Integration

The planned architecture will connect the backend with the real SUMO simulation and RL system.

```text
                    ┌─────────┐
                    │  SUMO   │
                    └────┬────┘
                         ↕
                       TraCI
                         ↕
                  ┌─────────────┐
                  │   FastAPI   │
                  │   Backend   │
                  └──────┬──────┘
                         ↕
                        RL
                         │
                      Actions
                         │
                         ↓
                       SUMO

FastAPI
   │
   └──────────────→ React Dashboard
```

The expected interaction is:

1. SUMO generates the current traffic state.
2. Backend collects/exposes the simulation state.
3. RL receives the relevant state.
4. RL decides an action, such as a traffic-light change.
5. Backend communicates the action to the simulation.
6. SUMO applies the action.
7. SUMO generates a new state.
8. Backend sends updated information to the React dashboard.
9. The process continues continuously.

---

## 10. Development Status

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

### Next Stage

* [ ] Real SUMO integration
* [ ] TraCI data collection
* [ ] SUMO ↔ Backend communication
* [ ] Backend ↔ RL communication
* [ ] RL action handling
* [ ] Replace mock data with real simulation data
* [ ] Full end-to-end testing with React

---

## 11. Important Note

The current backend uses **mock simulation data**.

Therefore, the current system proves the communication and data pipeline:

```text
Mock SUMO → FastAPI → React
```

It does **not yet represent the final real-time SUMO + RL environment**.

Real SUMO/TraCI and RL integration will be implemented in the next stage.

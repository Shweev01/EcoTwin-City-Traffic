import asyncio
import traci

from fastapi import FastAPI, WebSocket
from pydantic import BaseModel
from simulation_service import SimulationService
from fastapi.middleware.cors import CORSMiddleware

app= FastAPI()
app.add_middleware(
    CORSMiddleware, 
    allow_origins=["http://localhost:5173"], 
    allow_methods=["*"], 
    allow_headers=["*"]
)

@app.get("/health")
def health():
    return {"status": "ok"}

class Vehicle(BaseModel):
    id: str
    x: float
    y: float
    speed: float
    waiting_time: float

class TrafficLight(BaseModel):
    id: str
    state: str
    phase: int

class Emission(BaseModel):
    x: float
    y: float
    co2: float

class Metrics(BaseModel):
    total_co2: float
    average_wait_time: float
    vehicle_count: int

class SimulationUpdate(BaseModel):
    type: str
    timestamp: float
    vehicles: list[Vehicle]
    traffic_lights: list[TrafficLight]
    emissions: list[Emission]
    metrics: Metrics

@app.get("/api/simulation/state", response_model=SimulationUpdate)
def get_simulation_state():
    simulation_service = SimulationService()
    simulation_service.start()

    try:
        traci.simulationStep()
        vehicles = simulation_service.get_vehicles()

        data = {
            "type": "simulation_update",
            "timestamp": 0.0,
            "vehicles": vehicles,
            "traffic_lights": [],
            "emissions": [],
            "metrics": {
                "total_co2": 0.0,
                "average_wait_time": 0.0,
                "vehicle_count": len(vehicles)
            }
        }

        return SimulationUpdate(**data)

    finally:
        simulation_service.stop()

@app.websocket("/ws/traffic")
async def traffic_websocket(websocket: WebSocket):
    await websocket.accept()

    simulation_service = SimulationService()
    simulation_service.start()

    timestamp = 0.0

    try:
        while True:
            traci.simulationStep()
            vehicles = simulation_service.get_vehicles()

            data = {
                "type" : "simulation_update",
                "timestamp" : timestamp,
                "vehicles" : vehicles,
                "traffic_lights": [],
                "emissions": [],
                "metrics": {
                    "total_co2": 0.0,
                    "average_wait_time": 0.0,
                    "vehicle_count": len(vehicles)
                }
            }

            simulation_update = SimulationUpdate(**data)

            await websocket.send_json(simulation_update.model_dump())

            timestamp += 1.0

            await asyncio.sleep(1)

    finally:
        simulation_service.stop()

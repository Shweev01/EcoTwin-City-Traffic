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
        timestamp = traci.simulation.getTime()
        vehicles = simulation_service.get_vehicles()
        traffic_lights = simulation_service.get_traffic_lights()
        emissions = simulation_service.get_emissions()

        total_co2 = sum(emission["co2"] for emission in emissions)
        average_wait_time = sum(vehicle["waiting_time"] for vehicle in vehicles) / len(vehicles) if vehicles else 0.0

        data = {
            "type": "simulation_update",
            "timestamp": timestamp,
            "vehicles": vehicles,
            "traffic_lights": traffic_lights,
            "emissions": emissions,
            "metrics": {
                "total_co2": total_co2,
                "average_wait_time": average_wait_time,
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

    last_broadcast_time = 0.0
    broadcast_interval = 0.5
    next_step_time = asyncio.get_running_loop().time()

    try:
        while True:
            traci.simulationStep()

            current_time = traci.simulation.getTime()

            if current_time - last_broadcast_time >= broadcast_interval:
                last_broadcast_time = current_time

                vehicles = simulation_service.get_vehicles()
                traffic_lights = simulation_service.get_traffic_lights()
                emissions = simulation_service.get_emissions()

                total_co2 = sum(
                    emission["co2"] for emission in emissions
                )

                average_wait_time = (
                    sum(vehicle["waiting_time"] for vehicle in vehicles)
                    / len(vehicles)
                    if vehicles
                    else 0.0
                )

                data = {
                    "type": "simulation_update",
                    "timestamp": current_time,
                    "vehicles": vehicles,
                    "traffic_lights": traffic_lights,
                    "emissions": emissions,
                    "metrics": {
                        "total_co2": total_co2,
                        "average_wait_time": average_wait_time,
                        "vehicle_count": len(vehicles)
                    }
                }

                simulation_update = SimulationUpdate(**data)

                await websocket.send_json(
                    simulation_update.model_dump()
                )

            next_step_time += 0.2

            sleep_time = next_step_time - asyncio.get_running_loop().time()

            if sleep_time > 0:
                await asyncio.sleep(sleep_time)

    finally:
        simulation_service.stop()

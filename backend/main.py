import asyncio

from fastapi import FastAPI, WebSocket
from pydantic import BaseModel
from mock_sumo import generate_simulation_data

app= FastAPI()

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

@app.websocket("/ws/traffic")
async def traffic_websocket(websocket: WebSocket):
    await websocket.accept()

    timestamp = 0.0

    while True:
        data = generate_simulation_data(timestamp)

        simulation_update = SimulationUpdate(**data)

        await websocket.send_json(simulation_update.model_dump())

        timestamp += 1.0

        await asyncio.sleep(1)
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from simulation_service import SimulationService


simulation_service = SimulationService()

connected_clients = set()
latest_update = None
simulation_lock = asyncio.Lock()


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


def build_simulation_update() -> SimulationUpdate:

    timestamp = simulation_service.get_time()

    vehicles = simulation_service.get_vehicles()
    traffic_lights = simulation_service.get_traffic_lights()
    emissions = simulation_service.get_emissions()

    total_co2 = sum(
        emission["co2"]
        for emission in emissions
    )

    average_wait_time = (
        sum(vehicle["waiting_time"] for vehicle in vehicles)
        / len(vehicles)
        if vehicles
        else 0.0
    )

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

async def simulation_loop():

    global latest_update

    next_step_time = asyncio.get_running_loop().time()

    while True:

        async with simulation_lock:

            simulation_service.step()

            latest_update = build_simulation_update()

            clients = list(connected_clients)

        disconnected_clients = []

        for websocket in clients:

            try:
                await websocket.send_json(
                    latest_update.model_dump()
                )

            except Exception:
                disconnected_clients.append(websocket)

        for websocket in disconnected_clients:
            connected_clients.discard(websocket)

        next_step_time += 0.1

        sleep_time = (
            next_step_time
            - asyncio.get_running_loop().time()
        )

        if sleep_time > 0:
            await asyncio.sleep(sleep_time)
        else:
            await asyncio.sleep(0)

@asynccontextmanager
async def lifespan(app: FastAPI):

    global latest_update

    simulation_service.start()

    async with simulation_lock:
        latest_update = build_simulation_update()

    simulation_task = asyncio.create_task(
        simulation_loop()
    )

    try:
        yield

    finally:

        simulation_task.cancel()

        try:
            await simulation_task
        except asyncio.CancelledError:
            pass

        simulation_service.stop()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get(
    "/api/simulation/state",
    response_model=SimulationUpdate
)
async def get_simulation_state():

    async with simulation_lock:

        if latest_update is None:
            return build_simulation_update()

        return latest_update


@app.websocket("/ws/traffic")
async def traffic_websocket(websocket: WebSocket):

    await websocket.accept()

    connected_clients.add(websocket)

    try:

        if latest_update is not None:
            await websocket.send_json(
                latest_update.model_dump()
            )

        while True:

            message = await websocket.receive()

            if message["type"] == "websocket.disconnect":
                break

    except Exception as e:
        print(f"WebSocket connection closed: {e}")

    finally:
        connected_clients.discard(websocket)
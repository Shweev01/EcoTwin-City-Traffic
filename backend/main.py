"""FastAPI bridge: PPO/static controller -> SUMO/TraCI -> WebSocket dashboard."""
from __future__ import annotations

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from rl_agent.environment import DEFAULT_CONFIG, EcoTwinSumoEnv
from rl_agent.numpy_policy import NumpyPPOPolicy

ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = Path(os.environ.get("ECOTWIN_MODEL_PATH", ROOT / "rl_agent" / "models" / "ppo_ecotwin_actor.npz"))
LOG = logging.getLogger("ecotwin.backend")


class ModeRequest(BaseModel):
    mode: str = Field(pattern="^(baseline|ppo)$")


class SimulationRuntime:
    """Own one TraCI environment; all TraCI calls run on a dedicated thread."""

    def __init__(self) -> None:
        self.env: EcoTwinSumoEnv | None = None
        self.model: NumpyPPOPolicy | None = None
        self.mode = "baseline"
        self.paused = False
        self.running = False
        self.error: str | None = None
        self.latest: dict[str, Any] | None = None
        self.clients: set[WebSocket] = set()
        self.task: asyncio.Task | None = None
        self.executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="ecotwin-sumo")
        self.loop: asyncio.AbstractEventLoop | None = None
        self.observation = None
        self._step_once = False
        self._last_action = [0] * 5
        self._real_time_delay = max(0.0, float(os.environ.get("ECOTWIN_REALTIME_DELAY", "0.25")))
        self._seed = int(os.environ.get("ECOTWIN_SEED", "7"))

    async def _in_sumo_thread(self, fn, *args, **kwargs):
        assert self.loop is not None
        return await self.loop.run_in_executor(self.executor, partial(fn, *args, **kwargs))

    async def start(self) -> None:
        self.loop = asyncio.get_running_loop()
        self.env = EcoTwinSumoEnv(
            config_path=Path(os.environ.get("ECOTWIN_SUMO_CONFIG", DEFAULT_CONFIG)),
            sumo_binary=os.environ.get("SUMO_BINARY", "sumo"),
            decision_interval=float(os.environ.get("ECOTWIN_DECISION_INTERVAL", "5")),
            seed=self._seed,
        )
        if MODEL_PATH.is_file():
            self.model = NumpyPPOPolicy(MODEL_PATH)
            self.mode = "ppo"
            LOG.info("Loaded PPO model: %s", MODEL_PATH)
        else:
            if _public_read_only():
                raise FileNotFoundError(f"Required PPO actor artifact is missing: {MODEL_PATH}")
            self.mode = "baseline"
            LOG.warning("PPO model missing at %s; serving static SUMO signal control", MODEL_PATH)
        self.observation, initial_info = await self._in_sumo_thread(self.env.reset, seed=self._seed)
        initial_arrays = await self._in_sumo_thread(self.env.dashboard_snapshot)
        self.running = True
        self.latest = self._make_payload(initial_info, initial_arrays)
        self.task = asyncio.create_task(self._run_loop(), name="ecotwin-simulation-loop")

    async def stop(self) -> None:
        self.running = False
        if self.task is not None:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        if self.env is not None:
            await self._in_sumo_thread(self.env.close)
        self.executor.shutdown(wait=False, cancel_futures=True)

    def _make_payload(
        self, info: dict[str, Any], arrays: dict[str, Any], action: list[int] | None = None
    ) -> dict[str, Any]:
        assert self.env is not None
        metrics = info.get("metrics", {})
        return {
            "type": "simulation_update",
            "timestamp": float(metrics.get("simulation_time", 0.0)),
            "vehicles": arrays["vehicles"],
            "traffic_lights": arrays["traffic_lights"],
            "emissions": arrays["emissions"],
            "metrics": {
                "total_co2": float(metrics.get("total_co2", 0.0)),
                "cumulative_co2_mg": float(metrics.get("cumulative_co2_mg", 0.0)),
                "average_wait_time": float(metrics.get("average_wait_time", 0.0)),
                "average_queue": float(metrics.get("average_queue", 0.0)),
                "vehicle_count": int(metrics.get("vehicle_count", 0)),
                "throughput": int(metrics.get("throughput", 0)),
                "interval_throughput": int(metrics.get("interval_throughput", 0)),
                "episode_reward": float(metrics.get("episode_reward", 0.0)),
            },
            "controller": {
                "mode": self.mode,
                "model_loaded": self.model is not None,
                "controlled_lights": list(self.env.controlled_lights),
                "action": action if action is not None else [0] * 5,
                "actions_applied": info.get("actions_applied", [0] * 5),
                "phase_changes": info.get("phase_changes", []),
                "reward": float(info.get("last_reward", 0.0)),
            },
            "simulation": {"running": self.running, "paused": self.paused},
        }

    async def _broadcast(self, payload: dict[str, Any]) -> None:
        self.latest = payload
        dead: list[WebSocket] = []
        for client in tuple(self.clients):
            try:
                await client.send_json(payload)
            except Exception:
                dead.append(client)
        for client in dead:
            self.clients.discard(client)

    async def _run_loop(self) -> None:
        assert self.env is not None
        while self.running:
            if self.paused and not self._step_once:
                await asyncio.sleep(0.05)
                continue
            try:
                if self.mode == "ppo" and self.model is not None:
                    if self.observation is None:
                        raise RuntimeError("PPO observation is not initialized")
                    action = [int(value) for value in self.model.predict(self.observation)]
                else:
                    action = [0] * 5
                self._last_action = action
                self.observation, reward, terminated, truncated, info = await self._in_sumo_thread(self.env.step, action)
                info["last_reward"] = float(reward)
                arrays = await self._in_sumo_thread(self.env.dashboard_snapshot)
                await self._broadcast(self._make_payload(info, arrays, action))
                if self._step_once:
                    self._step_once = False
                    self.paused = True
                if terminated or truncated:
                    await asyncio.sleep(0.4)
                    self.observation, reset_info = await self._in_sumo_thread(self.env.reset, seed=self._seed)
                    arrays = await self._in_sumo_thread(self.env.dashboard_snapshot)
                    await self._broadcast(self._make_payload(reset_info, arrays))
                if self._real_time_delay:
                    await asyncio.sleep(self._real_time_delay)
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                self.error = str(exc)
                self.paused = True
                LOG.exception("SUMO simulation loop failed")
                await asyncio.sleep(0.5)


runtime = SimulationRuntime()


def _public_read_only() -> bool:
    return os.environ.get("ECOTWIN_READ_ONLY", "false").strip().lower() in {"1", "true", "yes"}


def _require_control_access() -> None:
    if _public_read_only():
        raise HTTPException(status_code=403, detail="This public EcoTwin simulation is read-only")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await runtime.start()
    try:
        yield
    finally:
        await runtime.stop()


app = FastAPI(title="EcoTwin SUMO + RL API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173", "http://127.0.0.1:5174", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"ok": runtime.running, "mode": runtime.mode, "model_loaded": runtime.model is not None, "error": runtime.error}


@app.get("/_app/health")
async def deployment_health():
    if not runtime.running or runtime.model is None or runtime.mode != "ppo":
        raise HTTPException(status_code=503, detail=runtime.error or "PPO simulation is not ready")
    return {"ok": True, "mode": runtime.mode, "model_loaded": True}


@app.get("/api/simulation/status")
async def simulation_status():
    return {
        "running": runtime.running,
        "paused": runtime.paused,
        "mode": runtime.mode,
        "model_loaded": runtime.model is not None,
        "time": runtime.latest.get("timestamp", 0.0) if runtime.latest else 0.0,
        "error": runtime.error,
    }


@app.post("/api/simulation/pause")
async def pause_simulation():
    _require_control_access()
    runtime.paused = True
    return {"ok": True, "paused": True}


@app.post("/api/simulation/resume")
async def resume_simulation():
    _require_control_access()
    runtime.paused = False
    runtime._step_once = False
    return {"ok": True, "paused": False}


@app.post("/api/simulation/step")
async def step_simulation():
    _require_control_access()
    if not runtime.running:
        raise HTTPException(status_code=409, detail="Simulation is not running")
    runtime.paused = True
    runtime._step_once = True
    return {"ok": True, "message": "One RL decision interval requested"}


@app.post("/api/simulation/mode")
async def set_mode(request: ModeRequest):
    _require_control_access()
    if request.mode == "ppo" and runtime.model is None:
        raise HTTPException(status_code=409, detail=f"Trained PPO model is not available at {MODEL_PATH}")
    runtime.mode = request.mode
    return {"ok": True, "mode": runtime.mode, "model_loaded": runtime.model is not None}


@app.websocket("/ws/traffic")
async def traffic_updates(websocket: WebSocket):
    await websocket.accept()
    runtime.clients.add(websocket)
    if runtime.latest is not None:
        await websocket.send_json(runtime.latest)
    try:
        while True:
            # Keep the connection alive; this endpoint is a server-to-client stream.
            await websocket.receive_text()
    except WebSocketDisconnect:
        runtime.clients.discard(websocket)
    except Exception:
        runtime.clients.discard(websocket)

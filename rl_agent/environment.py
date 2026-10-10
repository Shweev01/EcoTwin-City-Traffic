"""Gymnasium environment controlling EcoTwin's existing SUMO scenario."""
from __future__ import annotations

import os
import shutil
import uuid
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

import gymnasium as gym
import numpy as np
from gymnasium import spaces

from .reward import calculate_reward

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = ROOT / "simulation" / "demo.sumocfg.xml"
CONTROLLED_LIGHTS = ("A1", "B0", "B1", "B2", "C1")


class EcoTwinSumoEnv(gym.Env):
    """A multi-intersection, binary-action traffic signal environment.

    Action 0 keeps a signal's current phase; action 1 requests the next phase
    in that signal's active SUMO program. A request during a yellow or all-red
    phase is ignored. The existing SUMO program therefore executes the full
    clearance phase and owns the actual signal states and timings.
    """

    metadata = {"render_modes": []}

    def __init__(
        self,
        config_path: str | Path = DEFAULT_CONFIG,
        sumo_binary: str | None = None,
        decision_interval: float = 5.0,
        max_episode_seconds: float | None = None,
        seed: int | None = None,
        controlled_lights: tuple[str, ...] = CONTROLLED_LIGHTS,
        start_args: list[str] | None = None,
    ) -> None:
        super().__init__()
        self.config_path = Path(config_path).resolve()
        if not self.config_path.is_file():
            raise FileNotFoundError(f"SUMO config not found: {self.config_path}")
        if len(controlled_lights) != 5:
            raise ValueError("EcoTwin expects exactly five controlled traffic lights")
        self.controlled_lights = tuple(controlled_lights)
        self.sumo_binary = sumo_binary or os.environ.get("SUMO_BINARY", "sumo")
        if shutil.which(self.sumo_binary) is None and not Path(self.sumo_binary).is_file():
            raise FileNotFoundError(
                f"SUMO binary {self.sumo_binary!r} was not found; install SUMO or set SUMO_BINARY"
            )
        self.decision_interval = float(decision_interval)
        if self.decision_interval <= 0:
            raise ValueError("decision_interval must be positive")
        self.start_args = list(start_args or [])
        self.seed_value = seed

        cfg_root = ET.parse(self.config_path).getroot()
        time_node = cfg_root.find("time")
        step_node = time_node.find("step-length") if time_node is not None else None
        end_node = time_node.find("end") if time_node is not None else None
        self.simulation_step = float(step_node.get("value", "1.0")) if step_node is not None else 1.0
        configured_end = float(end_node.get("value", "300")) if end_node is not None else 300.0
        self.max_episode_seconds = float(max_episode_seconds or configured_end)
        self._steps_per_decision = max(1, int(round(self.decision_interval / self.simulation_step)))
        self._max_decisions = max(1, int(np.ceil(self.max_episode_seconds / self.decision_interval)))

        self.action_space = spaces.MultiDiscrete(np.full(5, 2, dtype=np.int64))
        # Per controlled light: phase, queue, mean speed, waiting, CO2.
        self.observation_space = spaces.Box(0.0, 1.0, shape=(25,), dtype=np.float32)

        self._conn: Any = None
        self._label = f"ecotwin_{uuid.uuid4().hex[:10]}"
        self._all_lights: tuple[str, ...] = ()
        self._lanes_by_light: dict[str, tuple[str, ...]] = {}
        self._phase_counts: dict[str, int] = {}
        self._phase_states: dict[str, tuple[str, ...]] = {}
        self._episode_decisions = 0
        self._episode_reward = 0.0
        self._arrived_total = 0
        self._previous_arrived_total = 0
        self._last_interval_throughput = 0
        self._cumulative_co2_mg = 0.0
        self._waiting_seconds: dict[str, float] = {}
        self._known_vehicles: set[str] = set()
        self._last_action_applied = [0] * 5
        self._last_phase_changes: list[str] = []
        self._done = False

    @property
    def connection(self) -> Any:
        if self._conn is None:
            raise RuntimeError("SUMO is not running; call reset() first")
        return self._conn

    def _start_sumo(self, seed: int | None) -> None:
        default_sumo_home = Path("/usr/share/sumo")
        if "SUMO_HOME" not in os.environ and (default_sumo_home / "tools").is_dir():
            os.environ["SUMO_HOME"] = str(default_sumo_home)
        import traci

        command = [
            self.sumo_binary, "-c", str(self.config_path),
            "--no-step-log", "true", "--duration-log.disable", "true",
        ]
        if seed is not None:
            command.extend(["--seed", str(int(seed))])
        command.extend(self.start_args)
        traci.start(command, label=self._label, doSwitch=True)
        self._conn = traci.getConnection(self._label)

        ids = tuple(self._conn.trafficlight.getIDList())
        missing = [light for light in self.controlled_lights if light not in ids]
        if missing:
            self.close()
            raise RuntimeError(f"Controlled lights absent from SUMO: {missing}")
        self._all_lights = ids
        for light in ids:
            self._lanes_by_light[light] = tuple(
                dict.fromkeys(self._conn.trafficlight.getControlledLanes(light))
            )
            active_program = self._conn.trafficlight.getProgram(light)
            logics = self._conn.trafficlight.getAllProgramLogics(light)
            logic = next((item for item in logics if item.programID == active_program), logics[0] if logics else None)
            states = tuple(phase.state for phase in logic.phases) if logic else ()
            self._phase_states[light] = states
            self._phase_counts[light] = max(1, len(states))

    def _close_connection(self) -> None:
        if self._conn is not None:
            try:
                self._conn.close()
            except Exception:
                pass
            self._conn = None

    def close(self) -> None:
        self._close_connection()

    def reset(self, *, seed: int | None = None, options: dict[str, Any] | None = None):
        super().reset(seed=seed)
        self._close_connection()
        self._episode_decisions = 0
        self._episode_reward = 0.0
        self._arrived_total = 0
        self._previous_arrived_total = 0
        self._last_interval_throughput = 0
        self._cumulative_co2_mg = 0.0
        self._waiting_seconds = {}
        self._known_vehicles = set()
        self._last_action_applied = [0] * 5
        self._last_phase_changes = []
        self._done = False
        chosen_seed = seed if seed is not None else self.seed_value
        self._start_sumo(chosen_seed)
        self._collect_vehicle_totals(0.0)
        return self._observation(), self._info(0.0, {})

    @staticmethod
    def _is_transition(state: str) -> bool:
        lowered = state.lower()
        return "y" in lowered or "g" not in lowered

    def _apply_actions(self, action: np.ndarray) -> tuple[list[int], list[str]]:
        values = np.asarray(action, dtype=np.int64).reshape(-1)
        if values.shape != (5,) or np.any((values < 0) | (values > 1)):
            raise ValueError("Action must contain five binary values (0=keep, 1=request next phase)")
        applied = [0] * 5
        changed: list[str] = []
        for index, light in enumerate(self.controlled_lights):
            if values[index] != 1:
                continue
            current = int(self.connection.trafficlight.getPhase(light))
            states = self._phase_states.get(light, ())
            state = states[current] if current < len(states) else self.connection.trafficlight.getRedYellowGreenState(light)
            # Keep the preconfigured yellow/all-red clearance intact.
            if self._is_transition(state):
                continue
            next_phase = (current + 1) % self._phase_counts[light]
            self.connection.trafficlight.setPhase(light, next_phase)
            applied[index] = 1
            changed.append(light)
        return applied, changed

    def _collect_vehicle_totals(self, elapsed: float) -> tuple[float, float]:
        conn = self.connection
        active_ids = tuple(conn.vehicle.getIDList())
        self._known_vehicles.update(active_ids)
        self._known_vehicles.update(conn.simulation.getDepartedIDList())
        rate = 0.0
        for vehicle_id in active_ids:
            try:
                speed = float(conn.vehicle.getSpeed(vehicle_id))
                emission = max(0.0, float(conn.vehicle.getCO2Emission(vehicle_id)))
            except Exception:
                continue
            if speed <= 0.1:
                self._waiting_seconds[vehicle_id] = self._waiting_seconds.get(vehicle_id, 0.0) + elapsed
            rate += emission
            self._cumulative_co2_mg += emission * elapsed
        # TraCI reports arrivals for the latest SUMO step, not the episode total.
        self._arrived_total += int(conn.simulation.getArrivedNumber())
        average_wait = sum(self._waiting_seconds.values()) / max(len(self._known_vehicles), 1)
        return rate, average_wait

    def _junction_observation(self, light: str) -> tuple[float, float, float, float, float]:
        conn = self.connection
        phase = int(conn.trafficlight.getPhase(light))
        phase_norm = phase / max(self._phase_counts.get(light, 1) - 1, 1)
        vehicle_ids: set[str] = set()
        queue = 0
        for lane in self._lanes_by_light.get(light, ()):
            try:
                queue += int(conn.lane.getLastStepHaltingNumber(lane))
                vehicle_ids.update(conn.lane.getLastStepVehicleIDs(lane))
            except Exception:
                continue
        speeds: list[float] = []
        waits: list[float] = []
        co2_rate = 0.0
        for vehicle_id in vehicle_ids:
            try:
                speeds.append(float(conn.vehicle.getSpeed(vehicle_id)))
                waits.append(float(self._waiting_seconds.get(vehicle_id, 0.0)))
                co2_rate += max(0.0, float(conn.vehicle.getCO2Emission(vehicle_id)))
            except Exception:
                continue
        return (
            float(np.clip(phase_norm, 0.0, 1.0)),
            float(np.clip(queue / 20.0, 0.0, 1.0)),
            float(np.clip((float(np.mean(speeds)) if speeds else 0.0) / 15.0, 0.0, 1.0)),
            float(np.clip((float(np.mean(waits)) if waits else 0.0) / 120.0, 0.0, 1.0)),
            float(np.clip(co2_rate / 5000.0, 0.0, 1.0)),
        )

    def _observation(self) -> np.ndarray:
        features = [value for light in self.controlled_lights for value in self._junction_observation(light)]
        return np.asarray(features, dtype=np.float32)

    def _metrics(self) -> dict[str, float | int]:
        conn = self.connection
        active_ids = tuple(conn.vehicle.getIDList())
        co2_rate = 0.0
        for vehicle_id in active_ids:
            try:
                co2_rate += max(0.0, float(conn.vehicle.getCO2Emission(vehicle_id)))
            except Exception:
                pass
        average_wait = sum(self._waiting_seconds.values()) / max(len(self._known_vehicles), 1)
        lanes = tuple(dict.fromkeys(lane for light in self.controlled_lights for lane in self._lanes_by_light.get(light, ())))
        total_queue = sum(int(conn.lane.getLastStepHaltingNumber(lane)) for lane in lanes)
        return {
            "total_co2": float(co2_rate),
            "cumulative_co2_mg": float(self._cumulative_co2_mg),
            "average_wait_time": float(average_wait),
            "average_queue": float(total_queue / max(len(lanes), 1)),
            "vehicle_count": len(active_ids),
            "throughput": int(self._arrived_total),
            "interval_throughput": int(self._last_interval_throughput),
            "simulation_time": float(conn.simulation.getTime()),
            "episode_reward": float(self._episode_reward),
        }

    def dashboard_snapshot(self) -> dict[str, Any]:
        """Return live arrays using the frontend's existing WebSocket schema."""
        conn = self.connection
        vehicles: list[dict[str, Any]] = []
        emissions: list[dict[str, Any]] = []
        for vehicle_id in conn.vehicle.getIDList():
            try:
                x, y = conn.vehicle.getPosition(vehicle_id)
                # The dashboard uses an abstract local map; its row/column
                # orientation matches SUMO's junction x/y grid plus a 20-unit margin.
                map_x, map_y = float(x) + 20.0, float(y) + 20.0
                speed = float(conn.vehicle.getSpeed(vehicle_id))
                co2 = max(0.0, float(conn.vehicle.getCO2Emission(vehicle_id)))
                vehicles.append({
                    "id": vehicle_id, "latitude": map_x, "longitude": map_y,
                    "speed": speed, "waiting_time": float(self._waiting_seconds.get(vehicle_id, 0.0)),
                    "co2": co2, "type": conn.vehicle.getTypeID(vehicle_id),
                })
                emissions.append({"id": vehicle_id, "latitude": map_x, "longitude": map_y, "co2": co2})
            except Exception:
                continue
        traffic_lights: list[dict[str, Any]] = []
        for light in self._all_lights:
            try:
                phase = int(conn.trafficlight.getPhase(light))
                x, y = conn.junction.getPosition(light)
                traffic_lights.append({
                    "id": light, "latitude": float(x) + 20.0, "longitude": float(y) + 20.0,
                    "state": conn.trafficlight.getRedYellowGreenState(light), "phase": phase,
                    "controlled": light in self.controlled_lights,
                })
            except Exception:
                traffic_lights.append({
                    "id": light, "state": conn.trafficlight.getRedYellowGreenState(light),
                    "controlled": light in self.controlled_lights,
                })
        return {"vehicles": vehicles, "traffic_lights": traffic_lights, "emissions": emissions}

    def _info(self, reward: float, reward_parts: dict[str, float]) -> dict[str, Any]:
        return {
            "metrics": self._metrics(),
            "reward_components": reward_parts,
            "last_reward": float(reward),
            "actions_applied": list(self._last_action_applied),
            "phase_changes": list(self._last_phase_changes),
            "controlled_lights": list(self.controlled_lights),
        }

    def step(self, action: np.ndarray):
        if self._conn is None:
            raise RuntimeError("Call reset() before step()")
        if self._done:
            raise RuntimeError("Episode complete; call reset() before another step()")
        self._last_action_applied, self._last_phase_changes = self._apply_actions(action)
        self._episode_decisions += 1
        start_time = float(self.connection.simulation.getTime())
        actual_elapsed = 0.0
        interval_emissions_mg = 0.0
        for _ in range(self._steps_per_decision):
            try:
                self.connection.simulationStep()
                now = float(self.connection.simulation.getTime())
            except Exception as exc:
                raise RuntimeError(f"TraCI failed while advancing SUMO: {exc}") from exc
            delta = max(0.0, now - (start_time + actual_elapsed))
            actual_elapsed += delta
            rate, _ = self._collect_vehicle_totals(delta)
            interval_emissions_mg += rate * delta
            if now >= self.max_episode_seconds - 1e-9:
                break
        end_time = start_time + actual_elapsed
        self._last_interval_throughput = self._arrived_total - self._previous_arrived_total
        self._previous_arrived_total = self._arrived_total
        metrics = self._metrics()
        elapsed = max(actual_elapsed, self.simulation_step)
        reward, parts = calculate_reward(
            average_wait_time=float(metrics["average_wait_time"]),
            average_queue=float(metrics["average_queue"]),
            co2_mg_per_second=interval_emissions_mg / elapsed,
            throughput=self._last_interval_throughput,
            vehicle_count=int(metrics["vehicle_count"]),
        )
        self._episode_reward += reward
        self._done = end_time >= self.max_episode_seconds - 1e-9
        if not self._done:
            self._done = int(self.connection.simulation.getMinExpectedNumber()) == 0
        terminated = bool(self._done)
        truncated = self._episode_decisions >= self._max_decisions and not terminated
        if truncated:
            self._done = True
        return self._observation(), float(reward), terminated, bool(truncated), self._info(reward, parts)

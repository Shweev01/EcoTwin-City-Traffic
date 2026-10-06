from simulation_service import SimulationService
import traci


class SimulationController:
    def __init__(self, simulation_service: SimulationService):
        self.simulation_service = simulation_service
        self.paused = False

    def start(self):
        self.simulation_service.start()
        self.paused = False

    def pause(self):
        if not self.simulation_service.running:
            raise RuntimeError("Simulation is not running.")

        self.paused = True

    def resume(self):
        if not self.simulation_service.running:
            raise RuntimeError("Simulation is not running.")

        self.paused = False

    def step(self):
        if not self.simulation_service.running:
            raise RuntimeError("Simulation is not running.")

        if self.paused:
            return

        self.simulation_service.step()

    def step_once(self):
        if not self.simulation_service.running:
            raise RuntimeError("Simulation is not running.")

        self.simulation_service.step()

    def stop(self):
        self.simulation_service.stop()
        self.paused = False

    def get_status(self):
        return {
            "running": self.simulation_service.running,
            "paused": self.paused
        }

    def get_state(self):
        if not self.simulation_service.running:
            raise RuntimeError("Simulation is not running.")

        return {
            "timestamp": self.simulation_service.get_time(),
            "vehicles": self.simulation_service.get_vehicles(),
            "traffic_lights": self.simulation_service.get_traffic_lights(),
            "emissions": self.simulation_service.get_emissions()
        }

    def get_rl_state(self):
        if not self.simulation_service.running:
            raise RuntimeError("Simulation is not running.")

        timestamp = self.simulation_service.get_time()
        traffic_light_ids = self.simulation_service.get_traffic_light_ids()
        traffic_light_lanes = self.simulation_service.get_traffic_light_lanes()

        traffic_lights = {}

        for traffic_light_id in traffic_light_ids:
            phase = traci.trafficlight.getPhase(traffic_light_id)

            lanes = {}

            for lane_id in traffic_light_lanes.get(traffic_light_id, []):
                lanes[lane_id] = self.simulation_service.get_lane_metrics(lane_id)

            traffic_lights[traffic_light_id] = {
                "phase": phase,
                "lanes": lanes
            }

        return {
        "timestamp": timestamp,
        "traffic_lights": traffic_lights
        }

    def receive_action(self, traffic_light_id: str, action: int):
        if not self.simulation_service.running:
            raise RuntimeError("Simulation is not running.")

        if action < 0:
            raise ValueError("Action must be a non-negative integer.")

        traffic_light_ids = self.simulation_service.get_traffic_light_ids()

        if traffic_light_id not in traffic_light_ids:
            raise ValueError(
                f"Traffic light '{traffic_light_id}' not found."
            )

        self.simulation_service.set_traffic_light_phase(
            traffic_light_id,
            action
        )

        return {
            "traffic_light_id": traffic_light_id,
            "action": action
        }
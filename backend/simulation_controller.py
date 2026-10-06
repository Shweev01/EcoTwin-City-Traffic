from simulation_service import SimulationService


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

    def receive_action(self, traffic_light_id: str, action: int):
        if not self.simulation_service.running:
            raise RuntimeError("Simulation is not running.")

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
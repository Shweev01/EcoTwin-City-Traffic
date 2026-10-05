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
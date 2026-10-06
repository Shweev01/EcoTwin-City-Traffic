import os
import sys
import traci


class SimulationService:
    def __init__(self):
        if "SUMO_HOME" not in os.environ:
            raise RuntimeError("SUMO_HOME environment variable is not set.")

        sumo_tools = os.path.join(
            os.environ["SUMO_HOME"],
            "tools"
        )

        if sumo_tools not in sys.path:
            sys.path.append(sumo_tools)

        self.running = False

        self.config_file = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "..",
        "simulation",
        "demo.sumocfg.xml",
    )

    def start(self):
        if self.running:
            return

        if not os.path.exists(self.config_file):
            raise FileNotFoundError(
                f"SUMO configuration file not found: {self.config_file}"
            )

        traci.start([
            "sumo",
            "-c",
            self.config_file
        ])

        self.running = True

    def step(self):
        if not self.running:
            raise RuntimeError("Simulation is not running.")

        traci.simulationStep()

    def get_time(self):
        return traci.simulation.getTime()

    def get_vehicles(self):
        vehicles = []

        vehicle_ids = traci.vehicle.getIDList()

        for vehicle_id in vehicle_ids:
            x, y = traci.vehicle.getPosition(vehicle_id)
            speed = traci.vehicle.getSpeed(vehicle_id)
            waiting_time = traci.vehicle.getWaitingTime(vehicle_id)

            vehicles.append({
                "id": vehicle_id,
                "x": x,
                "y": y,
                "speed": speed,
                "waiting_time": waiting_time
            })

        return vehicles

    def get_traffic_lights(self):
        traffic_lights = []

        traffic_light_ids = traci.trafficlight.getIDList()

        for traffic_light_id in traffic_light_ids:
            state = traci.trafficlight.getRedYellowGreenState(
                traffic_light_id
            )
            phase = traci.trafficlight.getPhase(
                traffic_light_id
            )

            traffic_lights.append({
                "id": traffic_light_id,
                "state": state,
                "phase": phase
            })

        return traffic_lights

    def get_emissions(self):
        emissions = []

        vehicle_ids = traci.vehicle.getIDList()

        for vehicle_id in vehicle_ids:
            x, y = traci.vehicle.getPosition(vehicle_id)
            co2 = traci.vehicle.getCO2Emission(vehicle_id)

            emissions.append({
                "x": x,
                "y": y,
                "co2": co2
            })

        return emissions

    def stop(self):
        if not self.running:
            return

        traci.close()
        self.running = False

    def get_status(self):
        return {
            "running": self.running
        }

    def get_traffic_light_ids(self):
        return list(traci.trafficlight.getIDList())

    def get_traffic_light_lanes(self):
        traffic_light_lanes = {}

        traffic_light_ids = traci.trafficlight.getIDList()

        for traffic_light_id in traffic_light_ids:
            lanes = set()

            controlled_links = traci.trafficlight.getControlledLinks(
                traffic_light_id
            )

            for link_group in controlled_links:
                for link in link_group:
                    incoming_lane = link[0]
                    lanes.add(incoming_lane)

            traffic_light_lanes[traffic_light_id] = sorted(lanes)

        return traffic_light_lanes

    def get_lane_metrics(self, lane_id: str):
        vehicle_ids = traci.lane.getLastStepVehicleIDs(lane_id)

        if not vehicle_ids:
            return {
                "vehicle_count": 0,
                "queue": 0,
                "avg_speed": 0.0,
                "waiting_time": 0.0,
                "co2": 0.0
            }

        speeds = []
        waiting_times = []
        total_co2 = 0.0
        queue = 0

        for vehicle_id in vehicle_ids:
            speed = traci.vehicle.getSpeed(vehicle_id)
            waiting_time = traci.vehicle.getWaitingTime(vehicle_id)
            co2 = traci.vehicle.getCO2Emission(vehicle_id)

            speeds.append(speed)
            waiting_times.append(waiting_time)
            total_co2 += co2

            if speed <= 0.1:
                queue += 1

        return {
            "vehicle_count": len(vehicle_ids),
            "queue": queue,
            "avg_speed": sum(speeds) / len(speeds),
            "waiting_time": sum(waiting_times) / len(waiting_times),
            "co2": total_co2
        }


    def set_traffic_light_phase(self, traffic_light_id: str, phase: int):
        traci.trafficlight.setPhase(
            traffic_light_id,
            phase
        )

    def switch_to_next_phase(self, traffic_light_id: str):
        current_phase = traci.trafficlight.getPhase(traffic_light_id)

        program_logics = traci.trafficlight.getAllProgramLogics(
            traffic_light_id
        )

        phase_count = len(program_logics[0].phases)

        next_phase = (current_phase + 1) % phase_count

        traci.trafficlight.setPhase(
            traffic_light_id,
            next_phase
        )

        return next_phase
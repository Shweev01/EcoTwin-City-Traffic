import os
import sys
import traci


class SimulationService:
    def __init__(self):
        if "SUMO_HOME" not in os.environ:
            raise RuntimeError("SUMO_HOME environment variable is not set.")

        sumo_tools = os.path.join(os.environ["SUMO_HOME"], "tools")

        if sumo_tools not in sys.path:
            sys.path.append(sumo_tools)

    def start(self):
        config_file = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "..",
            "simulation",
            "demo.sumocfg.xml",
        )

        traci.start([
            "sumo",
            "-c",
            config_file
        ])

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

    def stop(self):
        traci.close()
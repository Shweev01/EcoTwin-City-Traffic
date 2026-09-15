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

    def stop(self):
        traci.close()
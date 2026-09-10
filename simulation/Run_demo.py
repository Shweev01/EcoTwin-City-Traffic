"""
EcoTwin mini-demo: a small SUMO city (3x3 grid, 5 signalized intersections)
with vehicles moving, traffic lights cycling, and live CO2 emissions readout.

This is the smallest possible version of what your Week 2 Gym environment
will wrap -- run this first to *see* the raw pieces (cars, lights, emissions)
before you touch RLlib.

Two ways to run it:

  1. WITH the SUMO GUI (recommended first run -- you SEE cars and lights):
        python run_demo.py --gui

  2. Headless, printing live stats to the terminal (what your env.py does):
        python run_demo.py
"""
import argparse
import os
import sys
import time

if "SUMO_HOME" in os.environ:
    sys.path.append(os.path.join(os.environ["SUMO_HOME"], "tools"))
else:
    sys.exit("SUMO_HOME is not set. See the README for setup steps.")

import traci  # noqa: E402


def run(use_gui: bool, steps: int, delay: float | None = None):
    binary = "sumo-gui" if use_gui else "sumo"
    # The configuration file is stored alongside this script.  Passing its
    # absolute path also makes the demo work when launched from the project root.
    config_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "demo.sumocfg.xml")
    traci.start([binary, "-c", config_file])

    # TraCI advances SUMO as fast as Python can call simulationStep().  Slow GUI
    # mode down so its window remains open long enough to watch the traffic.
    if delay is None:
        delay = 0.1 if use_gui else 0.0

    tls_ids = traci.trafficlight.getIDList()
    print(f"Loaded network with {len(tls_ids)} signalized intersections: {list(tls_ids)}")

    for step in range(steps):
        traci.simulationStep()

        if delay:
            time.sleep(delay)

        if step % 20 == 0:  # print a status line every 20 sim-seconds
            vehicle_ids = traci.vehicle.getIDList()
            total_co2 = sum(traci.vehicle.getCO2Emission(v) for v in vehicle_ids)
            total_waiting = sum(traci.vehicle.getWaitingTime(v) for v in vehicle_ids)
            light_states = {tls: traci.trafficlight.getPhase(tls) for tls in tls_ids}

            print(
                f"t={step:4d}s | vehicles={len(vehicle_ids):3d} | "
                f"total CO2={total_co2:9.1f} mg/s | total waiting={total_waiting:7.1f}s | "
                f"light phases={light_states}"
            )

    traci.close()
    print("Simulation finished.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--gui", action="store_true", help="open the SUMO GUI to watch it visually")
    parser.add_argument("--steps", type=int, default=600, help="simulated seconds to run")
    parser.add_argument(
        "--delay",
        type=float,
        default=None,
        help="real seconds to wait after each simulation step (GUI default: 0.1)",
    )
    args = parser.parse_args()
    if args.delay is not None and args.delay < 0:
        parser.error("--delay must be zero or greater")
    run(args.gui, args.steps, args.delay)

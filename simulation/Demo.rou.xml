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

if "SUMO_HOME" in os.environ:
    sys.path.append(os.path.join(os.environ["SUMO_HOME"], "tools"))
else:
    sys.exit("SUMO_HOME is not set. See the README for setup steps.")

import traci  # noqa: E402


def run(use_gui: bool, steps: int):
    binary = "sumo-gui" if use_gui else "sumo"
    traci.start([binary, "-c", "demo.sumocfg"])

    tls_ids = traci.trafficlight.getIDList()
    print(f"Loaded network with {len(tls_ids)} signalized intersections: {list(tls_ids)}")

    for step in range(steps):
        traci.simulationStep()

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
    args = parser.parse_args()
    run(args.gui, args.steps)
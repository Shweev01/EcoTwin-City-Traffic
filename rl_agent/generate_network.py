#Week 1 deliverable: generate a mock city grid + realistic traffic demand.


import os
import sys
import subprocess

def sumo_home():
    home = os.environ.get("SUMO_HOME")
    if not home:
        sys.exit(
            "SUMO_HOME is not set. Install SUMO and export SUMO_HOME "
            "(e.g. export SUMO_HOME=/usr/share/sumo) before running this script."
        )
    return home

def build_grid_network(out_prefix: str, grid_size: int, edge_len: int = 200):
    """Uses SUMO's netgenerate to build an NxN grid of signalized intersections."""
    net_file = f"{out_prefix}.net.xml"
    cmd = [
        "netgenerate",
        "--grid",
        "--grid.number", str(grid_size),
        "--grid.length", str(edge_len),
        "--default.lanenumber", "2",
        "--tls.guess", "true",          # auto-place traffic lights at junctions
        "--tls.default-type", "actuated",
        "--output-file", net_file,
    ]
    subprocess.run(cmd, check=True)
    return net_file


def build_demand(out_prefix: str, net_file: str, sim_time: int, period: float):
    """Uses randomTrips.py (ships with SUMO) to create a believable rush-hour-ish demand."""
    random_trips = os.path.join(sumo_home(), "tools", "randomTrips.py")
    rou_file = f"{out_prefix}.rou.xml"
    trips_file = f"{out_prefix}.trips.xml"
    cmd = [
        sys.executable, random_trips,
        "-n", net_file,
        "-o", trips_file,
        "-r", rou_file,
        "-e", str(sim_time),
        "-p", str(period),              # avg seconds between vehicle insertions
        "--fringe-factor", "5",         # bias demand towards edge-of-grid entry/exit
        "--validate",
    ]
    subprocess.run(cmd, check=True)
    return rou_file
 
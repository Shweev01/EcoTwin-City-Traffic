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
 
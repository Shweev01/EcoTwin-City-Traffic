# this is script wraps SUMO's own `netgenerate` and `randomTrips.py` tools so you
# don't hand-write .net.xml files. It produces:
#   ecotwin.net.xml   - the road network (grid)
#   ecotwin.rou.xml   - vehicle routes/demand
#   ecotwin.sumocfg   - the config TraCI/sumo will load
 
# Run:
#   python generate_network.py --grid-size 5 --sim-time 3600
# """









import argparse
import os
import subprocess
import sys
 
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
 
 
def write_sumocfg(out_prefix: str, net_file: str, rou_file: str, sim_time: int):
    cfg_file = f"{out_prefix}.sumocfg"
    with open(cfg_file, "w") as f:
        f.write(f"""<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <input>
        <net-file value="{net_file}"/>
        <route-files value="{rou_file}"/>
    </input>
    <time>
        <begin value="0"/>
        <end value="{sim_time}"/>
    </time>
    <processing>
        <device.emissions.probability value="1.0"/>
    </processing>
</configuration>
""")
    return cfg_file
 
 
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-prefix", default="ecotwin")
    parser.add_argument("--grid-size", type=int, default=5, help="NxN intersections")
    parser.add_argument("--sim-time", type=int, default=3600, help="seconds of simulated traffic")
    parser.add_argument("--period", type=float, default=1.5, help="avg seconds between vehicle spawns (lower = denser traffic)")
    args = parser.parse_args()
 
    sumo_home()  # fail fast if not configured
    net = build_grid_network(args.out_prefix, args.grid_size)
    rou = build_demand(args.out_prefix, net, args.sim_time, args.period)
    cfg = write_sumocfg(args.out_prefix, net, rou, args.sim_time)
    print(f"Done. Load {cfg} with `sumo-gui -c {cfg}` to sanity-check it visually.")
 
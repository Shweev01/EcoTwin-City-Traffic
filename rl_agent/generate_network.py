#Week 1 deliverable: generate a mock city grid + realistic traffic demand.


import os
import sys

def sumo_home():
    home = os.environ.get("SUMO_HOME")
    if not home:
        sys.exit(
            "SUMO_HOME is not set. Install SUMO and export SUMO_HOME "
            "(e.g. export SUMO_HOME=/usr/share/sumo) before running this script."
        )
    return home


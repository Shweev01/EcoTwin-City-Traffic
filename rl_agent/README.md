EcoTwin — RL & AI Lead Workstream

This is the RL/backend side of EcoTwin: SUMO simulation → Gym/RLlib multi-agent environment → PPO training → FastAPI/WebSocket serving of the trained policy. It's built to slot directly into the frontend team's React/Deck.gl dashboard.

0. One-time setup
bash
# SUMO itself (binaries), separate from the python bindings:
pip install eclipse-sumo          # OR: sudo apt-get install sumo sumo-tools
export SUMO_HOME=$(python3 -c "import sumo; print(sumo.SUMO_HOME)" 2>/dev/null || echo /usr/share/sumo)

pip install -r requirements.txt

Sanity check: sumo --version should print a version, and echo $SUMO_HOME should point at a real directory containing a tools/ folder.

Ray/RLlib API note: RLlib's config API (env_runners vs the older rollout_workers, num_epochs vs num_sgd_iter, etc.) has changed across Ray versions. train_ppo.py is written for Ray ≥2.9's "new API stack" naming. If you're pinned to an older Ray version, check PPOConfig().to_dict() in a REPL and rename the mismatched kwargs — the structure (env registration → multi_agent policy-mapping → training config → algo.train() loop) won't change.

1. Week 1 — Build the city + demand
bash
cd sumo_network
python generate_network.py --grid-size 5 --sim-time 3600
sumo-gui -c ecotwin.sumocfg   # visually confirm cars are flowing on a 5x5 grid

What to bring to the mid-project review: a screen recording of sumo-gui running the grid with visible congestion building at 1-2 intersections during the "rush hour" period — this is your visual proof the simulation is realistic enough to be worth optimizing.


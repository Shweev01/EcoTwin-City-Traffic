EcoTwin — RL & AI Lead Workstream

This is the RL/backend side of EcoTwin: SUMO simulation → Gym/RLlib multi-agent environment → PPO training → FastAPI/WebSocket serving of the trained policy. It's built to slot directly into the frontend team's React/Deck.gl dashboard.


0. One-time setup
bash
# SUMO itself (binaries), separate from the python bindings:
pip install eclipse-sumo          # OR: sudo apt-get install sumo sumo-tools
export SUMO_HOME=$(python3 -c "import sumo; print(sumo.SUMO_HOME)" 2>/dev/null || echo /usr/share/sumo)


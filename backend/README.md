# EcoTwin Backend

`main.py` supplies the FastAPI + WebSocket backend expected by the React dashboard. It owns exactly one SUMO/TraCI connection on a dedicated worker thread and runs the exported PPO controller against the existing scenario. It broadcasts the live SUMO state at `/ws/traffic` using the field names consumed by the frontend.

The server loads `rl_agent/models/ppo_ecotwin_actor.npz` and performs deterministic NumPy-only inference; the production container does not load PyTorch. If the actor is missing, local development deliberately falls back to static SUMO control, while a read-only production deployment fails startup rather than silently serving a non-PPO simulation. Install both backend and RL requirements from the repository root, then run:

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8001
```

The API includes read-only `GET /health`, `GET /_app/health`, and `GET /api/simulation/status`. Local development may use `POST /api/simulation/pause`, `/resume`, `/step`, and `/mode` with `{"mode":"baseline"}` or `{"mode":"ppo"}`. With `ECOTWIN_READ_ONLY=true`, all four mutation routes return HTTP 403; production health also requires the PPO actor to be loaded.

Set `SUMO_BINARY=sumo-gui` to use the graphical simulator, or `ECOTWIN_MODEL_PATH`, `ECOTWIN_SUMO_CONFIG`, `ECOTWIN_SEED`, `ECOTWIN_DECISION_INTERVAL`, and `ECOTWIN_REALTIME_DELAY` to override runtime defaults.

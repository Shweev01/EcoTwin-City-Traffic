# EcoTwin — RL Traffic-Signal Digital Twin

EcoTwin uses PPO to control five traffic lights in the existing SUMO city and streams the resulting live simulation to a React dashboard. The project uses the included SUMO network and routes; the RL controller sends phase requests through TraCI and never starts a separate scenario.

## Architecture

`PPO (or SUMO static baseline) → Gymnasium environment → TraCI → existing SUMO → FastAPI → WebSocket → React`

PPO controls A1, B0, B1, B2, and C1. Each policy step represents approximately five simulated seconds. SUMO's existing yellow/clearance phases and signal programs are retained. The frontend receives the same live vehicles, nine traffic-light states, emissions, and traffic metrics produced by that run.

## Requirements

- Python 3.10+ and a SUMO installation with `sumo` on `PATH` (or `SUMO_BINARY` set).
- Node.js 20+ and npm for the dashboard.
- Install a TraCI Python package compatible with the installed SUMO version.

From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\\Scripts\\activate
python -m pip install -r rl_agent/requirements.txt -r backend/requirements.txt
```

## Required validation, training, and comparison

Run the random-action test before training. It first applies Stable-Baselines3 `check_env()` and then controls SUMO for at least a few hundred environment steps:

```bash
python -m rl_agent.test_environment --episodes 5
```

Train and evaluate the saved model on matched seeds against SUMO's normal static signal programs:

```bash
python -m rl_agent.train --timesteps 4096
python -m rl_agent.evaluate --episodes 5
python -m rl_agent.export_policy --parity-samples 4096
```

The evaluation writes `rl_agent/evaluation/baseline_vs_ppo.csv` and `summary.json` with waiting time, cumulative CO₂, mean queue, throughput, and episode reward. Training saves `rl_agent/models/ppo_ecotwin.zip`; export creates the compact `rl_agent/models/ppo_ecotwin_actor.npz` used by the low-memory serving process. Training logs are under `rl_agent/logs/`.
The measured five-seed comparison is documented in [`rl_agent/evaluation/results.md`](rl_agent/evaluation/results.md).

## Run the dashboard and live simulation

After dependencies are installed (and ideally after training), start both services with:

```bash
./run_ecotwin.sh
```

Open the Vite URL printed in the terminal, normally `http://localhost:3000`. The dashboard uses same-origin `/api` and `/ws/traffic` paths; Vite proxies them to FastAPI on port 8001. If no exported actor exists, local development intentionally runs the static baseline; after training, export the policy and restart the services. The public production dashboard omits controls and its backend rejects pause, resume, manual-step, and controller-mode changes. For a one-off visual SUMO view, run `python -m rl_agent.inference --gui` separately.

## Useful endpoints and overrides

- `GET /health` and `GET /api/simulation/status`
- `GET /_app/health` (container readiness) and `GET /health`
- Local development only: `POST /api/simulation/pause`, `/resume`, `/step`, and `/mode` with `{"mode":"baseline"}` or `{"mode":"ppo"}`
- `SUMO_BINARY`, `ECOTWIN_MODEL_PATH`, `ECOTWIN_SUMO_CONFIG`, `ECOTWIN_SEED`, `ECOTWIN_DECISION_INTERVAL`, `ECOTWIN_REALTIME_DELAY`

See [`rl_agent/README.md`](rl_agent/README.md) and [`backend/README.md`](backend/README.md) for module details.

## Permanent public deployment

The WebDev publication serves `frontend/dist` as static output and the FastAPI/SUMO worker from the root `Dockerfile`. The backend runs the exported PPO actor via NumPy, keeps its TraCI connection on one worker thread, and streams live SUMO data through `/ws/traffic`. Production sets `ECOTWIN_READ_ONLY=true`; the site is view-only. The hosted evaluation card and downloadable five-seed CSV preserve the observed improvement/trade-off and caveat documented in [`rl_agent/evaluation/results.md`](rl_agent/evaluation/results.md).

# EcoTwin RL Agent

This package trains and runs a PPO traffic-signal controller against the repository's existing `simulation/demo.sumocfg.xml`. It does not generate or replace the SUMO network.

## Controller design

- **Signals:** A1, B0, B1, B2, C1. The other four network lights keep SUMO's original programs.
- **Observation:** 25 normalized float values: phase, approach queue, mean speed, accumulated stopped time, and CO₂ rate for each selected signal.
- **Action:** `MultiDiscrete([2, 2, 2, 2, 2])`; 0 keeps the current phase, 1 requests the next phase in the active SUMO program.
- **Signal safety:** A switch request during yellow/all-red is ignored. The preconfigured program retains control of yellow clearance and phase timing; the controller does not invent signal states.
- **Decision interval:** 5 simulated seconds, advanced as 50 SUMO steps at the included 0.1-second step length.
- **Reward:** Shaped penalties for mean wait, queue, and CO₂ plus a smaller capped throughput bonus. Weights and normalizers live in `reward.py`.

The SUMO Python API version (`traci`) should be compatible with the installed SUMO executable. Set `SUMO_BINARY` if `sumo` is not on `PATH`.

## Commands

From the repository root, after installing both dependency sets:

```bash
python -m rl_agent.test_environment --episodes 5
python -m rl_agent.train --timesteps 4096
python -m rl_agent.evaluate --episodes 5
python -m rl_agent.export_policy --parity-samples 4096
python -m rl_agent.inference
```

The random-action test runs `check_env()` first, then verifies a few hundred environment decisions, state/reward changes, emissions, and successful signal control. Do not train if that test fails.

Training writes the Stable-Baselines3 policy to `rl_agent/models/ppo_ecotwin.zip` and Monitor/TensorBoard data under `rl_agent/logs/`. Evaluation runs baseline and PPO on matched seeds and writes per-episode results to `rl_agent/evaluation/baseline_vs_ppo.csv` and `summary.json`. Export creates `rl_agent/models/ppo_ecotwin_actor.npz` and verifies 4,096 deterministic action predictions against Stable-Baselines3 before that NumPy-only artifact is used by the low-memory production backend.

Use `python -m rl_agent.inference --gui` to launch `sumo-gui` for a visual inference episode. The default inference run is headless.

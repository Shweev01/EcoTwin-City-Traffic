# Baseline vs PPO — measured results

**Scenario:** existing `demo.sumocfg.xml`, 300 simulated seconds per episode, 0.1-second SUMO step, five matched seeds (101–105). Baseline uses the scenario's normal/static signal programs; PPO controls A1, B0, B1, B2, and C1. PPO policy trained for 4,096 environment decision steps. Values below are means across five paired episodes.

| Metric | Static baseline | PPO | Change vs baseline |
|---|---:|---:|---:|
| Average waiting time (s/vehicle) | 15.68 | 11.52 | **−26.5%** |
| Total CO₂ (mg/episode) | 44,335,636 | 43,458,786 | **−2.0%** |
| Average queue (vehicles/incoming lane) | 0.759 | 0.498 | **−34.4%** |
| Throughput (completed vehicles/episode) | 179.6 | 171.6 | **−4.5%** |
| Episode reward | −7.962 | −6.072 | higher / less negative |

This is a **trade-off, not a uniform win**: on these seeds the learned policy reduced mean waiting, queues, and total CO₂, while completing fewer trips. Seed 105 was a regression for PPO (wait 17.03 s vs 14.59 s; CO₂ 45.65M mg vs 44.24M mg; throughput 161 vs 185), so the average should not hide that variability. These are preliminary results from a short training run and five paired episodes, not a claim of statistically established improvement; longer training and broader seeds should be used for final scientific conclusions.

The raw per-episode measurements and precise aggregates are in `baseline_vs_ppo.csv` and `summary.json`. Rerun with `python -m rl_agent.evaluate --episodes 5 --seed 101` after training to reproduce them.

"""Compare static SUMO control and PPO on matched scenario seeds."""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from statistics import mean

from stable_baselines3 import PPO

from .environment import DEFAULT_CONFIG, EcoTwinSumoEnv

ROOT = Path(__file__).resolve().parents[1]


def run_episode(mode: str, seed: int, model: PPO | None, config: Path, interval: float) -> dict[str, float | int | str]:
    env = EcoTwinSumoEnv(config_path=config, decision_interval=interval, seed=seed)
    observation, _ = env.reset(seed=seed)
    queue_samples: list[float] = []
    wait_samples: list[float] = []
    reward_sum = 0.0
    try:
        while True:
            if mode == "ppo":
                assert model is not None
                action, _ = model.predict(observation, deterministic=True)
            else:
                action = env.action_space.sample() * 0
            observation, reward, terminated, truncated, info = env.step(action)
            metrics = info["metrics"]
            queue_samples.append(float(metrics["average_queue"]))
            wait_samples.append(float(metrics["average_wait_time"]))
            reward_sum += float(reward)
            if terminated or truncated:
                break
        metrics = info["metrics"]
        return {
            "mode": mode,
            "seed": seed,
            "average_wait_time_s": float(metrics["average_wait_time"]),
            "total_co2_mg": float(metrics["cumulative_co2_mg"]),
            "average_queue_vehicles_per_lane": mean(queue_samples) if queue_samples else 0.0,
            "throughput_vehicles": int(metrics["throughput"]),
            "episode_reward": reward_sum,
            "simulated_seconds": float(metrics["simulation_time"]),
        }
    finally:
        env.close()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--episodes", type=int, default=5)
    parser.add_argument("--seed", type=int, default=101)
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--model-path", type=Path, default=ROOT / "rl_agent" / "models" / "ppo_ecotwin.zip")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "rl_agent" / "evaluation")
    parser.add_argument("--decision-interval", type=float, default=5.0)
    args = parser.parse_args()
    if args.episodes < 1:
        parser.error("--episodes must be at least 1")
    if not args.model_path.exists():
        parser.error(f"Trained model not found: {args.model_path}. Run python -m rl_agent.train first.")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    model = PPO.load(str(args.model_path), device="cpu")
    rows = []
    for episode in range(args.episodes):
        seed = args.seed + episode
        for mode in ("baseline", "ppo"):
            row = run_episode(mode, seed, model if mode == "ppo" else None, args.config, args.decision_interval)
            rows.append(row)
            print(f"{mode:8s} episode={episode + 1}/{args.episodes} seed={seed} "
                  f"wait={row['average_wait_time_s']:.2f}s co2={row['total_co2_mg']:.0f}mg "
                  f"queue={row['average_queue_vehicles_per_lane']:.2f} "
                  f"throughput={row['throughput_vehicles']}")

    csv_path = args.output_dir / "baseline_vs_ppo.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    summary: dict[str, dict[str, float]] = {}
    for mode in ("baseline", "ppo"):
        subset = [row for row in rows if row["mode"] == mode]
        summary[mode] = {
            key: mean(float(row[key]) for row in subset)
            for key in (
                "average_wait_time_s", "total_co2_mg", "average_queue_vehicles_per_lane",
                "throughput_vehicles", "episode_reward", "simulated_seconds",
            )
        }
    json_path = args.output_dir / "summary.json"
    json_path.write_text(json.dumps({"episodes": args.episodes, "runs": rows, "mean": summary}, indent=2) + "\n", encoding="utf-8")
    print("\nMean results across matched seeds")
    print("Metric                         Baseline        PPO")
    for key, label in (
        ("average_wait_time_s", "Average wait (s)"),
        ("total_co2_mg", "Total CO2 (mg)"),
        ("average_queue_vehicles_per_lane", "Average queue/lane"),
        ("throughput_vehicles", "Throughput (vehicles)"),
        ("episode_reward", "Episode reward"),
    ):
        print(f"{label:30s} {summary['baseline'][key]:10.2f} {summary['ppo'][key]:10.2f}")
    print(f"\nWrote {csv_path} and {json_path}")


if __name__ == "__main__":
    main()

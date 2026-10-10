"""Run the saved PPO controller against the existing SUMO simulation."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from stable_baselines3 import PPO

from .environment import DEFAULT_CONFIG, EcoTwinSumoEnv

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model-path", type=Path, default=ROOT / "rl_agent" / "models" / "ppo_ecotwin.zip")
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--seed", type=int, default=123)
    parser.add_argument("--decision-interval", type=float, default=5.0)
    parser.add_argument("--gui", action="store_true", help="Launch sumo-gui instead of headless SUMO")
    args = parser.parse_args()
    if not args.model_path.exists():
        parser.error(f"Model not found: {args.model_path}. Run python -m rl_agent.train first.")

    binary = "sumo-gui" if args.gui else None
    env = EcoTwinSumoEnv(config_path=args.config, sumo_binary=binary, decision_interval=args.decision_interval, seed=args.seed)
    model = PPO.load(str(args.model_path), device="cpu")
    observation, _ = env.reset(seed=args.seed)
    try:
        while True:
            action, _ = model.predict(observation, deterministic=True)
            observation, reward, terminated, truncated, info = env.step(action)
            record = {
                "time": info["metrics"]["simulation_time"],
                "action": [int(value) for value in action],
                "applied": info["actions_applied"],
                "changed_lights": info["phase_changes"],
                "reward": reward,
                "metrics": info["metrics"],
            }
            print(json.dumps(record))
            if terminated or truncated:
                break
    finally:
        env.close()


if __name__ == "__main__":
    main()

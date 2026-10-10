"""Train a PPO agent against the repository's SUMO scenario."""
from __future__ import annotations

import argparse
from pathlib import Path

from stable_baselines3 import PPO
from stable_baselines3.common.monitor import Monitor

from .environment import DEFAULT_CONFIG, EcoTwinSumoEnv

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--timesteps", type=int, default=4096, help="PPO environment decision steps")
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--model-path", type=Path, default=ROOT / "rl_agent" / "models" / "ppo_ecotwin")
    parser.add_argument("--log-dir", type=Path, default=ROOT / "rl_agent" / "logs" / "ppo")
    parser.add_argument("--decision-interval", type=float, default=5.0)
    args = parser.parse_args()
    if args.timesteps <= 0:
        parser.error("--timesteps must be positive")

    args.model_path.parent.mkdir(parents=True, exist_ok=True)
    args.log_dir.mkdir(parents=True, exist_ok=True)
    env = EcoTwinSumoEnv(config_path=args.config, decision_interval=args.decision_interval, seed=args.seed)
    env = Monitor(env, filename=str(args.log_dir / "monitor.csv"))
    model = PPO(
        "MlpPolicy",
        env,
        learning_rate=3e-4,
        n_steps=256,
        batch_size=64,
        gamma=0.99,
        gae_lambda=0.95,
        ent_coef=0.01,
        verbose=1,
        seed=args.seed,
        device="cpu",
        tensorboard_log=str(args.log_dir / "tensorboard"),
    )
    try:
        model.learn(total_timesteps=args.timesteps, progress_bar=False)
        model.save(str(args.model_path))
        print(f"Saved PPO policy to {args.model_path.with_suffix('.zip')}")
    finally:
        env.close()


if __name__ == "__main__":
    main()

"""Smoke-test random SUMO control, traffic telemetry, and Gymnasium compliance."""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from stable_baselines3.common.env_checker import check_env

from .environment import DEFAULT_CONFIG, EcoTwinSumoEnv

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--episodes", type=int, default=5, help="Five default 300s episodes produce 300 decision steps")
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--seed", type=int, default=202)
    parser.add_argument("--decision-interval", type=float, default=5.0)
    args = parser.parse_args()

    env = EcoTwinSumoEnv(config_path=args.config, decision_interval=args.decision_interval, seed=args.seed)
    print("Running Stable-Baselines3 check_env()...")
    check_env(env, warn=True)
    print("check_env(): PASS")

    env.reset(seed=args.seed)
    for light in env.controlled_lights:
        env.connection.trafficlight.setPhase(light, 1)  # Existing program's yellow clearance phase.
    applied, changed = env._apply_actions(np.ones(5, dtype=np.int64))
    if any(applied) or changed:
        raise AssertionError("Controller interrupted a SUMO yellow phase")
    if any(env.connection.trafficlight.getPhase(light) != 1 for light in env.controlled_lights):
        raise AssertionError("Yellow phase index changed before its SUMO clearance completed")
    print("yellow transition protection: PASS")
    env.close()

    rng = np.random.default_rng(args.seed)
    total_steps = 0
    changed_lights: set[str] = set()
    phases_seen: dict[str, set[int]] = {light: set() for light in env.controlled_lights}
    max_active = 0
    max_co2 = 0.0
    reward_values: list[float] = []
    try:
        for episode in range(args.episodes):
            observation, info = env.reset(seed=args.seed + episode)
            if not env.observation_space.contains(observation):
                raise AssertionError("reset() returned an observation outside observation_space")
            done = False
            while not done:
                action = rng.integers(0, 2, size=5, dtype=np.int64)
                observation, reward, terminated, truncated, info = env.step(action)
                total_steps += 1
                done = terminated or truncated
                metrics = info["metrics"]
                max_active = max(max_active, int(metrics["vehicle_count"]))
                max_co2 = max(max_co2, float(metrics["total_co2"]))
                reward_values.append(float(reward))
                changed_lights.update(info["phase_changes"])
                for light in env.controlled_lights:
                    phases_seen[light].add(int(env.connection.trafficlight.getPhase(light)))
                if not env.observation_space.contains(observation):
                    raise AssertionError("step() returned an observation outside observation_space")
                if done:
                    print(f"episode={episode + 1} t={metrics['simulation_time']:.1f}s "
                          f"vehicles={metrics['vehicle_count']} arrived={metrics['throughput']} "
                          f"CO2={metrics['cumulative_co2_mg']:.0f}mg")
    finally:
        env.close()

    if not max_active:
        raise AssertionError("No vehicles were observed")
    if not max_co2 > 0:
        raise AssertionError("SUMO returned no CO2 emissions")
    if not changed_lights:
        raise AssertionError("Random actions did not change any controlled traffic light")
    if len(set(round(value, 7) for value in reward_values)) < 2:
        raise AssertionError("Reward did not vary during the random-action test")
    if total_steps < 200:
        raise AssertionError(f"Expected a few hundred random-action steps, got {total_steps}")
    print(f"random-action test: PASS ({total_steps} steps; changed lights={sorted(changed_lights)})")
    print(f"vehicles moved/appeared: max active={max_active}; max CO2 rate={max_co2:.1f} mg/s")
    print(f"observed phases: { {key: sorted(value) for key, value in phases_seen.items()} }")


if __name__ == "__main__":
    main()

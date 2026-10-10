"""Export and parity-check the trained SB3 PPO actor for NumPy-only serving."""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from stable_baselines3 import PPO

from .numpy_policy import NumpyPPOPolicy

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODEL = ROOT / "rl_agent" / "models" / "ppo_ecotwin.zip"
DEFAULT_OUTPUT = ROOT / "rl_agent" / "models" / "ppo_ecotwin_actor.npz"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--parity-samples", type=int, default=4096)
    args = parser.parse_args()

    model = PPO.load(str(args.model), device="cpu")
    if tuple(model.observation_space.shape) != (25,) or tuple(model.action_space.nvec) != (2, 2, 2, 2, 2):
        raise ValueError("Unexpected EcoTwin PPO observation/action space")
    policy = model.policy
    actor = policy.mlp_extractor.policy_net
    arrays = {
        "fc1_weight": actor[0].weight.detach().cpu().numpy(),
        "fc1_bias": actor[0].bias.detach().cpu().numpy(),
        "fc2_weight": actor[2].weight.detach().cpu().numpy(),
        "fc2_bias": actor[2].bias.detach().cpu().numpy(),
        "action_weight": policy.action_net.weight.detach().cpu().numpy(),
        "action_bias": policy.action_net.bias.detach().cpu().numpy(),
        "n_lights": np.asarray([5], dtype=np.int64),
        "actions_per_light": np.asarray([2], dtype=np.int64),
        "observation_size": np.asarray([25], dtype=np.int64),
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(args.output, **arrays)

    exported = NumpyPPOPolicy(args.output)
    rng = np.random.default_rng(712)
    for start in range(0, args.parity_samples, 256):
        batch = rng.random((min(256, args.parity_samples - start), 25), dtype=np.float32)
        expected, _ = model.predict(batch, deterministic=True)
        actual = np.stack([exported.predict(obs) for obs in batch])
        if not np.array_equal(expected, actual):
            mismatch = np.argwhere(expected != actual)[0].tolist()
            raise AssertionError(f"NumPy/SB3 action mismatch at batch index {mismatch}")
    print(f"Exported {args.output} ({args.output.stat().st_size} bytes)")
    print(f"Deterministic action parity: PASS ({args.parity_samples} observation vectors)")


if __name__ == "__main__":
    main()

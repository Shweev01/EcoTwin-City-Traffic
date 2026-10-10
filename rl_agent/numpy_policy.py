"""Tiny deterministic inference for EcoTwin's exported PPO actor (NumPy only)."""
from __future__ import annotations

from pathlib import Path

import numpy as np


class NumpyPPOPolicy:
    """A NumPy implementation of the trained PPO policy's MLP actor."""

    def __init__(self, model_path: str | Path) -> None:
        with np.load(model_path, allow_pickle=False) as weights:
            self.fc1_weight = weights["fc1_weight"].astype(np.float32, copy=True)
            self.fc1_bias = weights["fc1_bias"].astype(np.float32, copy=True)
            self.fc2_weight = weights["fc2_weight"].astype(np.float32, copy=True)
            self.fc2_bias = weights["fc2_bias"].astype(np.float32, copy=True)
            self.action_weight = weights["action_weight"].astype(np.float32, copy=True)
            self.action_bias = weights["action_bias"].astype(np.float32, copy=True)
            self.n_lights = int(weights["n_lights"][0])
            self.actions_per_light = int(weights["actions_per_light"][0])
            self.observation_size = int(weights["observation_size"][0])

    def predict(self, observation: np.ndarray) -> np.ndarray:
        values = np.asarray(observation, dtype=np.float32).reshape(-1)
        if values.shape != (self.observation_size,):
            raise ValueError(
                f"Expected observation shape ({self.observation_size},), got {values.shape}"
            )
        hidden = np.tanh(self.fc1_weight @ values + self.fc1_bias)
        hidden = np.tanh(self.fc2_weight @ hidden + self.fc2_bias)
        logits = self.action_weight @ hidden + self.action_bias
        # MultiDiscrete([2] * n_lights): deterministic categorical argmax per light.
        return np.argmax(
            logits.reshape(self.n_lights, self.actions_per_light), axis=1
        ).astype(np.int64)

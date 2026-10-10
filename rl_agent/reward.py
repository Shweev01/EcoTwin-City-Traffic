"""Reward shaping for traffic efficiency and emissions."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RewardWeights:
    waiting: float = 0.40
    queue: float = 0.25
    co2: float = 0.25
    throughput: float = 0.10


def calculate_reward(
    *,
    average_wait_time: float,
    average_queue: float,
    co2_mg_per_second: float,
    throughput: int,
    vehicle_count: int,
    weights: RewardWeights = RewardWeights(),
) -> tuple[float, dict[str, float]]:
    """Return a bounded shaped reward and its interpretable components.

    Waiting is normalized against 60 seconds, mean queue per controlled lane
    against 10 vehicles, and CO₂ rate per active vehicle against 10,000 mg/s.
    Throughput contributes a small bounded bonus (arrivals during one RL
    decision interval, capped at five). The cost terms are intentionally
    primary; the bonus rewards clearing completed trips without allowing a
    large flow reward to swamp waiting/queue/emissions.
    """
    wait_norm = min(max(float(average_wait_time), 0.0) / 60.0, 2.0)
    queue_norm = min(max(float(average_queue), 0.0) / 10.0, 2.0)
    co2_per_vehicle = max(float(co2_mg_per_second), 0.0) / max(int(vehicle_count), 1)
    co2_norm = min(co2_per_vehicle / 10000.0, 2.0)
    throughput_norm = min(max(int(throughput), 0) / 5.0, 1.0)

    components = {
        "waiting_cost": -weights.waiting * wait_norm,
        "queue_cost": -weights.queue * queue_norm,
        "co2_cost": -weights.co2 * co2_norm,
        "throughput_bonus": weights.throughput * throughput_norm,
    }
    return float(sum(components.values())), components

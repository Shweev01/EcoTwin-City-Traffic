import argparse
import os
import sys
 
import ray
from ray import tune
from ray.rllib.algorithms.ppo import PPOConfig
from ray.rllib.policy.policy import PolicySpec
 
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "envs"))
from traffic_env import EcoTwinTrafficEnv  # noqa: E402
 
 
def env_creator(config):
    return EcoTwinTrafficEnv(config)
 
 
def policy_mapping_fn(agent_id, episode=None, worker=None, **kwargs):
    # Every traffic-light agent maps to the SAME policy -> parameter sharing.
    return "shared_tls_policy"
 
 
def build_config(sumo_cfg: str, num_workers: int, use_gui: bool):
    from ray.tune.registry import register_env
    register_env("ecotwin_traffic", env_creator)
 
    env_config = {
        "sumo_cfg": sumo_cfg,
        "use_gui": use_gui,
        "sim_steps_per_action": 10,
        "max_episode_steps": 360,   # ~3600 sim-seconds per episode, matching Week 1 demand
        "w_wait": 0.5,
        "w_co2": 0.4,
        "w_flow": 0.1,
        "w_switch_penalty": 0.05,
    }
 
    config = (
        PPOConfig()
        .environment("ecotwin_traffic", env_config=env_config, disable_env_checking=True)
        .framework("torch")
        .env_runners(num_env_runners=num_workers, rollout_fragment_length=30)
        .multi_agent(
            policies={"shared_tls_policy": PolicySpec()},
            policy_mapping_fn=policy_mapping_fn,
        )
        .training(
            train_batch_size=2000,
            lr=3e-4,
            gamma=0.99,
            lambda_=0.95,
            clip_param=0.2,
            num_epochs=10,
            minibatch_size=256,
        )
        .resources(num_gpus=0)
    )
    return config


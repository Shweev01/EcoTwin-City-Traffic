from pydantic import BaseModel
from typing import Dict


class RLLaneState(BaseModel):
    vehicle_count: int
    queue: int
    avg_speed: float
    waiting_time: float
    co2: float


class RLTrafficLightState(BaseModel):
    phase: int
    lanes: Dict[str, RLLaneState]


class RLState(BaseModel):
    timestamp: float
    traffic_lights: Dict[str, RLTrafficLightState]

class RLAction(BaseModel):
    actions: Dict[str, int]

class RLInterface:
    def __init__(self, simulation_controller):
        self.simulation_controller = simulation_controller

    def get_state(self):
        state_data = self.simulation_controller.get_rl_state()
        return RLState(**state_data)

    def apply_action(self, action: RLAction):
        results = {}

        for traffic_light_id, value in action.actions.items():
            if value not in (0, 1):
                raise ValueError(
                    f"Invalid action '{value}' for traffic light "
                    f"'{traffic_light_id}'. Use 0 or 1."
                )

            if value == 0:
                results[traffic_light_id] = {
                    "action": 0,
                    "result": "kept_current_phase"
                }

            else:
                next_phase = (
                    self.simulation_controller.simulation_service
                    .switch_to_next_phase(traffic_light_id)
                )

                results[traffic_light_id] = {
                    "action": 1,
                    "result": "switched_to_next_phase",
                    "phase": next_phase
                }

        return results
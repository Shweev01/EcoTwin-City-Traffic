class RLInterface:
    def __init__(self, simulation_controller):
        self.simulation_controller = simulation_controller

    def get_state(self):
        return self.simulation_controller.get_state()

    def apply_action(self, action):
        return action
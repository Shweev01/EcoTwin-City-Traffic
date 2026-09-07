import random


def generate_simulation_data(timestamp: float):
    return {
        "type": "simulation_update",
        "timestamp": timestamp,

        "vehicles": [
            {
                "id": "veh_001",
                "x": round(random.uniform(100, 200), 2),
                "y": round(random.uniform(80, 120), 2),
                "speed": round(random.uniform(0, 15), 2),
                "waiting_time": round(random.uniform(0, 10), 2)
            },
            {
                "id": "veh_002",
                "x": round(random.uniform(100, 200), 2),
                "y": round(random.uniform(80, 120), 2),
                "speed": round(random.uniform(0, 15), 2),
                "waiting_time": round(random.uniform(0, 10), 2)
            }
        ],

        "traffic_lights": [
            {
                "id": "J1",
                "state": random.choice(["G", "Y", "R"]),
                "phase": random.randint(0, 3)
            }
        ],

        "emissions": [
            {
                "x": 150.0,
                "y": 90.0,
                "co2": round(random.uniform(50, 150), 2)
            }
        ],

        "metrics": {
            "total_co2": round(random.uniform(1000, 1500), 2),
            "average_wait_time": round(random.uniform(10, 40), 2),
            "vehicle_count": 2
        }
    }
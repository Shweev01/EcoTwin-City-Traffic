import asyncio
import time
import websockets


async def benchmark():
    uri = "ws://127.0.0.1:8000/ws/traffic"

    start_time = time.time()
    messages = 0
    first_timestamp = None
    last_timestamp = None

    async with websockets.connect(uri) as websocket:
        while time.time() - start_time < 10:
            message = await websocket.recv()

            import json
            data = json.loads(message)

            messages += 1

            if first_timestamp is None:
                first_timestamp = data["timestamp"]

            last_timestamp = data["timestamp"]

    elapsed = time.time() - start_time

    print("\n--- WebSocket Benchmark ---")
    print(f"Wall-clock time: {elapsed:.2f} seconds")
    print(f"Messages received: {messages}")
    print(f"Messages/second: {messages / elapsed:.2f}")
    print(f"First simulation timestamp: {first_timestamp}")
    print(f"Last simulation timestamp: {last_timestamp}")
    print(f"Simulation seconds covered: {last_timestamp - first_timestamp}")


try:
    asyncio.run(benchmark())
except KeyboardInterrupt:
    print("Benchmark stopped.")


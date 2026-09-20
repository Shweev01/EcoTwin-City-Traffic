import asyncio
import websockets


async def test_websocket():
    uri = "ws://127.0.0.1:8000/ws/traffic"

    async with websockets.connect(uri) as websocket:
        while True:
            message = await websocket.recv()
            print(message)

try:
    asyncio.run(test_websocket())
except KeyboardInterrupt:
    print("\nWebSocket test stopped by user.")
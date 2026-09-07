import asyncio
import websockets


async def test_websocket():
    uri = "ws://127.0.0.1:8000/ws/traffic"

    async with websockets.connect(uri) as websocket:
        for _ in range(5):
            message = await websocket.recv()
            print(message)


asyncio.run(test_websocket())
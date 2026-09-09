const WS_URL = "ws://127.0.0.1:8000/ws/traffic";

export function connectWebSocket(onMessage, onError, onClose) {
  const websocket = new WebSocket(WS_URL);

  websocket.onopen = () => {
    console.log("Connected to EcoTwin WebSocket");
  };

  websocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error("Invalid WebSocket data:", error);
    }
  };

  websocket.onerror = (error) => {
    console.error("WebSocket error:", error);

    if (onError) {
      onError(error);
    }
  };

  websocket.onclose = () => {
    console.log("WebSocket connection closed");

    if (onClose) {
      onClose();
    }
  };

  return websocket;
}
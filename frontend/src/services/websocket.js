const WS_PROTOCOL = window.location.protocol === "https:" ? "wss:" : "ws:";
const WS_URL = `${WS_PROTOCOL}//${window.location.host}/ws/traffic`;

export function connectWebSocket(onMessage, onStatusChange) {
  let socket = null;
  let reconnectTimer = null;
  let manuallyClosed = false;

  const connect = () => {
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      console.log("WebSocket connected");
      onStatusChange?.("connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      } catch (error) {
        console.error("WebSocket message parse error:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      onStatusChange?.("error");
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
      onStatusChange?.("disconnected");

      if (!manuallyClosed) {
        reconnectTimer = setTimeout(connect, 3000);
      }
    };
  };

  connect();

  // IMPORTANT:
  // connectWebSocket returns a function.
  // App.jsx can call this function during cleanup.
  return () => {
    manuallyClosed = true;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    if (
      socket &&
      (socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING)
    ) {
      socket.close();
    }
  };
}

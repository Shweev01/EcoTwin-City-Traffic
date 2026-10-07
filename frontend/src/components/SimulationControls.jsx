import { useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

function SimulationControls() {
  const [status, setStatus] = useState({
    running: false,
    paused: false,
  });

  const [backendStatus, setBackendStatus] = useState("checking");
  const [loading, setLoading] = useState(false);

  async function fetchStatus() {
    try {
      const response = await fetch(
        API_BASE_URL + "/api/simulation/status"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch simulation status");
      }

      const data = await response.json();

      setStatus({
        running: Boolean(data.running),
        paused: Boolean(data.paused),
      });

      setBackendStatus("connected");
    } catch (error) {
      console.error("Simulation status error:", error);

      setBackendStatus("offline");

      setStatus({
        running: false,
        paused: false,
      });
    }
  }

  useEffect(() => {
    fetchStatus();

    const interval = setInterval(fetchStatus, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  async function sendControlRequest(endpoint) {
    setLoading(true);

    try {
      const response = await fetch(
        API_BASE_URL + "/api/simulation/" + endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to " + endpoint + " simulation"
        );
      }

      await response.json();

      setBackendStatus("connected");

      await fetchStatus();
    } catch (error) {
      console.error(
        "Simulation " + endpoint + " error:",
        error
      );

      setBackendStatus("offline");
    } finally {
      setLoading(false);
    }
  }

  let simulationState = "Stopped";
  let simulationStateClass = "simulation-stopped";

  if (status.paused) {
    simulationState = "Paused";
    simulationStateClass = "simulation-paused";
  } else if (status.running) {
    simulationState = "Running";
    simulationStateClass = "simulation-running";
  }

  let backendMessage = "Checking simulation backend...";

  if (backendStatus === "connected") {
    backendMessage = "Simulation backend connected";
  } else if (backendStatus === "offline") {
    backendMessage =
      "Simulation backend unavailable - connect SUMO to enable controls";
  }

  return (
    <section className="simulation-controls">
      <div className="simulation-controls-header">
        <div>
          <h3>Simulation Control</h3>

          <p>
            Control the live SUMO traffic simulation
          </p>
        </div>

        <div
          className={
            "simulation-state " +
            simulationStateClass
          }
        >
          <span className="simulation-state-dot"></span>

          {simulationState}
        </div>
      </div>

      <div
        className={
          "simulation-backend-status backend-" +
          backendStatus
        }
      >
        <span className="backend-status-dot"></span>

        {backendMessage}
      </div>

      <div className="simulation-control-buttons">
        <button
          onClick={() => {
            sendControlRequest("pause");
          }}
          disabled={
            loading ||
            backendStatus !== "connected" ||
            !status.running ||
            status.paused
          }
        >
          {loading ? "Processing..." : "Pause"}
        </button>

        <button
          onClick={() => {
            sendControlRequest("resume");
          }}
          disabled={
            loading ||
            backendStatus !== "connected" ||
            !status.running ||
            !status.paused
          }
        >
          Resume
        </button>

        <button
          onClick={() => {
            sendControlRequest("step");
          }}
          disabled={
            loading ||
            backendStatus !== "connected" ||
            !status.running
          }
        >
          Step
        </button>
      </div>
    </section>
  );
}

export default SimulationControls;
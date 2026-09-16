import { useEffect, useState } from "react";
import CityMap from "./components/CityMap";
import AnalyticsChart from "./components/AnalyticsChart";
import { connectWebSocket } from "./services/websocket";
import { normalizeSimulationData } from "./services/simulationData";
import "./App.css";

function App() {
  const [simulationData, setSimulationData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [analyticsData, setAnalyticsData] = useState([]);

  useEffect(() => {
    const websocket = connectWebSocket(
      (data) => {
        console.log("Received simulation data:", data);

        const normalizedData = normalizeSimulationData(data);

        setSimulationData(normalizedData);
        setConnectionStatus("Simulation Live");

        setAnalyticsData((previousData) => {
          const newPoint = {
            time: normalizedData.timestamp,
            total_co2: normalizedData.metrics?.total_co2 ?? 0,
            average_wait_time:
              normalizedData.metrics?.average_wait_time ?? 0,
          };

          const updatedData = [...previousData, newPoint];

          return updatedData.slice(-30);
        });
      },

      () => {
        setConnectionStatus("WebSocket Error");
      },

      () => {
        setConnectionStatus("Disconnected");
      }
    );

    return () => websocket.close();
  }, []);

  const vehicles = simulationData?.vehicles || [];
  const trafficLights = simulationData?.trafficLights || [];
  const emissions = simulationData?.emissions || [];
  const metrics = simulationData?.metrics;

  const currentTrafficState =
    trafficLights.length > 0 ? trafficLights[0].state : null;

  const trafficStatus =
    currentTrafficState === "G"
      ? "Green"
      : currentTrafficState === "Y"
      ? "Yellow"
      : currentTrafficState === "R"
      ? "Red"
      : "--";

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div>
          <h1>EcoTwin</h1>
          <p>Reinforcement Learning for Urban Carbon Dispersal</p>
        </div>

        <div
          className={`simulation-status ${connectionStatus
            .toLowerCase()
            .replace(" ", "-")}`}
        >
          <span className="status-dot"></span>
          {connectionStatus}
        </div>
      </header>

      <main className="dashboard">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <h2>Live Metrics</h2>

          {/* VEHICLES */}
          <div className="metric-card">
            <span>Vehicles</span>

            <strong>
              {metrics?.vehicle_count ?? "--"}
            </strong>

            <small>active vehicles</small>
          </div>

          {/* CO₂ */}
          <div className="metric-card">
            <span>Total CO₂</span>

            <strong>
              {metrics?.total_co2 != null
                ? `${metrics.total_co2.toFixed(2)}`
                : "--"}
            </strong>

            <small>simulation value</small>
          </div>

          {/* WAIT TIME */}
          <div className="metric-card">
            <span>Average Wait Time</span>

            <strong>
              {metrics?.average_wait_time != null
                ? `${metrics.average_wait_time.toFixed(2)} s`
                : "--"}
            </strong>

            <small>average vehicle waiting</small>
          </div>

          {/* TRAFFIC STATUS */}
          <div className="metric-card">
            <span>Traffic Status</span>

            <strong>{trafficStatus}</strong>

            <small>
              {trafficLights.length > 0
                ? `Signal ${trafficLights[0].id}`
                : "current signal state"}
            </small>
          </div>
        </aside>

        {/* MAIN SIMULATION PANEL */}
        <section className="simulation-panel">
          <div className="section-header">
            <div>
              <h2>City Simulation</h2>

              <p>
                Live traffic and carbon dispersal visualization
              </p>
            </div>

            <span className="live-badge">
              LIVE MAP
            </span>
          </div>

          {/* MAP */}
          <div className="map-container">
            <CityMap
              vehicles={vehicles}
              trafficLights={trafficLights}
              emissions={emissions}
            />
          </div>

          {/* SIMULATION OVERVIEW */}
          <div className="simulation-overview">
            <div className="overview-item">
              <span>Simulation Time</span>

              <strong>
                {simulationData?.timestamp ?? "--"}
              </strong>
            </div>

            <div className="overview-item">
              <span>Vehicles</span>

              <strong>{vehicles.length}</strong>
            </div>

            <div className="overview-item">
              <span>Emission Points</span>

              <strong>{emissions.length}</strong>
            </div>

            <div className="overview-item">
              <span>Traffic Lights</span>

              <strong>{trafficLights.length}</strong>
            </div>
          </div>

          {/* ANALYTICS */}
          <AnalyticsChart data={analyticsData} />

          {/* SIMULATION STATUS */}
          <div className="simulation-info">
            <h3>Simulation Status</h3>

            <p>
              {simulationData
                ? `Simulation time: ${simulationData.timestamp}`
                : "Waiting for simulation and WebSocket data..."}
            </p>

            {simulationData && (
              <p>
                Live updates received every second
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
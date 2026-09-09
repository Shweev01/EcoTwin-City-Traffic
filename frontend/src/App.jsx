import { useEffect, useState } from "react";
import CityMap from "./components/CityMap";
import { connectWebSocket } from "./services/websocket";
import "./App.css";

function App() {
  const [simulationData, setSimulationData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");

  useEffect(() => {
    const websocket = connectWebSocket(
      (data) => {
        console.log("Received simulation data:", data);
        setSimulationData(data);
        setConnectionStatus("Simulation Live");
      },
      () => {
        setConnectionStatus("WebSocket Error");
      },
      () => {
        setConnectionStatus("Disconnected");
      }
    );

    return () => {
      websocket.close();
    };
  }, []);

  const vehicles = simulationData?.vehicles || [];
  const trafficLights = simulationData?.traffic_lights || [];
  const metrics = simulationData?.metrics;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div>
          <h1>EcoTwin</h1>
          <p>Reinforcement Learning for Urban Carbon Dispersal</p>
        </div>

        <div className="simulation-status">
          <span className="status-dot"></span>
          {connectionStatus}
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="dashboard">

        {/* Sidebar */}
        <aside className="sidebar">
          <h2>Live Metrics</h2>

          <div className="metric-card">
            <span>Vehicles</span>
            <strong>{metrics?.vehicle_count ?? "--"}</strong>
          </div>

          <div className="metric-card">
            <span>Total CO₂</span>
            <strong>
              {metrics?.total_co2?.toFixed(2) ?? "--"}
            </strong>
          </div>

          <div className="metric-card">
            <span>Average Wait Time</span>
            <strong>
              {metrics?.average_wait_time?.toFixed(2) ?? "--"}
            </strong>
          </div>

          <div className="metric-card">
            <span>Traffic Status</span>
            <strong>
              {trafficLights.length > 0
                ? trafficLights[0].state
                : "--"}
            </strong>
          </div>
        </aside>

        {/* City Simulation */}
        <section className="simulation-panel">
          <div className="section-header">
            <div>
              <h2>City Simulation</h2>
              <p>
                Live traffic and carbon dispersal visualization
              </p>
            </div>

            <span className="live-badge">LIVE MAP</span>
          </div>

          <div className="map-container">
            <CityMap
              vehicles={vehicles}
              trafficLights={trafficLights}
            />
          </div>

          {/* Simulation Status */}
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
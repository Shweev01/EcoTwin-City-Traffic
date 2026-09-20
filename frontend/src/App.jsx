import { useEffect, useState } from "react";
import CityMap from "./components/CityMap";
import AnalyticsChart from "./components/AnalyticsChart";
import VehicleTable from "./components/VehicleTable";
import { connectWebSocket } from "./services/websocket";
import { normalizeSimulationData } from "./services/simulationData";
import "./App.css";

function App() {
  const [simulationData, setSimulationData] = useState(null);
  const [connectionStatus, setConnectionStatus] =
    useState("Connecting...");
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

          // Keep only the latest 30 points
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

  /*
   * Real SUMO/TraCI traffic-light states can contain
   * multiple characters, for example "GrGr".
   */
  const currentTrafficState =
    trafficLights.length > 0 ? trafficLights[0].state : null;

  const getTrafficStatus = (state) => {
    const signalState = String(state || "").toUpperCase();

    if (!signalState) return "--";

    if (signalState.includes("Y")) return "Yellow";
    if (signalState.includes("G")) return "Green";
    if (signalState.includes("R")) return "Red";

    return "--";
  };

  const trafficStatus = getTrafficStatus(currentTrafficState);

  return (
    <div className="app">

      {/* Header */}
      <header className="app-header">
        <div>
          <h1>EcoTwin</h1>
          <p>Reinforcement Learning for Urban Carbon Dispersal</p>
        </div>

        <div className="connection-status">
          <span
            className={
              connectionStatus === "Simulation Live"
                ? "status-dot status-live"
                : "status-dot"
            }
          ></span>

          <span>{connectionStatus}</span>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="dashboard">

        {/* Live Metrics */}
        <section className="metrics-grid">

          <div className="metric-card">
            <div className="metric-label">
              Vehicles
            </div>

            <div className="metric-value">
              {metrics?.vehicle_count ?? vehicles.length}
            </div>

            <div className="metric-subtitle">
              Active vehicles
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">
              Total CO₂
            </div>

            <div className="metric-value">
              {Number(metrics?.total_co2 ?? 0).toFixed(2)}
            </div>

            <div className="metric-subtitle">
              Real-time emission level
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">
              Average Wait Time
            </div>

            <div className="metric-value">
              {Number(metrics?.average_wait_time ?? 0).toFixed(2)}
            </div>

            <div className="metric-subtitle">
              Average vehicle waiting time
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">
              Traffic Status
            </div>

            <div className="metric-value">
              {trafficStatus}
            </div>

            <div className="metric-subtitle">
              Current signal state
            </div>
          </div>

        </section>

        {/* City Simulation */}
        <section className="simulation-section">

          <div className="section-header">
            <div>
              <h2>City Simulation</h2>

              <p>
                Live traffic and carbon simulation from SUMO
              </p>
            </div>

            <div className="simulation-time">
              Simulation Time:{" "}
              {simulationData?.timestamp ?? "--"}
            </div>
          </div>

          <div className="map-container">
            <CityMap
              vehicles={vehicles}
              trafficLights={trafficLights}
              emissions={emissions}
            />
          </div>

        </section>

        {/* Live Vehicle Data */}
        <VehicleTable vehicles={vehicles} />

        {/* Analytics */}
        <AnalyticsChart data={analyticsData} />

      </main>
    </div>
  );
}

export default App;
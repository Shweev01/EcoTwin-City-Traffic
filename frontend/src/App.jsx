import { useEffect, useRef, useState } from "react";
import "./App.css";

import CityMap from "./components/CityMap";
import AnalyticsChart from "./components/AnalyticsChart";
import VehicleTable from "./components/VehicleTable";
import TrafficLightStatus from "./components/TrafficLightStatus";
import EvaluationReport from "./components/EvaluationReport";

import { connectWebSocket } from "./services/websocket";
import { normalizeSimulationData } from "./services/normalizeSimulationData";

const API_BASE_URL = "";
const READ_ONLY_MODE = import.meta.env.VITE_ECOTWIN_READ_ONLY === "true";

function App() {
  const [simulationData, setSimulationData] = useState({
    timestamp: 0,
    vehicles: [],
    traffic_lights: [],
    emissions: [],
    metrics: {
      total_co2: 0,
      average_wait_time: 0,
      vehicle_count: 0,
    },
    controller: {},
    simulation: {},
  });

  const [analyticsData, setAnalyticsData] = useState([]);
  const [connectionStatus, setConnectionStatus] =
    useState("Connecting");

  const [simulationRunning, setSimulationRunning] =
    useState(true);

  const lastAnalyticsTime = useRef(-1);

  useEffect(() => {
    const handleMessage = (message) => {
      const normalizedData =
        normalizeSimulationData(message);

      setSimulationData(normalizedData);
      setConnectionStatus("Connected");

      const currentTime = Number(
        normalizedData.timestamp || 0
      );

      // Add an analytics point every 0.5 simulation seconds
      if (
        currentTime !== lastAnalyticsTime.current &&
        Math.round(currentTime * 10) % 5 === 0
      ) {
        lastAnalyticsTime.current = currentTime;

        setAnalyticsData((previousData) => {
          const newPoint = {
            time: currentTime,
            total_co2: Number(
              normalizedData.metrics?.total_co2 || 0
            ),
            average_wait_time: Number(
              normalizedData.metrics?.average_wait_time || 0
            ),
            vehicle_count: Number(
              normalizedData.metrics?.vehicle_count || 0
            ),
          };

          return [...previousData, newPoint].slice(-60);
        });
      }
    };

    const handleStatusChange = (status) => {
      if (status === "connected") {
        setConnectionStatus("Connected");
      } else if (status === "disconnected") {
        setConnectionStatus("Reconnecting");
      } else if (status === "error") {
        setConnectionStatus("Disconnected");
      }
    };

    // connectWebSocket returns the cleanup function
    const cleanup = connectWebSocket(
      handleMessage,
      handleStatusChange
    );

    return () => {
      cleanup?.();
    };
  }, []);

  const pauseSimulation = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/simulation/pause`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Pause request failed");
      }

      setSimulationRunning(false);
    } catch (error) {
      console.error(
        "Failed to pause simulation:",
        error
      );
    }
  };

  const resumeSimulation = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/simulation/resume`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Resume request failed");
      }

      setSimulationRunning(true);
    } catch (error) {
      console.error(
        "Failed to resume simulation:",
        error
      );
    }
  };

  const vehicles = simulationData.vehicles || [];
  const trafficLights =
    simulationData.traffic_lights || [];
  const emissions = simulationData.emissions || [];
  const metrics = simulationData.metrics || {};

  const totalCO2 = Number(
    metrics.total_co2 || 0
  );

  const averageWaitTime = Number(
    metrics.average_wait_time || 0
  );

  const vehicleCount = Number(
    metrics.vehicle_count || vehicles.length || 0
  );

  const trafficStatus =
    averageWaitTime > 10
      ? "Heavy"
      : averageWaitTime > 5
      ? "Moderate"
      : "Smooth";

  const simulationTime = Number(
    simulationData.timestamp || 0
  );

  const hours = Math.floor(
    simulationTime / 3600
  );

  const minutes = Math.floor(
    (simulationTime % 3600) / 60
  );

  const seconds = Math.floor(
    simulationTime % 60
  );

  const formattedSimulationTime = [
    hours,
    minutes,
    seconds,
  ]
    .map((value) =>
      String(value).padStart(2, "0")
    )
    .join(":");

  return (
    <div className="app">

      {/* ================= HEADER ================= */}

      <header className="dashboard-header">

        <div className="brand-section">

          <div className="brand-logo">
            EcoTwin
          </div>

          <div className="brand-subtitle">
            Reinforcement Learning for Urban Carbon
            Dispersal
          </div>

        </div>

        <div className="header-right">

          <div className="simulation-live">
            <span className="simulation-live-dot"></span>
            Simulation Live
          </div>

          {READ_ONLY_MODE && <span className="public-read-only-badge">PUBLIC · READ ONLY</span>}

          <div className="header-date">
            May 12, 2025 14:32:18
          </div>

          <div className="settings-icon">
            ⚙
          </div>

        </div>

      </header>

      {/* ================= MAIN ================= */}

      <main className="dashboard-content">

        {/* ================= METRICS ================= */}

        <section className="metrics-grid">

          <div className="metric-card">

            <div className="metric-icon">
              🚗
            </div>

            <div className="metric-content">

              <span className="metric-label">
                Vehicles
              </span>

              <strong className="metric-value">
                {vehicleCount}
              </strong>

              <span className="metric-description">
                Active vehicles
              </span>

            </div>

          </div>

          <div className="metric-card">

            <div className="metric-icon">
              CO₂
            </div>

            <div className="metric-content">

              <span className="metric-label">
                Total CO₂
              </span>

              <strong className="metric-value">
                {totalCO2.toFixed(0)}
              </strong>

              <span className="metric-description">
                mg/s
              </span>

            </div>

          </div>

          <div className="metric-card">

            <div className="metric-icon">
              ⏱
            </div>

            <div className="metric-content">

              <span className="metric-label">
                Average Wait Time
              </span>

              <strong className="metric-value">
                {averageWaitTime.toFixed(1)}s
              </strong>

              <span className="metric-description">
                Per vehicle
              </span>

            </div>

          </div>

          <div className="metric-card">

            <div className="metric-icon">
              🚦
            </div>

            <div className="metric-content">

              <span className="metric-label">
                Traffic Status
              </span>

              <strong className="metric-value">
                {trafficStatus}
              </strong>

              <span className="metric-description">
                Live traffic condition
              </span>

            </div>

          </div>

        </section>

        {/* ================= CITY + VEHICLES ================= */}

        <section className="simulation-layout">

          <div className="city-card">

            <div className="city-card-header">

              <div>

                <h2>
                  City Simulation
                </h2>

                <p>
                  Live SUMO traffic and emission
                  visualization
                </p>

              </div>

              <div className="simulation-controls" hidden={READ_ONLY_MODE}>

                {simulationRunning ? (
                  <button
                    className="simulation-control-button"
                    onClick={pauseSimulation}
                  >
                    ⏸ Pause
                  </button>
                ) : (
                  <button
                    className="simulation-control-button"
                    onClick={resumeSimulation}
                  >
                    ▶ Resume
                  </button>
                )}

              </div>

            </div>

            <div className="map-area">

              <CityMap
                vehicles={vehicles}
                trafficLights={trafficLights}
                emissions={emissions}
              />

              <div className="map-overlay-time">

                Simulation Time:{" "}

                <strong>
                  {formattedSimulationTime}
                </strong>

              </div>

            </div>

            <div className="map-footer">

              <div className="map-legend">

                <span className="legend-item">
                  <span className="legend-dot vehicle-dot"></span>
                  Vehicle
                </span>

                <span className="legend-item">
                  <span className="legend-dot green-dot"></span>
                  Green
                </span>

                <span className="legend-item">
                  <span className="legend-dot yellow-dot"></span>
                  Yellow
                </span>

                <span className="legend-item">
                  <span className="legend-dot red-dot"></span>
                  Red
                </span>

                <span className="legend-item">
                  <span className="legend-gradient"></span>
                  CO₂ Hotspot
                </span>

              </div>

              <div className="map-status">

                <span className="status-dot"></span>

                {connectionStatus}

              </div>

            </div>

          </div>

          {/* ================= VEHICLE TABLE ================= */}

          <div className="vehicle-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Live Vehicle Data
                </h2>

                <p>
                  Real-time vehicle telemetry
                </p>

              </div>

              <span className="vehicle-count-badge">
                {vehicles.length}
              </span>

            </div>

            <VehicleTable
              vehicles={vehicles}
            />

          </div>

        </section>

        {/* ================= CO2 HOTSPOTS ================= */}

        <section className="hotspot-panel">

          <div className="panel-header">

            <div>

              <h2>
                CO₂ Emission Hotspots
              </h2>

              <p>
                Current emission concentration
                across the city
              </p>

            </div>

            <span className="hotspot-live">
              LIVE
            </span>

          </div>

          <div className="hotspot-grid">

            {emissions.length === 0 ? (

              <div className="hotspot-empty">
                Waiting for emission data...
              </div>

            ) : (

              emissions
                .slice()
                .sort(
                  (a, b) =>
                    Number(b.co2 || 0) -
                    Number(a.co2 || 0)
                )
                .slice(0, 5)
                .map((emission, index) => (

                  <div
                    className="hotspot-card"
                    key={`${emission.x}-${emission.y}-${index}`}
                  >

                    <span className="hotspot-rank">
                      #{index + 1}
                    </span>

                    <div>

                      <span className="hotspot-label">
                        Emission Point
                      </span>

                      <strong>
                        {Number(
                          emission.co2 || 0
                        ).toFixed(0)}{" "}
                        mg/s
                      </strong>

                    </div>

                  </div>

                ))

            )}

          </div>

        </section>

        {/* ================= BOTTOM GRID ================= */}

        <section className="bottom-grid">

          {/* Analytics */}

          <div className="analytics-panel">

            <div className="chart-wrapper analytics-chart-wrapper">

              <div className="analytics-chart-container">

                <AnalyticsChart
                  data={analyticsData}
                />

              </div>

            </div>

          </div>

          {/* System Status */}

          <div className="system-panel">

            <div className="panel-header">

              <div>

                <h2>
                  System Status
                </h2>

                <p>
                  EcoTwin simulation services
                </p>

              </div>

              <span className="system-status-online">
                ONLINE
              </span>

            </div>

            <div className="system-status-list">

              <div className="system-status-row">

                <span>
                  SUMO Simulation
                </span>

                <span className="system-online">
                  ● Running
                </span>

              </div>

              <div className="system-status-row">

                <span>
                  TraCI Connection
                </span>

                <span className="system-online">
                  ● Connected
                </span>

              </div>

              <div className="system-status-row">

                <span>
                  FastAPI Backend
                </span>

                <span className="system-online">
                  ● Connected
                </span>

              </div>

              <div className="system-status-row">

                <span>
                  WebSocket
                </span>

                <span
                  className={
                    connectionStatus === "Connected"
                      ? "system-online"
                      : "system-warning"
                  }
                >
                  ● {connectionStatus}
                </span>

              </div>

              <div className="system-status-row">

                <span>
                  Traffic Controller
                </span>

                <span className={
                  simulationData.controller?.mode === "ppo"
                    ? "system-online"
                    : "system-warning"
                }>
                  ● {simulationData.controller?.mode === "ppo" ? "PPO Active" : "Static Baseline"}
                </span>

              </div>

              <div className="system-status-row">

                <span>
                  Latest RL phase requests
                </span>

                <span className="system-online">
                  {simulationData.controller?.phase_changes?.length
                    ? simulationData.controller.phase_changes.join(", ")
                    : "—"}
                </span>

              </div>

              <div className="system-status-row">

                <span>
                  Traffic Lights
                </span>

                <span className="system-online">
                  ● {trafficLights.length} Active
                </span>

              </div>

            </div>

          </div>

          {/* Traffic Light Status */}

          <TrafficLightStatus
            trafficLights={trafficLights}
          />

        </section>

        <EvaluationReport />

      </main>

    </div>
  );
}

export default App;

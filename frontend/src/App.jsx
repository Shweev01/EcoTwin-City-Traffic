import "./App.css";

function App() {
  return (
    <div className="dashboard">
      <header className="header">
        <div>
          <h1>EcoTwin</h1>
          <p>Reinforcement Learning for Urban Carbon Dispersal</p>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          Simulation Offline
        </div>
      </header>

      <main className="dashboard-content">

        <aside className="sidebar">
          <h2>Live Metrics</h2>

          <div className="metric-card">
            <span>Vehicles</span>
            <strong>--</strong>
          </div>

          <div className="metric-card">
            <span>Total CO₂</span>
            <strong>--</strong>
          </div>

          <div className="metric-card">
            <span>Average Wait Time</span>
            <strong>--</strong>
          </div>

          <div className="metric-card">
            <span>Traffic Status</span>
            <strong>Waiting</strong>
          </div>
        </aside>

        <section className="map-section">
          <div className="map-header">
            <h2>City Simulation</h2>
            <span>Live Map</span>
          </div>

          <div className="map-container">
            <div className="city-grid">
              <div className="road horizontal road-1"></div>
              <div className="road horizontal road-2"></div>
              <div className="road horizontal road-3"></div>

              <div className="road vertical road-4"></div>
              <div className="road vertical road-5"></div>
              <div className="road vertical road-6"></div>
            </div>

            <div className="map-message">
              <h3>EcoTwin City Grid</h3>
              <p>Live simulation data will appear here.</p>
            </div>
          </div>
        </section>

      </main>

      <section className="bottom-panel">
        <h2>Simulation Status</h2>
        <p>
          Waiting for simulation and WebSocket data...
        </p>
      </section>
    </div>
  );
}

export default App;
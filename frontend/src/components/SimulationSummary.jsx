function SimulationSummary({
  simulationData,
  vehicles = [],
  trafficLights = [],
  emissions = [],
}) {
  const simulationTime =
    Number(simulationData?.timestamp ?? 0);

  const isLive =
    simulationData !== null &&
    simulationData !== undefined;

  return (
    <section className="summary-section">

      {/* ================= HEADER ================= */}

      <div className="section-header">

        <div>
          <h2>Simulation Summary</h2>

          <p>
            Current state of the EcoTwin
            traffic environment
          </p>
        </div>

        <div
          className={`summary-status ${
            isLive
              ? "summary-status-live"
              : "summary-status-waiting"
          }`}
        >
          <span className="summary-status-dot"></span>

          {isLive
            ? "Simulation Active"
            : "Waiting for Data"}
        </div>

      </div>


      {/* ================= SUMMARY CARDS ================= */}

      <div className="summary-grid">

        {/* Vehicles */}

        <div className="summary-card">

          <div className="summary-icon">
            🚗
          </div>

          <div className="summary-content">

            <span className="summary-label">
              Active Vehicles
            </span>

            <strong className="summary-value">
              {vehicles.length}
            </strong>

          </div>

        </div>


        {/* Traffic Lights */}

        <div className="summary-card">

          <div className="summary-icon">
            🚦
          </div>

          <div className="summary-content">

            <span className="summary-label">
              Traffic Lights
            </span>

            <strong className="summary-value">
              {trafficLights.length}
            </strong>

          </div>

        </div>


        {/* Emission Points */}

        <div className="summary-card">

          <div className="summary-icon">
            🌫️
          </div>

          <div className="summary-content">

            <span className="summary-label">
              Emission Points
            </span>

            <strong className="summary-value">
              {emissions.length}
            </strong>

          </div>

        </div>


        {/* Simulation Time */}

        <div className="summary-card">

          <div className="summary-icon">
            ⏱️
          </div>

          <div className="summary-content">

            <span className="summary-label">
              Simulation Time
            </span>

            <strong className="summary-value">
              {simulationTime.toFixed(1)} s
            </strong>

          </div>

        </div>

      </div>

    </section>
  );
}

export default SimulationSummary;
function getStatus(light) {
  const state = String(light?.state ?? "r").toLowerCase();

  if (state.includes("y")) {
    return {
      label: "YELLOW",
      className: "traffic-status-yellow",
    };
  }

  if (state.includes("g")) {
    return {
      label: "GREEN",
      className: "traffic-status-green",
    };
  }

  return {
    label: "RED",
    className: "traffic-status-red",
  };
}

function TrafficLightStatus({ trafficLights = [] }) {
  return (
    <section className="traffic-light-status-panel">
      <div className="section-header">
        <div>
          <h2>Traffic Light Status</h2>
          <p>Live SUMO intersection states</p>
        </div>

        <span className="live-badge">
          <span className="live-dot"></span>
          LIVE
        </span>
      </div>

      <div className="traffic-light-list">
        {trafficLights.length === 0 ? (
          <div className="traffic-light-empty">
            Waiting for traffic-light data...
          </div>
        ) : (
          trafficLights.map((light) => {
            const status = getStatus(light);

            return (
              <div
                className="traffic-light-row"
                key={light.id}
              >
                <div className="traffic-light-id">
                  <span
                    className={`traffic-light-indicator ${status.className}`}
                  ></span>

                  <strong>{light.id}</strong>
                </div>

                <span
                  className={`traffic-light-status ${status.className}`}
                >
                  {status.label}
                </span>

                <span className="traffic-light-phase">
                  Phase {light.phase ?? 0}
                </span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default TrafficLightStatus;
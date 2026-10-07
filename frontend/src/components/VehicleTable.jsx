function VehicleTable({ vehicles = [] }) {
  const getVehicleStatus = (speed) => {
    const numericSpeed = Number(speed) || 0;

    if (numericSpeed === 0) {
      return {
        label: "Stopped",
        className: "vehicle-status-stopped",
      };
    }

    if (numericSpeed < 5) {
      return {
        label: "Slow",
        className: "vehicle-status-slow",
      };
    }

    return {
      label: "Moving",
      className: "vehicle-status-moving",
    };
  };

  return (
    <section className="vehicle-table-section">

      {/* ================= HEADER ================= */}

      <div className="section-header">

        <div>
          <h2>Live Vehicle Data</h2>

          <p>
            Real-time vehicle movement from
            the simulation
          </p>
        </div>

        <div className="vehicle-live-status">
          <span className="vehicle-live-dot"></span>
          {vehicles.length} Active Vehicles
        </div>

      </div>


      {/* ================= TABLE ================= */}

      {vehicles.length === 0 ? (
        <div className="vehicle-empty-state">

          <div className="vehicle-empty-icon">
            🚗
          </div>

          <h3>No vehicle data available</h3>

          <p>
            Vehicle information will appear
            when the simulation is running.
          </p>

        </div>
      ) : (
        <div className="vehicle-table-wrapper">

          <table className="vehicle-table">

            <thead>
              <tr>
                <th>Vehicle ID</th>
                <th>Speed</th>
                <th>Waiting Time</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {vehicles.map((vehicle, index) => {
                const speed =
                  Number(vehicle.speed) || 0;

                const waitingTime =
                  Number(
                    vehicle.waiting_time
                  ) || 0;

                const status =
                  getVehicleStatus(speed);

                return (
                  <tr
                    key={
                      vehicle.id ||
                      `vehicle-${index}`
                    }
                  >

                    <td>
                      <strong>
                        {vehicle.id ||
                          `Vehicle ${index + 1}`}
                      </strong>
                    </td>

                    <td>
                      {speed.toFixed(2)} m/s
                    </td>

                    <td>
                      {waitingTime.toFixed(2)} s
                    </td>

                    <td>
                      <span
                        className={`vehicle-status-badge ${status.className}`}
                      >
                        <span className="vehicle-status-dot"></span>
                        {status.label}
                      </span>
                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>

        </div>
      )}

    </section>
  );
}

export default VehicleTable;
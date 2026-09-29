function VehicleTable({ vehicles = [] }) {
  const getVehicleStatus = (speed) => {
    const vehicleSpeed = Number(speed);

    if (vehicleSpeed === 0) {
      return "Stopped";
    }

    if (vehicleSpeed <= 5) {
      return "Slow";
    }

    return "Moving";
  };

  return (
    <div className="vehicle-table-section">
      <div className="vehicle-table-header">
        <div>
          <h3>Live Vehicle Data</h3>
          <p>Real-time vehicle information received from the simulation</p>
        </div>

        <span className="vehicle-count">
          {vehicles.length} vehicles
        </span>
      </div>

      {vehicles.length === 0 ? (
        <div className="vehicle-table-empty">
          No vehicle data available.
        </div>
      ) : (
        <div className="vehicle-table-wrapper">
          <table className="vehicle-table">
            <thead>
              <tr>
                <th>Vehicle ID</th>
                <th>X</th>
                <th>Y</th>
                <th>Speed</th>
                <th>Waiting Time</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {vehicles.map((vehicle) => {
                const status = getVehicleStatus(vehicle.speed);

                return (
                  <tr key={vehicle.id}>
                    <td>{vehicle.id}</td>

                    <td>
                      {Number(vehicle.x).toFixed(2)}
                    </td>

                    <td>
                      {Number(vehicle.y).toFixed(2)}
                    </td>

                    <td>
                      {Number(vehicle.speed).toFixed(2)} m/s
                    </td>

                    <td>
                      {Number(vehicle.waiting_time).toFixed(2)} s
                    </td>

                    <td>
                      <span
                        className={`vehicle-status vehicle-status-${status.toLowerCase()}`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default VehicleTable;
function VehicleTable({ vehicles = [] }) {
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
              </tr>
            </thead>

            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>{vehicle.id}</td>
                  <td>{Number(vehicle.x).toFixed(2)}</td>
                  <td>{Number(vehicle.y).toFixed(2)}</td>
                  <td>{Number(vehicle.speed).toFixed(2)} m/s</td>
                  <td>{Number(vehicle.waiting_time).toFixed(2)} s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default VehicleTable;
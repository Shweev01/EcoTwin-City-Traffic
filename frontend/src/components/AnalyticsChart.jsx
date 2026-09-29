import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function AnalyticsChart({ data = [] }) {
  return (
    <div className="analytics-chart">
      <div className="analytics-header">
        <div>
          <h3>Simulation Analytics</h3>

          <p>
            Live CO₂ emissions, waiting time and vehicle count
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="chart-empty">
          <p>Waiting for simulation data...</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 10,
              bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="time"
              label={{
                value: "Simulation Time",
                position: "insideBottom",
                offset: -5,
              }}
            />

            {/* CO₂ axis */}
            <YAxis
              yAxisId="co2"
              label={{
                value: "Total CO₂",
                angle: -90,
                position: "insideLeft",
              }}
            />

            {/* Waiting-time axis */}
            <YAxis
              yAxisId="wait"
              orientation="right"
              label={{
                value: "Wait Time (s)",
                angle: 90,
                position: "insideRight",
              }}
            />

            {/* Vehicle-count axis */}
            <YAxis
              yAxisId="vehicles"
              orientation="right"
              hide={true}
            />

            <Tooltip />
            <Legend />

            {/* Total CO₂ */}
            <Line
              yAxisId="co2"
              type="monotone"
              dataKey="total_co2"
              name="Total CO₂"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
            />

            {/* Average waiting time */}
            <Line
              yAxisId="wait"
              type="monotone"
              dataKey="average_wait_time"
              name="Average Wait Time"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
            />

            {/* Vehicle count */}
            <Line
              yAxisId="vehicles"
              type="monotone"
              dataKey="vehicle_count"
              name="Vehicle Count"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default AnalyticsChart;
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
          <p>Live CO₂ emissions and average waiting time</p>
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
              right: 20,
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

            <YAxis />

            <Tooltip />

            <Legend />

            <Line
              type="monotone"
              dataKey="total_co2"
              name="Total CO₂"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="average_wait_time"
              name="Average Wait Time"
              stroke="#f59e0b"
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
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

            <Tooltip />
            <Legend />

            <Line
              yAxisId="co2"
              type="monotone"
              dataKey="total_co2"
              name="Total CO₂"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
            />

            <Line
              yAxisId="wait"
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
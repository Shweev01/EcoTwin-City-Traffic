import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function AnalyticsChart({ data = [] }) {
  const hasData = data.length > 0;

  return (
    <section className="analytics-section">

      {/* ================= HEADER ================= */}

      <div className="section-header">

        <div>
          <h2>Simulation Analytics</h2>

          <p>
            Real-time traffic, waiting time and
            CO₂ emission trends
          </p>
        </div>

        <div className="analytics-live-status">
          <span className="analytics-live-dot"></span>
          Live Analytics
        </div>

      </div>


      {/* ================= CHART ================= */}

      <div className="analytics-chart-container">

        {!hasData ? (
          <div className="analytics-empty-state">

            <div className="analytics-empty-icon">
              📊
            </div>

            <h3>Waiting for simulation data</h3>

            <p>
              Analytics will appear when the
              simulation starts sending live data.
            </p>

          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={320}
          >
            <LineChart
              data={data}
              margin={{
                top: 15,
                right: 25,
                left: 10,
                bottom: 20,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                opacity={0.25}
              />

              <XAxis
                dataKey="time"
                tickFormatter={(value) =>
                  `${Number(value).toFixed(1)}s`
                }
                tick={{ fontSize: 10 }}
                label={{
                  value: "Simulation Time",
                  position: "insideBottom",
                  offset: -10,
                  fontSize: 10,
                }}
              />

              <YAxis
                allowDecimals={true}
                tick={{ fontSize: 10 }}
              />

              <Tooltip
                formatter={(value, name) => {
                  const labels = {
                    total_co2: "Total CO₂",
                    average_wait_time:
                      "Average Wait Time",
                    vehicle_count:
                      "Vehicle Count",
                  };

                  return [
                    Number(value).toFixed(2),
                    labels[name] || name,
                  ];
                }}
                labelFormatter={(value) =>
                  `Simulation Time: ${Number(
                    value
                  ).toFixed(2)} s`
                }
              />

              <Legend
                wrapperStyle={{
                  fontSize: "10px",
                  paddingTop: "5px",
                }}
              />

              {/* CO₂ */}

              <Line
                type="monotone"
                dataKey="total_co2"
                name="Total CO₂"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />

              {/* Waiting time */}

              <Line
                type="monotone"
                dataKey="average_wait_time"
                name="Average Wait Time"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />

              {/* Vehicle count */}

              <Line
                type="monotone"
                dataKey="vehicle_count"
                name="Vehicle Count"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />

            </LineChart>
          </ResponsiveContainer>
        )}

      </div>

    </section>
  );
}

export default AnalyticsChart;
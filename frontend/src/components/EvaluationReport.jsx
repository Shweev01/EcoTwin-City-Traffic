import evaluation from "../../../rl_agent/evaluation/summary.json";
import "./EvaluationReport.css";

const baseline = evaluation.mean.baseline;
const ppo = evaluation.mean.ppo;
const changePercent = (before, after) => ((after - before) / before) * 100;
const signedPercent = (value) => `${value < 0 ? "−" : "+"}${Math.abs(value).toFixed(1)}%`;

const rows = [
  {
    label: "Average waiting time",
    unit: "s / vehicle",
    before: baseline.average_wait_time_s.toFixed(2),
    after: ppo.average_wait_time_s.toFixed(2),
    change: changePercent(baseline.average_wait_time_s, ppo.average_wait_time_s),
  },
  {
    label: "Total CO₂ emissions",
    unit: "million mg / episode",
    before: (baseline.total_co2_mg / 1_000_000).toFixed(2),
    after: (ppo.total_co2_mg / 1_000_000).toFixed(2),
    change: changePercent(baseline.total_co2_mg, ppo.total_co2_mg),
  },
  {
    label: "Average queue",
    unit: "vehicles / lane",
    before: baseline.average_queue_vehicles_per_lane.toFixed(3),
    after: ppo.average_queue_vehicles_per_lane.toFixed(3),
    change: changePercent(baseline.average_queue_vehicles_per_lane, ppo.average_queue_vehicles_per_lane),
  },
  {
    label: "Throughput",
    unit: "completed vehicles / episode",
    before: baseline.throughput_vehicles.toFixed(1),
    after: ppo.throughput_vehicles.toFixed(1),
    change: changePercent(baseline.throughput_vehicles, ppo.throughput_vehicles),
  },
];

function EvaluationReport() {
  return (
    <section className="evaluation-report" aria-labelledby="evaluation-title">
      <div className="evaluation-report-header">
        <div>
          <span className="evaluation-kicker">PAIRED SUMO EVALUATION</span>
          <h2 id="evaluation-title">Static control vs PPO</h2>
          <p>Mean results from {evaluation.episodes} matched-seed episodes, each simulating 300 seconds.</p>
        </div>
        <span className="evaluation-badge">Seeds 101–105</span>
      </div>

      <div className="evaluation-table-wrap">
        <table className="evaluation-table">
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">Static baseline</th>
              <th scope="col">PPO controller</th>
              <th scope="col">Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">
                  {row.label}
                  <span className="evaluation-unit">{row.unit}</span>
                </th>
                <td>{row.before}</td>
                <td className="evaluation-ppo-value">{row.after}</td>
                <td className={row.change <= 0 ? "evaluation-change" : "evaluation-change evaluation-change-negative"}>
                  {signedPercent(row.change)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="evaluation-caveat">
        <strong>A trade-off, not a uniform win.</strong>
        <span>
          PPO lowered average waiting time, queue, and CO₂ in these five runs, while mean throughput also fell.
          Seed 105 was a PPO regression. Treat these short-run results as preliminary, not as statistical proof.
        </span>
      </div>

      <div className="evaluation-links">
        <a href="/evaluation/results.md">Methodology and detailed results</a>
        <a href="/evaluation/baseline_vs_ppo.csv" download>Download paired-episode CSV</a>
      </div>
    </section>
  );
}

export default EvaluationReport;

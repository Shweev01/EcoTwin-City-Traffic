function DashboardFooter() {
  return (
    <footer className="dashboard-footer">

      <div className="footer-left">
        <strong>EcoTwin</strong>

        <span>
          Reinforcement Learning for Urban
          Carbon Dispersal
        </span>
      </div>

      <div className="footer-center">
        SUMO · FastAPI · WebSocket · React
      </div>

      <div className="footer-right">
        <span className="footer-live-dot"></span>
        Live Simulation Dashboard
      </div>

    </footer>
  );
}

export default DashboardFooter;
function SystemArchitecture() {
  const pipeline = [
    {
      number: "01",
      title: "SUMO",
      subtitle: "Traffic Simulation",
      description:
        "Generates vehicles, traffic lights and emission data.",
    },
    {
      number: "02",
      title: "FastAPI",
      subtitle: "Data API",
      description:
        "Processes and exposes live simulation data.",
    },
    {
      number: "03",
      title: "WebSocket",
      subtitle: "Real-Time Stream",
      description:
        "Sends continuous simulation updates to the dashboard.",
    },
    {
      number: "04",
      title: "React",
      subtitle: "City Dashboard",
      description:
        "Visualizes traffic, pollution and analytics in real time.",
    },
  ];

  return (
    <section className="architecture-section">

      {/* ================= HEADER ================= */}

      <div className="section-header">

        <div>
          <h2>EcoTwin System Architecture</h2>

          <p>
            Real-time data flow from simulation
            to the city dashboard
          </p>
        </div>

        <div className="architecture-status">
          <span className="architecture-status-dot"></span>
          Live Data Pipeline
        </div>

      </div>


      {/* ================= PIPELINE ================= */}

      <div className="architecture-pipeline">

        {pipeline.map((item, index) => (
          <div
            className="architecture-item"
            key={item.number}
          >

            <div className="architecture-card">

              <div className="architecture-number">
                {item.number}
              </div>

              <div className="architecture-content">

                <h3>{item.title}</h3>

                <span>
                  {item.subtitle}
                </span>

                <p>
                  {item.description}
                </p>

              </div>

            </div>


            {/* Connector */}

            {index < pipeline.length - 1 && (
              <div className="architecture-arrow">
                →
              </div>
            )}

          </div>
        ))}

      </div>

    </section>
  );
}

export default SystemArchitecture;
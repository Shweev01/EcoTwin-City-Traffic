export function normalizeSimulationData(data) {
  return {
    type: data?.type || "simulation_update",
    timestamp: data?.timestamp ?? 0,

    vehicles: Array.isArray(data?.vehicles)
      ? data.vehicles
      : [],

    trafficLights: Array.isArray(data?.traffic_lights)
      ? data.traffic_lights
      : [],

    emissions: Array.isArray(data?.emissions)
      ? data.emissions
      : [],

    metrics: data?.metrics || {
      total_co2: 0,
      average_wait_time: 0,
      vehicle_count: 0,
    },
  };
}
export function normalizeSimulationData(data) {
  if (!data) {
    return {
      timestamp: 0,
      vehicles: [],
      traffic_lights: [],
      emissions: [],
      metrics: {
        total_co2: 0,
        average_wait_time: 0,
        vehicle_count: 0,
      },
      controller: {},
      simulation: {},
    };
  }

  return {
    timestamp: Number(data.timestamp || 0),

    vehicles: Array.isArray(data.vehicles)
      ? data.vehicles
      : [],

    traffic_lights: Array.isArray(data.traffic_lights)
      ? data.traffic_lights
      : [],

    emissions: Array.isArray(data.emissions)
      ? data.emissions
      : [],

    metrics: {
      total_co2: Number(
        data.metrics?.total_co2 || 0
      ),

      average_wait_time: Number(
        data.metrics?.average_wait_time || 0
      ),

      vehicle_count: Number(
        data.metrics?.vehicle_count ??
          data.vehicles?.length ??
          0
      ),
    },
    controller: data.controller || {},
    simulation: data.simulation || {},
  };
}

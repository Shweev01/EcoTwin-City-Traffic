import { useEffect, useRef } from "react";
import {
  MapContainer,
  CircleMarker,
  Popup,
  Rectangle,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";


function MapUpdater({ vehicles = [], emissions = [] }) {
  const map = useMap();
  const hasFittedMap = useRef(false);

  useEffect(() => {
    if (hasFittedMap.current) return;

    const points = [
      ...vehicles
        .filter((v) => v.x != null && v.y != null)
        .map((v) => [v.y, v.x]),

      ...emissions
        .filter((e) => e.x != null && e.y != null)
        .map((e) => [e.y, e.x]),
    ];

    if (points.length > 0) {
      map.fitBounds(points, {
        padding: [30, 30],
        maxZoom: 2,
      });

      hasFittedMap.current = true;
    }
  }, [map, vehicles, emissions]);

  return null;
}


/*
 * Dynamic CO₂ heatmap
 *
 * Uses the real emissions received from:
 * SUMO → TraCI → FastAPI → WebSocket → React
 */
function PollutionHeatmap({ emissions = [] }) {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!heatLayerRef.current) {
      heatLayerRef.current = L.heatLayer([], {
        radius: 35,
        blur: 25,
        maxZoom: 2,
        minOpacity: 0.35,
        max: 0.85,
        gradient: {
          0.2: "green",
          0.45: "yellow",
          0.7: "orange",
          1.0: "red",
        },
      }).addTo(map);
    }

    const validEmissions = emissions.filter(
      (emission) =>
        emission.x != null &&
        emission.y != null &&
        Number(emission.co2) >= 0
    );

    if (validEmissions.length === 0) {
      heatLayerRef.current.setLatLngs([]);
      return;
    }

    const co2Values = validEmissions.map(
      (emission) => Number(emission.co2) || 0
    );

    const maxCO2 = Math.max(...co2Values, 1);

    const heatPoints = validEmissions.map((emission) => {
      const co2 = Number(emission.co2) || 0;

      /*
       * Normalize CO₂ so the strongest current emission
       * becomes the hottest point on the map.
       */
      const intensity = Math.min(co2 / maxCO2, 1);

      return [
        Number(emission.y),
        Number(emission.x),
        intensity,
      ];
    });

    heatLayerRef.current.setLatLngs(heatPoints);
  }, [map, emissions]);

  useEffect(() => {
    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map]);

  return null;
}


function CityMap({
  vehicles = [],
  trafficLights = [],
  emissions = [],
}) {
  const mapBounds = [
    [0, 0],
    [420, 420],
  ];

  const roads = [
    [[70, 0], [70, 420]],
    [[210, 0], [210, 420]],
    [[350, 0], [350, 420]],
    [[0, 70], [420, 70]],
    [[0, 210], [420, 210]],
    [[0, 350], [420, 350]],
  ];

  const intersections = [
    [70, 70],
    [70, 210],
    [70, 350],
    [210, 70],
    [210, 210],
    [210, 350],
    [350, 70],
    [350, 210],
    [350, 350],
  ];

  const getVehicleColor = (speed) => {
    if (speed === 0) return "red";
    if (speed < 5) return "orange";
    return "blue";
  };

  // TraCI may return values such as:
  // "G", "Y", "r", "GrGr", "GrrG", etc.
  const getTrafficLightColor = (state) => {
    const signalState = String(state || "").toUpperCase();

    if (signalState.includes("G")) {
      return "green";
    }

    if (signalState.includes("Y")) {
      return "orange";
    }

    return "red";
  };

  // CO₂ intensity based on real emission values
  const getEmissionStyle = (co2) => {
    if (co2 >= 80) {
      return {
        intensity: "High",
        color: "red",
        radius: 28,
        fillOpacity: 0.55,
        weight: 2,
      };
    }

    if (co2 >= 40) {
      return {
        intensity: "Moderate",
        color: "orange",
        radius: 22,
        fillOpacity: 0.45,
        weight: 1.5,
      };
    }

    return {
      intensity: "Low",
      color: "green",
      radius: 16,
      fillOpacity: 0.35,
      weight: 1,
    };
  };

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={mapBounds}
      style={{
        height: "100%",
        width: "100%",
      }}
    >
      <MapUpdater
        vehicles={vehicles}
        emissions={emissions}
      />

      <PollutionHeatmap emissions={emissions} />

      {/* City boundary */}
      <Rectangle
        bounds={mapBounds}
        pathOptions={{
          color: "#555",
          weight: 1,
          fillOpacity: 0,
        }}
      />

      {/* Roads */}
      {roads.map((road, index) => (
        <Polyline
          key={`road-${index}`}
          positions={road}
          pathOptions={{
            color: "#64748b",
            weight: 18,
            opacity: 0.8,
          }}
        />
      ))}

      {/* Road center lines */}
      {roads.map((road, index) => (
        <Polyline
          key={`road-center-${index}`}
          positions={road}
          pathOptions={{
            color: "#cbd5e1",
            weight: 2,
            opacity: 0.8,
            dashArray: "8 8",
          }}
        />
      ))}

      {/* Intersections */}
      {intersections.map((intersection, index) => (
        <CircleMarker
          key={`intersection-${index}`}
          center={[
            intersection[1],
            intersection[0],
          ]}
          radius={10}
          pathOptions={{
            color: "#475569",
            fillColor: "#94a3b8",
            fillOpacity: 0.9,
            weight: 2,
          }}
        >
          <Popup>
            <strong>
              Intersection J{index + 1}
            </strong>
            <br />
            City traffic junction
          </Popup>
        </CircleMarker>
      ))}

      {/* Live vehicles */}
      {vehicles.map((vehicle) => {
        if (
          vehicle.x == null ||
          vehicle.y == null
        ) {
          return null;
        }

        const vehicleColor = getVehicleColor(
          Number(vehicle.speed)
        );

        return (
          <CircleMarker
            key={vehicle.id}
            center={[
              vehicle.y,
              vehicle.x,
            ]}
            radius={6}
            pathOptions={{
              color: vehicleColor,
              fillColor: vehicleColor,
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <strong>
                Vehicle {vehicle.id}
              </strong>
              <br />
              Speed:{" "}
              {Number(vehicle.speed).toFixed(2)} m/s
              <br />
              Waiting Time:{" "}
              {Number(vehicle.waiting_time).toFixed(2)} s
            </Popup>
          </CircleMarker>
        );
      })}

      {/* Real-time CO₂ emission points */}
      {emissions.map((emission, index) => {
        if (
          emission.x == null ||
          emission.y == null
        ) {
          return null;
        }

        const co2 = Number(emission.co2) || 0;
        const emissionStyle =
          getEmissionStyle(co2);

        return (
          <CircleMarker
            key={`emission-${index}`}
            center={[
              emission.y,
              emission.x,
            ]}
            radius={emissionStyle.radius}
            pathOptions={{
              color: emissionStyle.color,
              fillColor: emissionStyle.color,
              fillOpacity:
                emissionStyle.fillOpacity,
              weight: emissionStyle.weight,
            }}
          >
            <Popup>
              <strong>
                CO₂ Pollution Point
              </strong>
              <br />
              X: {Number(emission.x).toFixed(2)}
              <br />
              Y: {Number(emission.y).toFixed(2)}
              <br />
              CO₂: {co2.toFixed(2)}
              <br />
              Intensity:{" "}
              {emissionStyle.intensity}
            </Popup>
          </CircleMarker>
        );
      })}

      {/* Real-time traffic lights */}
      {trafficLights.map((light) => {
        const lightPosition =
          light.x != null &&
          light.y != null
            ? [light.y, light.x]
            : [100, 150];

        const lightColor =
          getTrafficLightColor(light.state);

        return (
          <CircleMarker
            key={light.id}
            center={lightPosition}
            radius={8}
            pathOptions={{
              color: lightColor,
              fillColor: lightColor,
              fillOpacity: 1,
              weight: 2,
            }}
          >
            <Popup>
              <strong>
                Traffic Light {light.id}
              </strong>
              <br />
              State: {light.state}
              <br />
              Phase: {light.phase}
            </Popup>
          </CircleMarker>
        );
      })}

      {/* Map legend */}
      <div
        className="map-legend"
        style={{
          position: "absolute",
          bottom: "15px",
          right: "15px",
          zIndex: 1000,
          background: "white",
          color: "#111827",
          padding: "12px",
          borderRadius: "6px",
          fontSize: "12px",
          lineHeight: "1.6",
          boxShadow:
            "0 1px 5px rgba(0,0,0,.3)",
        }}
      >
        <strong>Map Legend</strong>

        <div>🔵 Moving Vehicle</div>
        <div>🟠 Slow Vehicle</div>
        <div>🔴 Stopped Vehicle</div>

        <div>🟢 Green Light</div>
        <div>🟡 Yellow Light</div>
        <div>🔴 Red Light</div>

        <div>⚪ Intersection</div>

        <hr
          style={{
            border: "none",
            borderTop:
              "1px solid #ddd",
            margin: "8px 0",
          }}
        />

        <strong>
          CO₂ Pollution Heatmap
        </strong>

        <div>🟢 Low</div>
        <div>🟡 Moderate</div>
        <div>🟠 Elevated</div>
        <div>🔴 High</div>

        <hr
          style={{
            border: "none",
            borderTop:
              "1px solid #ddd",
            margin: "8px 0",
          }}
        />

        <strong>CO₂ Point Intensity</strong>

        <div>🟢 Low (&lt; 40)</div>
        <div>
          🟠 Moderate (40–79.99)
        </div>
        <div>🔴 High (≥ 80)</div>
      </div>
    </MapContainer>
  );
}

export default CityMap;
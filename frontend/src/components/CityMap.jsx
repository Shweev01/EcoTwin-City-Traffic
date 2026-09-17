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

function MapUpdater({ vehicles = [], emissions = [] }) {
  const map = useMap();
  const hasFittedMap = useRef(false);

  useEffect(() => {
    if (hasFittedMap.current) {
      return;
    }

    const points = [
      ...vehicles
        .filter(
          (vehicle) => vehicle.x != null && vehicle.y != null
        )
        .map((vehicle) => [vehicle.y, vehicle.x]),

      ...emissions
        .filter(
          (emission) => emission.x != null && emission.y != null
        )
        .map((emission) => [emission.y, emission.x]),
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

function CityMap({
  vehicles = [],
  trafficLights = [],
  emissions = [],
}) {
  const mapBounds = [
    [0, 0],
    [420, 420],
  ];

  // --------------------------------------------------
  // CITY ROAD NETWORK
  // --------------------------------------------------

  const roads = [
    // Horizontal roads
    [
      [70, 0],
      [70, 420],
    ],
    [
      [210, 0],
      [210, 420],
    ],
    [
      [350, 0],
      [350, 420],
    ],

    // Vertical roads
    [
      [0, 70],
      [420, 70],
    ],
    [
      [0, 210],
      [420, 210],
    ],
    [
      [0, 350],
      [420, 350],
    ],
  ];

  // --------------------------------------------------
  // INTERSECTIONS
  // --------------------------------------------------

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

  // --------------------------------------------------
  // VEHICLE COLORS
  // --------------------------------------------------

  const getVehicleColor = (speed) => {
    if (speed === 0) return "red";
    if (speed < 5) return "orange";
    return "blue";
  };

  // --------------------------------------------------
  // TRAFFIC LIGHT COLORS
  // --------------------------------------------------

  const getTrafficLightColor = (state) => {
    if (state === "G") return "green";
    if (state === "Y") return "orange";
    return "red";
  };

  // --------------------------------------------------
  // CO₂ POLLUTION INTENSITY
  // --------------------------------------------------

  const getEmissionStyle = (co2) => {
    if (co2 >= 120) {
      return {
        radius: 24,
        fillOpacity: 0.5,
        weight: 2,
      };
    }

    if (co2 >= 80) {
      return {
        radius: 18,
        fillOpacity: 0.4,
        weight: 1.5,
      };
    }

    if (co2 >= 40) {
      return {
        radius: 13,
        fillOpacity: 0.3,
        weight: 1,
      };
    }

    return {
      radius: 8,
      fillOpacity: 0.2,
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

      {/* CITY BOUNDARY */}
      <Rectangle
        bounds={mapBounds}
        pathOptions={{
          color: "#555",
          weight: 1,
          fillOpacity: 0,
        }}
      />

      {/* --------------------------------------------------
          ROAD NETWORK
      -------------------------------------------------- */}

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

      {/* --------------------------------------------------
          INTERSECTIONS
      -------------------------------------------------- */}

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
            <strong>Intersection J{index + 1}</strong>
            <br />
            City traffic junction
          </Popup>
        </CircleMarker>
      ))}

      {/* --------------------------------------------------
          VEHICLES
      -------------------------------------------------- */}

      {vehicles.map((vehicle) => {
        if (
          vehicle.x == null ||
          vehicle.y == null
        ) {
          return null;
        }

        return (
          <CircleMarker
            key={vehicle.id}
            center={[
              vehicle.y,
              vehicle.x,
            ]}
            radius={6}
            pathOptions={{
              color: getVehicleColor(
                vehicle.speed
              ),
              fillColor: getVehicleColor(
                vehicle.speed
              ),
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <strong>
                Vehicle {vehicle.id}
              </strong>
              <br />
              Speed: {vehicle.speed}
              <br />
              Waiting Time:{" "}
              {vehicle.waiting_time}
              <br />
              CO₂:{" "}
              {vehicle.co2 ?? "--"}
            </Popup>
          </CircleMarker>
        );
      })}

      {/* --------------------------------------------------
          CO₂ POLLUTION ZONES
      -------------------------------------------------- */}

      {emissions.map((emission, index) => {
        if (
          emission.x == null ||
          emission.y == null
        ) {
          return null;
        }

        const emissionStyle =
          getEmissionStyle(
            Number(emission.co2) || 0
          );

        return (
          <CircleMarker
            key={`emission-${index}`}
            center={[
              emission.y,
              emission.x,
            ]}
            radius={
              emissionStyle.radius
            }
            pathOptions={{
              color: "red",
              fillColor: "red",
              fillOpacity:
                emissionStyle.fillOpacity,
              weight:
                emissionStyle.weight,
            }}
          >
            <Popup>
              <strong>
                CO₂ Pollution Hotspot
              </strong>
              <br />
              CO₂ Level: {emission.co2}
            </Popup>
          </CircleMarker>
        );
      })}

      {/* --------------------------------------------------
          TRAFFIC LIGHTS
      -------------------------------------------------- */}

      {trafficLights.map((light) => {
        const lightPosition =
          light.x != null &&
          light.y != null
            ? [light.y, light.x]
            : [100, 150];

        const lightColor =
          getTrafficLightColor(
            light.state
          );

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

      {/* --------------------------------------------------
          MAP LEGEND
      -------------------------------------------------- */}

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
          CO₂ Intensity
        </strong>

        <div>🟢 Low</div>
        <div>🟡 Moderate</div>
        <div>🔴 High</div>
      </div>
    </MapContainer>
  );
}

export default CityMap;
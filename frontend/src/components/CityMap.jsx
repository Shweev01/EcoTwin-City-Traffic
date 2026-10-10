import { useEffect } from "react";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";


// ============================================================
// MAP CONFIGURATION
// ============================================================

const MAP_CENTER = [210, 210];

const MAP_BOUNDS = [
  [0, 0],
  [420, 420],
];


// ============================================================
// SUMO TRAFFIC LIGHT POSITIONS
// ============================================================
//
// SUMO grid:
//
// A0 ----- A1 ----- A2
// |        |        |
// B0 ----- B1 ----- B2
// |        |        |
// C0 ----- C1 ----- C2
//
// SUMO uses approximately 140 units between intersections.
//

const TRAFFIC_LIGHT_POSITIONS = {
  A0: [20, 20],
  A1: [20, 140],
  A2: [20, 280],

  B0: [140, 20],
  B1: [140, 140],
  B2: [140, 280],

  C0: [280, 20],
  C1: [280, 140],
  C2: [280, 280],
};


// ============================================================
// VEHICLE ICON
// ============================================================

const createVehicleIcon = (color = "#20a8ff") =>
  L.divIcon({
    className: "ecotwin-vehicle-icon",

    html: `
      <div
        style="
          width: 9px;
          height: 9px;
          background: ${color};
          border: 1px solid rgba(255,255,255,0.85);
          border-radius: 2px;
          box-shadow: 0 0 6px ${color};
          transform: rotate(45deg);
        "
      ></div>
    `,

    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });


// ============================================================
// TRAFFIC LIGHT ICON
// ============================================================

const createTrafficLightIcon = (
  color = "#20d67b",
  id = ""
) =>
  L.divIcon({
    className: "ecotwin-traffic-light-icon",

    html: `
      <div
        style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
        "
      >

        <div
          style="
            width: 15px;
            height: 15px;
            border-radius: 50%;
            background: ${color};
            border: 2px solid #071525;
            box-shadow:
              0 0 5px ${color},
              0 0 12px ${color};
          "
        ></div>

        <div
          style="
            padding: 2px 4px;
            border-radius: 3px;
            background: rgba(3, 17, 31, 0.92);
            border: 1px solid rgba(80, 130, 160, 0.6);
            color: #dcebf5;
            font-size: 7px;
            font-family: Arial, sans-serif;
            white-space: nowrap;
          "
        >
          ${id}
        </div>

      </div>
    `,

    iconSize: [35, 35],
    iconAnchor: [17, 10],
  });


// ============================================================
// COORDINATE HELPERS
// ============================================================

function getCoordinate(object) {
  if (!object) {
    return null;
  }

  /*
   * Supports several possible backend formats:
   *
   * { x: 120, y: 250 }
   * { position: { x: 120, y: 250 } }
   * { position: [120, 250] }
   * { coordinates: [120, 250] }
   * { lat: 120, lon: 250 }
   * { latitude: 120, longitude: 250 }
   */

  if (
    Number.isFinite(Number(object.x)) &&
    Number.isFinite(Number(object.y))
  ) {
    return [
      Number(object.y),
      Number(object.x),
    ];
  }

  if (
    object.position &&
    !Array.isArray(object.position) &&
    Number.isFinite(Number(object.position.x)) &&
    Number.isFinite(Number(object.position.y))
  ) {
    return [
      Number(object.position.y),
      Number(object.position.x),
    ];
  }

  if (
    Array.isArray(object.position) &&
    object.position.length >= 2
  ) {
    return [
      Number(object.position[1]),
      Number(object.position[0]),
    ];
  }

  if (
    Array.isArray(object.coordinates) &&
    object.coordinates.length >= 2
  ) {
    return [
      Number(object.coordinates[1]),
      Number(object.coordinates[0]),
    ];
  }

  if (
    Number.isFinite(Number(object.latitude)) &&
    Number.isFinite(Number(object.longitude))
  ) {
    return [
      Number(object.latitude),
      Number(object.longitude),
    ];
  }

  if (
    Number.isFinite(Number(object.lat)) &&
    Number.isFinite(Number(object.lon))
  ) {
    return [
      Number(object.lat),
      Number(object.lon),
    ];
  }

  if (
    Number.isFinite(Number(object.lat)) &&
    Number.isFinite(Number(object.lng))
  ) {
    return [
      Number(object.lat),
      Number(object.lng),
    ];
  }

  return null;
}


// ============================================================
// VEHICLE COLOR
// ============================================================

function getVehicleColor(vehicle) {
  const type =
    String(
      vehicle?.type ??
      vehicle?.vehicle_type ??
      vehicle?.vehicleType ??
      "car"
    ).toLowerCase();

  if (
    type.includes("truck") ||
    type.includes("heavy")
  ) {
    return "#ff4352";
  }

  if (
    type.includes("bus") ||
    type.includes("bike")
  ) {
    return "#ffbc27";
  }

  return "#20a8ff";
}


// ============================================================
// TRAFFIC LIGHT STATE
// ============================================================
//
// SUMO states look like:
//
// "GG"
// "rrrGGgGrr"
// "rrrrGGggrrrrGGgg"
// "GrrrrrGGg"
//
// Characters:
// G / g = green
// y      = yellow
// r      = red
//
// If multiple colors are present, yellow gets highest priority,
// followed by green, then red.
//

function getTrafficLightColor(light) {
  const state = String(
    light?.state ??
    light?.status ??
    light?.color ??
    "r"
  );

  const normalizedState =
    state.toLowerCase();

  if (normalizedState.includes("y")) {
    return "#ffc12e";
  }

  if (normalizedState.includes("g")) {
    return "#20d67b";
  }

  return "#ff3d4f";
}


// ============================================================
// TRAFFIC LIGHT STATUS LABEL
// ============================================================

function getTrafficLightStatus(light) {
  const state = String(
    light?.state ??
    light?.status ??
    light?.color ??
    "r"
  ).toLowerCase();

  if (state.includes("y")) {
    return "Yellow";
  }

  if (state.includes("g")) {
    return "Green";
  }

  return "Red";
}


// ============================================================
// CO2 COLOR
// ============================================================

function getEmissionColor(value, maxValue) {
  const amount = Number(value) || 0;

  const max =
    Number(maxValue) > 0
      ? Number(maxValue)
      : 100;

  const ratio =
    Math.min(
      1,
      Math.max(0, amount / max)
    );

  if (ratio < 0.2) {
    return "#087cff";
  }

  if (ratio < 0.4) {
    return "#00d878";
  }

  if (ratio < 0.6) {
    return "#fff000";
  }

  if (ratio < 0.8) {
    return "#ff7b00";
  }

  return "#ff1744";
}


// ============================================================
// MAP RESIZE FIX
// ============================================================

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [map]);

  return null;
}


// ============================================================
// CITY ROADS
// ============================================================

const roads = [
  [
    [45, 30],
    [45, 390],
  ],

  [
    [105, 30],
    [105, 390],
  ],

  [
    [175, 30],
    [175, 390],
  ],

  [
    [245, 30],
    [245, 390],
  ],

  [
    [315, 30],
    [315, 390],
  ],

  [
    [375, 30],
    [375, 390],
  ],

  [
    [30, 55],
    [390, 55],
  ],

  [
    [30, 125],
    [390, 125],
  ],

  [
    [30, 205],
    [390, 205],
  ],

  [
    [30, 285],
    [390, 285],
  ],

  [
    [30, 365],
    [390, 365],
  ],
];


// ============================================================
// SECONDARY ROADS
// ============================================================

const secondaryRoads = [
  [
    [45, 55],
    [175, 125],
    [315, 55],
    [375, 125],
  ],

  [
    [45, 285],
    [175, 205],
    [315, 285],
    [375, 205],
  ],

  [
    [105, 55],
    [245, 205],
    [105, 365],
  ],

  [
    [245, 55],
    [175, 205],
    [315, 365],
  ],
];


// ============================================================
// ROAD COMPONENT
// ============================================================

function CityRoads() {
  return (
    <>
      {roads.map((road, index) => (
        <Polyline
          key={`road-${index}`}
          positions={road}
          pathOptions={{
            color: "#173a55",
            weight: 11,
            opacity: 0.9,
          }}
        />
      ))}

      {roads.map((road, index) => (
        <Polyline
          key={`road-center-${index}`}
          positions={road}
          pathOptions={{
            color: "#31556d",
            weight: 1,
            opacity: 0.8,
            dashArray: "5 7",
          }}
        />
      ))}

      {secondaryRoads.map((road, index) => (
        <Polyline
          key={`secondary-${index}`}
          positions={road}
          pathOptions={{
            color: "#102c43",
            weight: 7,
            opacity: 0.9,
          }}
        />
      ))}
    </>
  );
}


// ============================================================
// CITY BLOCKS
// ============================================================

function CityBlocks() {
  const blocks = [
    [70, 70, 65, 42],
    [200, 70, 55, 42],
    [330, 75, 35, 35],

    [70, 145, 65, 40],
    [200, 145, 55, 42],
    [330, 150, 35, 40],

    [70, 225, 65, 42],
    [200, 225, 55, 42],
    [330, 225, 35, 42],

    [70, 305, 65, 40],
    [200, 305, 55, 40],
    [330, 305, 35, 40],
  ];

  return (
    <>
      {blocks.map(
        (
          [x, y, width, height],
          index
        ) => (
          <Polyline
            key={`block-${index}`}
            positions={[
              [y, x],
              [y, x + width],
              [y + height, x + width],
              [y + height, x],
              [y, x],
            ]}
            pathOptions={{
              color: "#0b263b",
              weight: 1,
              fillColor: "#081d2f",
              fillOpacity: 0.75,
            }}
          />
        )
      )}
    </>
  );
}


// ============================================================
// CITY MAP
// ============================================================

function CityMap({
  vehicles = [],
  trafficLights = [],
  emissions = [],
}) {
  const validVehicles = Array.isArray(vehicles)
    ? vehicles
    : [];

  const validTrafficLights =
    Array.isArray(trafficLights)
      ? trafficLights
      : [];

  const validEmissions =
    Array.isArray(emissions)
      ? emissions
      : [];


  // ----------------------------------------------------------
  // Maximum emission
  // ----------------------------------------------------------

  const maxEmission = Math.max(
    1,
    ...validEmissions.map(
      (item) =>
        Number(
          item?.co2 ??
          item?.value ??
          item?.emission ??
          0
        )
    )
  );


  // ----------------------------------------------------------
  // Map vehicles
  // ----------------------------------------------------------

  const mappedVehicles =
    validVehicles
      .map((vehicle, index) => ({
        vehicle,
        position: getCoordinate(vehicle),
        key:
          vehicle?.id ??
          vehicle?.vehicle_id ??
          `vehicle-${index}`,
      }))
      .filter(
        (item) =>
          item.position &&
          item.position.every(
            (value) =>
              Number.isFinite(value)
          )
      );


  // ----------------------------------------------------------
  // Map traffic lights
  // ----------------------------------------------------------

  const mappedTrafficLights =
    validTrafficLights
      .map((light, index) => {
        const lightId =
          light?.id ??
          light?.tls_id ??
          `traffic-light-${index}`;

        /*
         * First try coordinates from backend.
         * If SUMO only provides an ID, use the known grid position.
         */

        const backendPosition =
          getCoordinate(light);

        const gridPosition =
          TRAFFIC_LIGHT_POSITIONS[
            lightId
          ] ?? null;

        return {
          light,
          position:
            backendPosition ??
            gridPosition,
          key: lightId,
          lightId,
        };
      })
      .filter(
        (item) =>
          item.position &&
          item.position.every(
            (value) =>
              Number.isFinite(value)
          )
      );


  // ----------------------------------------------------------
  // Map emissions
  // ----------------------------------------------------------

  const mappedEmissions =
    validEmissions
      .map((emission, index) => ({
        emission,
        position: getCoordinate(emission),
        key:
          emission?.id ??
          emission?.point_id ??
          `emission-${index}`,
      }))
      .filter(
        (item) =>
          item.position &&
          item.position.every(
            (value) =>
              Number.isFinite(value)
          )
      );


  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={0}
      minZoom={-1}
      maxZoom={2}
      crs={L.CRS.Simple}
      maxBounds={MAP_BOUNDS}
      maxBoundsViscosity={1}
      scrollWheelZoom={true}
      zoomControl={true}
      attributionControl={false}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "100%",
        background: "#061525",
      }}
    >

      {/* ====================================================
          MAP BACKGROUND
      ===================================================== */}

      <TileLayer
        url=""
        opacity={0}
      />


      {/* ====================================================
          CITY BLOCKS
      ===================================================== */}

      <CityBlocks />


      {/* ====================================================
          ROADS
      ===================================================== */}

      <CityRoads />


      {/* ====================================================
          CO2 EMISSION HEATMAP
      ===================================================== */}

      {mappedEmissions.map(
        ({
          emission,
          position,
          key,
        }) => {
          const value =
            Number(
              emission?.co2 ??
              emission?.value ??
              emission?.emission ??
              0
            );

          const intensity =
            Math.min(
              1,
              Math.max(
                0.15,
                value / maxEmission
              )
            );

          const color =
            getEmissionColor(
              value,
              maxEmission
            );

          return (
            <CircleMarker
              key={`heat-${key}`}
              center={position}
              radius={
                13 +
                intensity * 15
              }
              pathOptions={{
                stroke: false,
                fillColor: color,
                fillOpacity:
                  0.08 +
                  intensity * 0.16,
              }}
            />
          );
        }
      )}


      {/* ====================================================
          CO2 HOTSPOT CORE
      ===================================================== */}

      {mappedEmissions.map(
        ({
          emission,
          position,
          key,
        }) => {
          const value =
            Number(
              emission?.co2 ??
              emission?.value ??
              emission?.emission ??
              0
            );

          const color =
            getEmissionColor(
              value,
              maxEmission
            );

          return (
            <CircleMarker
              key={`emission-core-${key}`}
              center={position}
              radius={3}
              pathOptions={{
                color,
                weight: 1,
                fillColor: color,
                fillOpacity: 0.95,
              }}
            >
              <Popup>
                <strong>
                  CO₂ Emission
                </strong>

                <br />

                {value.toFixed(2)} mg/s
              </Popup>
            </CircleMarker>
          );
        }
      )}


      {/* ====================================================
          LIVE SUMO TRAFFIC LIGHTS
      ===================================================== */}

      {mappedTrafficLights.map(
        ({
          light,
          position,
          key,
          lightId,
        }) => {
          const color =
            getTrafficLightColor(
              light
            );

          const status =
            getTrafficLightStatus(
              light
            );

          const state =
            String(
              light?.state ??
              light?.status ??
              "Unknown"
            );

          const phase =
            light?.phase ?? "-";

          return (
            <Marker
              key={`tls-${key}`}
              position={position}
              icon={createTrafficLightIcon(
                color,
                lightId
              )}
              zIndexOffset={1000}
            >
              <Popup>

                <strong>
                  Traffic Light {lightId}
                </strong>

                <br />

                Status:{" "}

                <span
                  style={{
                    color,
                    fontWeight: "bold",
                  }}
                >
                  {status}
                </span>

                <br />

                Phase: {phase}

                <br />

                State: {state}

              </Popup>
            </Marker>
          );
        }
      )}


      {/* ====================================================
          VEHICLES
      ===================================================== */}

      {mappedVehicles.map(
        ({
          vehicle,
          position,
          key,
        }) => {
          const speed =
            Number(
              vehicle?.speed ?? 0
            );

          const color =
            getVehicleColor(
              vehicle
            );

          return (
            <Marker
              key={`vehicle-${key}`}
              position={position}
              icon={createVehicleIcon(
                color
              )}
            >
              <Popup>

                <strong>
                  {key}
                </strong>

                <br />

                Speed:{" "}
                {speed.toFixed(1)} m/s

                <br />

                Waiting:{" "}
                {Number(
                  vehicle?.waiting_time ??
                  vehicle?.waitingTime ??
                  0
                ).toFixed(1)} s

              </Popup>
            </Marker>
          );
        }
      )}


      {/* ====================================================
          MAP RESIZE HANDLER
      ===================================================== */}

      <MapResizeHandler />

    </MapContainer>
  );
}

export default CityMap;
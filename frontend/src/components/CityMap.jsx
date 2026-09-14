import {
  MapContainer,
  CircleMarker,
  Popup,
  Rectangle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function CityMap({
  vehicles = [],
  trafficLights = [],
  emissions = [],
}) {
  const mapBounds = [
    [0, 0],
    [200, 300],
  ];

  const getVehicleColor = (speed) => {
    if (speed === 0) {
      return "red";
    }

    if (speed < 5) {
      return "orange";
    }

    return "blue";
  };

  const getTrafficLightColor = (state) => {
    if (state === "G") {
      return "green";
    }

    if (state === "Y") {
      return "orange";
    }

    return "red";
  };

  const getEmissionStyle = (co2) => {
    if (co2 >= 120) {
      return {
        radius: 20,
        fillOpacity: 0.45,
        weight: 2,
      };
    }

    if (co2 >= 80) {
      return {
        radius: 15,
        fillOpacity: 0.35,
        weight: 1.5,
      };
    }

    return {
      radius: 10,
      fillOpacity: 0.25,
      weight: 1,
    };
  };

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={mapBounds}
      style={{ height: "100%", width: "100%" }}
    >
      <Rectangle
        bounds={mapBounds}
        pathOptions={{
          color: "#555",
          weight: 1,
        }}
      />

      {/* Live vehicles */}
      {vehicles.map((vehicle) => (
        <CircleMarker
          key={vehicle.id}
          center={[vehicle.y, vehicle.x]}
          radius={6}
          pathOptions={{
            color: getVehicleColor(vehicle.speed),
            fillOpacity: 0.8,
          }}
        >
          <Popup>
            <strong>Vehicle {vehicle.id}</strong>
            <br />
            Speed: {vehicle.speed}
            <br />
            Waiting Time: {vehicle.waiting_time}
          </Popup>
        </CircleMarker>
      ))}

      {/* CO₂ emission hotspots */}
      {emissions.map((emission, index) => {
        const emissionStyle = getEmissionStyle(emission.co2);

        return (
          <CircleMarker
            key={`emission-${index}`}
            center={[emission.y, emission.x]}
            radius={emissionStyle.radius}
            pathOptions={{
              color: "red",
              fillColor: "red",
              fillOpacity: emissionStyle.fillOpacity,
              weight: emissionStyle.weight,
            }}
          >
            <Popup>
              <strong>CO₂ Pollution Hotspot</strong>
              <br />
              CO₂ Level: {emission.co2}
            </Popup>
          </CircleMarker>
        );
      })}

      {/* Traffic lights */}
      {trafficLights.map((light) => {
        // Use real coordinates when provided by the backend.
        // Otherwise keep the temporary position for current mock data.
        const lightPosition =
          light.x != null && light.y != null
            ? [light.y, light.x]
            : [100, 150];

        const lightColor = getTrafficLightColor(light.state);

        return (
          <CircleMarker
            key={light.id}
            center={lightPosition}
            radius={8}
            pathOptions={{
              color: lightColor,
              fillColor: lightColor,
              fillOpacity: 1,
            }}
          >
            <Popup>
              <strong>Traffic Light {light.id}</strong>
              <br />
              State: {light.state}
              <br />
              Phase: {light.phase}
            </Popup>
          </CircleMarker>
        );
      })}

      {/* Map legend */}
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
    boxShadow: "0 1px 5px rgba(0,0,0,0.3)",
  }}
>
  <strong>Map Legend</strong>

  <div>🔵 Moving Vehicle</div>
  <div>🟠 Slow Vehicle</div>
  <div>🔴 Stopped Vehicle</div>

  <div>🟢 Green Light</div>
  <div>🟡 Yellow Light</div>
  <div>🔴 Red Light</div>

  <hr
    style={{
      border: "none",
      borderTop: "1px solid #ddd",
      margin: "8px 0",
    }}
  />

  <strong>CO₂ Intensity</strong>
  <div>🟢 Low</div>
  <div>🟡 Moderate</div>
  <div>🔴 High</div>
</div>
    </MapContainer>
  );
}

export default CityMap;
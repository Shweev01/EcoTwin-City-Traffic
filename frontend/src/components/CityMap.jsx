import {
  MapContainer,
  CircleMarker,
  Popup,
  Rectangle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function CityMap({ vehicles = [], trafficLights = [] }) {
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

      {/* Traffic lights */}
      {trafficLights.map((light) => (
        <CircleMarker
          key={light.id}
          center={[100, 150]}
          radius={8}
          pathOptions={{
            color:
              light.state === "G"
                ? "green"
                : light.state === "Y"
                  ? "orange"
                  : "red",
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
      ))}

      {/* Map legend */}
      <div
        className="map-legend"
        style={{
          position: "absolute",
          bottom: "15px",
          right: "15px",
          zIndex: 1000,
          background: "white",
          padding: "10px",
          borderRadius: "6px",
          fontSize: "12px",
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
      </div>
    </MapContainer>
  );
}

export default CityMap;
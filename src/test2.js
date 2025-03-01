import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import L from "leaflet";

const userIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  iconSize: [30, 30],
});

const hospitalIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [30, 30],
});

function HospitalFinder() {
  const [userLocation, setUserLocation] = useState([51.505, -0.09]); // Default location
  const [hospitals, setHospitals] = useState([]);
  const [route, setRoute] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setMapReady(true);
      },
      (error) => {
        alert("Geolocation failed: " + error.message);
        setMapReady(true);
      }
    );
  }, []);

  const findHospitals = async () => {
    if (!userLocation) return alert("Please allow location access.");
    
    const [lat, lon] = userLocation;
    const queryUrl = `https://nominatim.openstreetmap.org/search?format=json&q=hospital&bounded=1&viewbox=${lon - 0.05},${lat + 0.05},${lon + 0.05},${lat - 0.05}`;

    try {
      const response = await axios.get(queryUrl);
      setHospitals(response.data);
    } catch (error) {
      console.error("Error fetching hospitals:", error);
    }
  };

  const getRoute = async (destLat, destLon) => {
    if (!userLocation) return;
    
    const [lat, lon] = userLocation;
    const routeUrl = `https://router.project-osrm.org/route/v1/driving/${lon},${lat};${destLon},${destLat}?overview=full&geometries=geojson`;
    
    try {
      const response = await axios.get(routeUrl);
      setRoute(response.data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]));
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Find Nearby Hospitals</h2>
      <button onClick={findHospitals}>🏥 Find Hospitals</button>
      <div style={{ margin: "10px", padding: "10px", border: "1px solid #ccc", display: "inline-block" }}>
        <strong>Latitude:</strong> {userLocation[0]} <br />
        <strong>Longitude:</strong> {userLocation[1]}
      </div>
      {mapReady && (
        <MapContainer center={userLocation} zoom={13} style={{ height: "500px", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={userLocation} icon={userIcon}>
            <Popup>📍 Your Location</Popup>
          </Marker>
          {hospitals.map((place, index) => (
            <Marker key={index} position={[place.lat, place.lon]} icon={hospitalIcon}>
              <Popup>
                <strong>{place.display_name}</strong><br />
                <button onClick={() => getRoute(place.lat, place.lon)}>🛣️ Get Route</button>
              </Popup>
            </Marker>
          ))}
          {route && <Polyline positions={route} color="blue" weight={5} />}
        </MapContainer>
      )}
    </div>
  );
}

export default HospitalFinder;
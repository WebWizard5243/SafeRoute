import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const policeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const safeZoneIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const reportIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const getIcon = (type) => {
  switch(type) {
    case 'police': return policeIcon;
    case 'hospital': return hospitalIcon;
    case 'safezone': return safeZoneIcon;
    default: return reportIcon;
  }
}

// Map updater component to auto-zoom to the selected route
const MapBoundsUpdater = ({ routes, selectedRouteId }) => {
  const map = useMap();
  
  useEffect(() => {
    const selected = routes?.find(r => r.id === selectedRouteId);
    if (selected && selected.path && selected.path.length > 0) {
      const bounds = L.latLngBounds(selected.path);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routes, selectedRouteId, map]);
  
  return null;
};

const MapComponent = ({ routes, markers, hazards, selectedRouteId }) => {
  const defaultCenter = [28.6139, 77.2090]; // New Delhi

  const getPathColor = (colorStr) => {
    switch(colorStr) {
      case 'green': return '#22c55e';
      case 'blue': return '#3b82f6';
      case 'red': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  // Only show the selected route
  const selectedRoute = routes?.find(r => r.id === selectedRouteId);

  return (
    <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 z-0">
      <MapContainer center={defaultCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBoundsUpdater routes={routes} selectedRouteId={selectedRouteId} />
        
        {/* Render only the selected route */}
        {selectedRoute && selectedRoute.path && selectedRoute.path.length > 0 && (
          <Polyline 
            key={selectedRoute.id} 
            positions={selectedRoute.path} 
            color={getPathColor(selectedRoute.color)} 
            weight={6}
            opacity={0.9}
          >
            <Popup>{selectedRoute.name} (Score: {selectedRoute.safetyScore})</Popup>
          </Polyline>
        )}

        {/* Render markers (police, hospitals) */}
        {markers && markers.map(marker => (
          <Marker key={`marker-${marker.id}`} position={[marker.lat, marker.lng]} icon={getIcon(marker.type)}>
            <Popup className="font-sans">
              <span className="font-bold block capitalize">{marker.type}</span>
              {marker.name}
            </Popup>
          </Marker>
        ))}

        {/* Render hazard hotspots */}
        {hazards && hazards.map(hazard => (
          <Marker key={`hazard-${hazard.id}`} position={[hazard.lat, hazard.lng]} icon={getIcon('report')}>
            <Popup className="font-sans">
              <span className="font-bold text-red-600 block">⚠️ Hazard Hotspot ({hazard.count} reports)</span>
              <span className="font-semibold text-gray-700">Type:</span> {hazard.type}<br/>
              <span className="text-xs text-gray-500 mt-1 block">This location has been reported multiple times by the community.</span>
            </Popup>
          </Marker>
        ))}

      </MapContainer>
    </div>
  );
};

export default MapComponent;


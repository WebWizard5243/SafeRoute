import React, { useState, useEffect } from 'react';
import { Search, MapPin, Navigation, AlertTriangle, ShieldCheck } from 'lucide-react';
import MapComponent from '../components/MapComponent';
import LocationAutocomplete from '../components/LocationAutocomplete';

const RoutePlanner = () => {
  const [start, setStart] = useState('');
  const [destination, setDestination] = useState('');
  const [routes, setRoutes] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5001/api/hazards')
      .then(res => res.json())
      .then(data => setHazards(data))
      .catch(err => console.error("Error fetching hazards", err));
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!start || !destination) return;
    
    setLoading(true);
    try {
      let query = `?start=${encodeURIComponent(start.name || start)}&destination=${encodeURIComponent(destination.name || destination)}`;
      if (start.lat && destination.lat) {
        query += `&startLat=${start.lat}&startLng=${start.lng}&destLat=${destination.lat}&destLng=${destination.lng}`;
      }
      
      const res = await fetch(`http://localhost:5001/api/routes${query}`);
      const data = await res.json();
      setRoutes(data);
      setSearched(true);
      if (data.length > 0) {
        setSelectedRouteId(data[0].id);
      }

      // Fetch real nearby markers (police, hospitals, pharmacies) around the route midpoint
      if (start.lat && destination.lat) {
        const midLat = (start.lat + destination.lat) / 2;
        const midLng = (start.lng + destination.lng) / 2;
        const markersRes = await fetch(`http://localhost:5001/api/markers?lat=${midLat}&lng=${midLng}`);
        const markersData = await markersRes.json();
        setMarkers(markersData);
      }
    } catch (err) {
      console.error("Error fetching routes:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Panel: Search & Results */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Plan Safe Route</h2>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
                <LocationAutocomplete 
                  placeholder="Enter starting point"
                  value={start}
                  onChange={setStart}
                  icon={MapPin}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                <LocationAutocomplete 
                  placeholder="Enter destination"
                  value={destination}
                  onChange={setDestination}
                  icon={Navigation}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50"
              >
                {loading ? 'Calculating...' : 'Find Safe Route'}
              </button>
            </form>
          </div>

          {searched && (
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[500px] pr-2">
              <h3 className="text-lg font-bold text-gray-800">Available Routes</h3>
              {routes.map(route => (
                <RouteCard 
                  key={route.id} 
                  route={route} 
                  isSelected={selectedRouteId === route.id}
                  onSelect={() => setSelectedRouteId(route.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Panel: Map */}
        <div className="w-full lg:w-2/3">
          <div className="relative">
            <MapComponent 
              routes={routes} 
              markers={markers} 
              hazards={hazards} 
              selectedRouteId={selectedRouteId}
              onRouteSelect={setSelectedRouteId}
            />
            
            {/* Legend overlay on top of map */}
            <div className="absolute bottom-3 left-3 z-[1000] flex flex-wrap gap-3 text-xs text-gray-700 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-200 shadow-md">
              <span className="font-bold text-gray-900">Legend:</span>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Police</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Hospital</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Safe Zone</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Hazard Hotspot</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const RouteCard = ({ route, isSelected, onSelect }) => {
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Very Safe';
    if (score >= 70) return 'Safe';
    if (score >= 50) return 'Caution';
    return 'Avoid';
  };

  const getRouteColor = (color) => {
    switch(color) {
      case 'green': return 'border-green-500 ring-green-200';
      case 'blue': return 'border-blue-500 ring-blue-200';
      case 'red': return 'border-red-500 ring-red-200';
      default: return 'border-slate-200';
    }
  };

  return (
    <div 
      onClick={onSelect}
      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md bg-white ${
        isSelected 
          ? `${getRouteColor(route.color)} ring-2 shadow-md` 
          : 'border-slate-200 opacity-80'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-lg text-gray-900">{route.name}</h4>
            {isSelected && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Selected</span>}
          </div>
          <p className="text-sm text-gray-500">{route.distance} • {route.duration}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getScoreColor(route.safetyScore)}`}>
          {route.safetyScore >= 90 ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
          {route.safetyScore}/100 - {getScoreLabel(route.safetyScore)}
        </div>
      </div>
      
      <div className="space-y-2 text-sm mt-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Street Lighting</span>
          <span className="font-medium text-gray-900">{route.lighting}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Police Stations Nearby</span>
          <span className="font-medium text-gray-900">{route.policeStationsNearby}</span>
        </div>
      </div>
    </div>
  );
};

export default RoutePlanner;

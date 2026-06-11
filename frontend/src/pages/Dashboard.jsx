import React, { useState } from 'react';
import { ShieldAlert, Users, Navigation, AlertCircle, MapPin } from 'lucide-react';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { API_BASE } from '../config';

const Dashboard = () => {
  const [location, setLocation] = useState('');
  const [reportType, setReportType] = useState('Poor lighting');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const stats = [
    { label: 'Safe Routes Generated', value: '1,284', icon: <Navigation className="text-blue-500" /> },
    { label: 'Active Hazard Reports', value: '15', icon: <AlertCircle className="text-orange-500" /> },
    { label: 'Community Contributors', value: '342', icon: <Users className="text-green-500" /> },
    { label: 'SOS Alerts Triggered', value: '3', icon: <ShieldAlert className="text-red-500" /> },
  ];

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    
    if (!location || typeof location !== 'object' || !location.lat || !location.lng) {
      alert("Please select a location from the suggestions dropdown.");
      return;
    }

    const newReport = {
      type: reportType,
      description,
      lat: location.lat,
      lng: location.lng
    };

    try {
      await fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport)
      });
      setSubmitted(true);
      setDescription('');
      setLocation('');
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Community Dashboard</h1>
        <p className="text-gray-600 mt-2">Together we build safer streets. View statistics and report incidents.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-4 bg-slate-50 rounded-xl">
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Report Hazard Form */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <ShieldAlert className="text-orange-500" size={28} />
            <h2 className="text-2xl font-bold text-gray-900">Report a Hazard</h2>
          </div>
          
          <form onSubmit={handleReportSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <LocationAutocomplete 
                placeholder="Search and select location"
                value={location}
                onChange={setLocation}
                icon={MapPin}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hazard Type</label>
              <select 
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-primary focus:border-primary"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option>Poor lighting</option>
                <option>Harassment</option>
                <option>Unsafe area</option>
                <option>Suspicious activity</option>
                <option>Broken CCTV</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-primary focus:border-primary"
                rows="4"
                placeholder="Provide details about the hazard..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </div>

            <button 
              type="submit"
              className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Submit Report Anonymously
            </button>

            {submitted && (
              <div className="p-3 bg-green-50 text-green-700 rounded-lg text-center text-sm font-medium border border-green-200">
                Report submitted successfully! Thank you for keeping the community safe.
              </div>
            )}
          </form>
        </div>

        {/* Safety Tips Section */}
        <div className="flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Daily Safety Tips</h2>
          
          <TipCard 
            title="Share Live Location" 
            text="Always share your live location with at least one trusted contact when traveling alone at night." 
          />
          <TipCard 
            title="Stay Aware" 
            text="Avoid using noise-canceling headphones while walking in unfamiliar or dimly lit areas." 
          />
          <TipCard 
            title="Trust Your Instincts" 
            text="If a route feels unsafe despite its rating, take an alternative path or seek a well-lit public space." 
          />
          <TipCard 
            title="Keep Emergency Contacts Handy" 
            text="Add emergency numbers to speed dial. SafeRoute's SOS feature is always one tap away." 
          />
        </div>
      </div>
    </div>
  );
};

const TipCard = ({ title, text }) => (
  <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
    <h3 className="font-bold text-primary-dark text-lg mb-1">{title}</h3>
    <p className="text-blue-900 text-sm leading-relaxed">{text}</p>
  </div>
);

export default Dashboard;

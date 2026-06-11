import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Map, LayoutDashboard, PhoneCall } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="glass fixed w-full z-50 top-0 left-0 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-lg text-white">
                <Shield size={24} />
              </div>
              <span className="font-bold text-xl text-primary-dark">SafeRoute</span>
            </Link>
          </div>
          
          <div className="hidden md:flex space-x-8">
            <Link to="/route-planner" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors">
              <Map size={18} />
              <span>Route Planner</span>
            </Link>
            <Link to="/dashboard" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors">
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
            <Link to="/contacts" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors">
              <PhoneCall size={18} />
              <span>Emergency</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

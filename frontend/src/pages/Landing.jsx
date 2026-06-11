import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, Map, Bell, Heart } from 'lucide-react';

const Landing = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-100 flex-grow flex items-center pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-primary font-medium text-sm mb-6">
              <Heart size={16} className="text-accent" />
              <span>Supporting UN SDG 5: Gender Equality</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6 tracking-tight">
              Navigate with <span className="text-primary">Confidence</span>.
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-lg leading-relaxed">
              SafeRoute empowers women and vulnerable individuals to find safer paths, avoid high-risk areas, and stay connected with loved ones during travel.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link 
                to="/route-planner" 
                className="inline-flex justify-center items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-dark transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
              >
                <span>Start Safe Navigation</span>
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 w-full mt-12 md:mt-0 relative">
            <div className="absolute inset-0 bg-blue-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <div className="glass rounded-2xl p-6 relative z-10 shadow-2xl border border-white/40">
              <img 
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Woman walking confidently" 
                className="rounded-xl w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Core Features Designed for Safety</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Comprehensive tools to ensure you reach your destination securely, day or night.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Map className="text-blue-500" size={32} />}
              title="Smart Route Planner"
              description="Discover routes optimized for safety using crowd-sourced data, street lighting info, and distance to emergency services."
            />
            <FeatureCard 
              icon={<Bell className="text-accent" size={32} />}
              title="One-Tap SOS"
              description="Instantly alert your trusted contacts and local authorities if you feel threatened or encounter an emergency."
            />
            <FeatureCard 
              icon={<Shield className="text-green-500" size={32} />}
              title="Community Insights"
              description="Report incidents and view live community hazard reports on the map to avoid potentially dangerous areas."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1 duration-300">
    <div className="bg-white w-14 h-14 rounded-xl shadow-sm flex items-center justify-center mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

export default Landing;

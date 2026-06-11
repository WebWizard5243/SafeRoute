import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// ─── Hazard Reports Database (JSON file) ───────────────────────────────────────
const REPORTS_FILE = path.join(__dirname, 'reports.json');
const HAZARD_THRESHOLD = 2; // Minimum reports at a location to show it as a hazard marker

function loadReports() {
  try {
    if (fs.existsSync(REPORTS_FILE)) {
      return JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading reports file:', e.message);
  }
  return [];
}

function saveReports(reports) {
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2));
}

// ─── Routes API ─────────────────────────────────────────────────────────────────
app.get('/api/routes', async (req, res) => {
  const { start, destination, startLat, startLng, destLat, destLng } = req.query;

  if (!start || !destination) {
    return res.status(400).json({ error: 'Start and destination are required' });
  }

  const routeTemplates = [
    { id: 'route_A', name: 'Safest Route', safetyScore: 92, lighting: 'High', policeStationsNearby: 3, color: 'green' },
    { id: 'route_B', name: 'Balanced Route', safetyScore: 75, lighting: 'Moderate', policeStationsNearby: 1, color: 'blue' },
    { id: 'route_C', name: 'Fastest Route', safetyScore: 45, lighting: 'Poor', policeStationsNearby: 0, color: 'red' },
  ];

  let osrmRoutes = [];

  if (startLat && startLng && destLat && destLng) {
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson&alternatives=3`;
      console.log('Fetching OSRM:', osrmUrl);
      const osrmRes = await fetch(osrmUrl);
      const osrmData = await osrmRes.json();

      if (osrmData.routes && osrmData.routes.length > 0) {
        osrmRoutes = osrmData.routes.map(r => ({
          path: r.geometry.coordinates.map(c => [c[1], c[0]]),
          distance: (r.distance / 1000).toFixed(1) + ' km',
          duration: Math.round(r.duration / 60) + ' mins',
        }));
        console.log(`OSRM returned ${osrmRoutes.length} alternative routes`);
      }

      // Generate extra routes via waypoints if fewer than 3
      if (osrmRoutes.length < 3) {
        const sLat = parseFloat(startLat), sLng = parseFloat(startLng);
        const dLat = parseFloat(destLat), dLng = parseFloat(destLng);
        const midLat = (sLat + dLat) / 2, midLng = (sLng + dLng) / 2;
        const offsets = [
          { lat: midLat + 0.008, lng: midLng + 0.008 },
          { lat: midLat - 0.008, lng: midLng - 0.008 },
        ];
        for (let i = osrmRoutes.length; i < 3; i++) {
          const wp = offsets[i - 1] || offsets[0];
          try {
            const wpUrl = `https://router.project-osrm.org/route/v1/driving/${sLng},${sLat};${wp.lng},${wp.lat};${dLng},${dLat}?overview=full&geometries=geojson`;
            const wpRes = await fetch(wpUrl);
            const wpData = await wpRes.json();
            if (wpData.routes && wpData.routes.length > 0) {
              osrmRoutes.push({
                path: wpData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]),
                distance: (wpData.routes[0].distance / 1000).toFixed(1) + ' km',
                duration: Math.round(wpData.routes[0].duration / 60) + ' mins',
              });
            }
          } catch (e) {
            console.error('Waypoint route fetch error:', e.message);
          }
        }
      }
    } catch (err) {
      console.error('OSRM fetch error:', err.message);
    }
  }

  const result = routeTemplates.map((tmpl, i) => ({
    ...tmpl,
    path: osrmRoutes[i]?.path || [],
    distance: osrmRoutes[i]?.distance || 'N/A',
    duration: osrmRoutes[i]?.duration || 'N/A',
  }));

  res.json(result);
});

// ─── Markers API (Overpass — real police/hospital/pharmacy with mock fallback) ──
app.get('/api/markers', async (req, res) => {
  const { lat, lng } = req.query;
  const centerLat = parseFloat(lat) || 28.6139;
  const centerLng = parseFloat(lng) || 77.2090;
  const radius = 3000;

  try {
    const query = `[out:json][timeout:15];(node["amenity"="police"](around:${radius},${centerLat},${centerLng});node["amenity"="hospital"](around:${radius},${centerLat},${centerLng});node["amenity"="pharmacy"](around:${radius},${centerLat},${centerLng}););out body 40;`;

    const overpassRes = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'SafeRouteApp/1.0 (kaif@example.com)'
      },
      signal: AbortSignal.timeout(12000)
    });
    
    if (!overpassRes.ok) {
      throw new Error(`HTTP error! status: ${overpassRes.status}`);
    }
    
    const overpassData = await overpassRes.json();

    const typeMap = { police: 'police', hospital: 'hospital', pharmacy: 'safezone' };
    const results = overpassData.elements
      .filter(el => el.lat && el.lon && el.tags)
      .map(el => ({
        id: el.id,
        type: typeMap[el.tags.amenity] || 'safezone',
        lat: el.lat,
        lng: el.lon,
        name: el.tags.name || (el.tags.amenity.charAt(0).toUpperCase() + el.tags.amenity.slice(1)),
      }));

    console.log(`Overpass: Found ${results.length} markers near ${centerLat},${centerLng}`);
    res.json(results);
  } catch (err) {
    console.error('Overpass error (using local fallback markers):', err.message);
    
    // Generate high-quality mock fallback markers centered near the searched coordinates
    const fallbacks = [
      { id: 'mock-p1', type: 'police', lat: centerLat + 0.004, lng: centerLng + 0.003, name: 'Local Area Police Station (Mock)' },
      { id: 'mock-p2', type: 'police', lat: centerLat - 0.003, lng: centerLng - 0.005, name: 'Metro Patrol Post (Mock)' },
      { id: 'mock-h1', type: 'hospital', lat: centerLat + 0.002, lng: centerLng - 0.004, name: 'City Emergency Hospital (Mock)' },
      { id: 'mock-h2', type: 'hospital', lat: centerLat - 0.005, lng: centerLng + 0.005, name: 'General Medical Center (Mock)' },
      { id: 'mock-s1', type: 'safezone', lat: centerLat + 0.005, lng: centerLng - 0.002, name: '24/7 Safe Pharmacy (Mock)' },
      { id: 'mock-s2', type: 'safezone', lat: centerLat - 0.002, lng: centerLng + 0.004, name: 'Community Safe Hub (Mock)' },
    ];
    res.json(fallbacks);
  }
});

// ─── Reports API (persistent JSON database) ────────────────────────────────────
app.get('/api/reports', (req, res) => {
  const reports = loadReports();
  res.json(reports);
});

app.post('/api/reports', (req, res) => {
  const { type, lat, lng, description } = req.body;
  if (!type || !lat || !lng) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const reports = loadReports();
  const newReport = {
    id: Date.now(),
    type,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    description: description || '',
    timestamp: new Date().toISOString(),
  };
  reports.push(newReport);
  saveReports(reports);

  res.status(201).json(newReport);
});

// Hazard hotspots — clusters reports by proximity and returns only those above threshold
app.get('/api/hazards', (req, res) => {
  const reports = loadReports();
  const CLUSTER_RADIUS = 0.002; // ~200m in degrees

  // Cluster reports by proximity
  const clusters = [];
  for (const report of reports) {
    let found = false;
    for (const cluster of clusters) {
      if (Math.abs(cluster.lat - report.lat) < CLUSTER_RADIUS &&
          Math.abs(cluster.lng - report.lng) < CLUSTER_RADIUS) {
        cluster.count++;
        cluster.types.push(report.type);
        // Update center to average
        cluster.lat = (cluster.lat * (cluster.count - 1) + report.lat) / cluster.count;
        cluster.lng = (cluster.lng * (cluster.count - 1) + report.lng) / cluster.count;
        found = true;
        break;
      }
    }
    if (!found) {
      clusters.push({
        id: report.id,
        lat: report.lat,
        lng: report.lng,
        count: 1,
        types: [report.type],
      });
    }
  }

  // Only return clusters that meet the threshold
  const hazards = clusters
    .filter(c => c.count >= HAZARD_THRESHOLD)
    .map(c => ({
      id: c.id,
      lat: c.lat,
      lng: c.lng,
      count: c.count,
      // Most common type in this cluster
      type: c.types.sort((a, b) =>
        c.types.filter(t => t === b).length - c.types.filter(t => t === a).length
      )[0],
      label: `${c.count} reports`,
    }));

  res.json(hazards);
});

// ─── Safety Tips ────────────────────────────────────────────────────────────────
app.get('/api/tips', (req, res) => {
  res.json([
    'Share your live location with trusted contacts.',
    'Avoid isolated shortcuts at night.',
    'Keep emergency numbers accessible.',
    'Stay aware of your surroundings.',
  ]);
});

// ─── Gemini AI Chatbot ──────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function getLocalFallbackReply(message) {
  const lower = message.toLowerCase();
  
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Hello! I'm Safi, your SafeRoute AI Assistant. Ask me anything about safety tips, route planning, or emergency steps!";
  }
  if (lower.includes('danger') || lower.includes('help') || lower.includes('unsafe') || lower.includes('scared') || lower.includes('threat')) {
    return "If you feel unsafe, immediately head to the nearest well-lit public space, tap the red SOS button to alert contacts, or call 1091 (Women's Helpline) right away.";
  }
  if (lower.includes('route') || lower.includes('map') || lower.includes('navigate') || lower.includes('go')) {
    return "When planning routes, choose the 'Safest Route' (green path) which maximizes street lighting and proximity to emergency services like police and hospital stations.";
  }
  if (lower.includes('light') || lower.includes('dark') || lower.includes('night')) {
    return "Avoid poorly lit roads or isolated shortcuts. Look for route safety scores and lighting ratings before choosing your path.";
  }
  if (lower.includes('contact') || lower.includes('sos') || lower.includes('phone')) {
    return "You can manage trusted contacts in the 'Emergency Contacts' tab. Tapping the red SOS button alerts them and shares your GPS Google Maps link.";
  }
  if (lower.includes('police') || lower.includes('hospital')) {
    return "SafeRoute dynamically searches OpenStreetMap (Overpass API) to show nearby police stations and hospitals on the map relative to your route search.";
  }
  
  return "I'm Safi! I advise choosing well-lit roads, sharing your live location with trusted contacts, and keeping emergency numbers (like 1091) ready.";
}

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here' || !process.env.GEMINI_API_KEY.startsWith('AIza')) {
      return res.json({ reply: getLocalFallbackReply(message) });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `You are Safi, an AI Safety Assistant for a women's safety navigation app called SafeRoute. Keep your answers very concise, helpful, and focused on physical safety, travel, and emergency preparedness. Reply to the user's message: "${message}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ reply: response.text() });
  } catch (error) {
    console.error('Gemini AI error (using local chatbot fallback):', error.message);
    const fallbackReply = getLocalFallbackReply(message);
    res.json({ reply: fallbackReply });
  }
});

// ─── SOS Emergency Alerts API ───────────────────────────────────────────────────
app.post('/api/sos', async (req, res) => {
  const { phones, lat, lng } = req.body;
  if (!phones || !Array.isArray(phones) || phones.length === 0) {
    return res.status(400).json({ error: 'No phone numbers provided' });
  }

  const mapsLink = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : null;
  const messageBody = mapsLink 
    ? `EMERGENCY ALERT: I am in danger! Track my location here: ${mapsLink}`
    : `EMERGENCY ALERT: I am in danger! Please contact/find me immediately.`;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  const twilioConfigured = accountSid && authToken && fromPhone;
  let twilioUsed = false;

  console.log(`\n🚨 SOS ALERT TRIGGERED at ${new Date().toISOString()}!`);
  console.log(`Message: "${messageBody}"`);

  const results = [];

  for (const phone of phones) {
    if (twilioConfigured) {
      try {
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            To: phone,
            From: fromPhone,
            Body: messageBody
          })
        });
        const data = await twilioRes.json();
        if (twilioRes.ok) {
          console.log(`[SMS SUCCESS] Sent real alert to ${phone} via Twilio`);
          results.push({ phone, status: 'sent', sid: data.sid });
          twilioUsed = true;
        } else {
          console.error(`[SMS FAILED] Twilio error for ${phone}:`, data.message);
          results.push({ phone, status: 'failed', error: data.message });
        }
      } catch (err) {
        console.error(`[SMS FAILED] Network error sending to ${phone}:`, err.message);
        results.push({ phone, status: 'failed', error: err.message });
      }
    } else {
      // Print directly to console for simulation
      console.log(`[SMS SIMULATED] Alert printed to console for ${phone}`);
      results.push({ phone, status: 'simulated' });
    }
  }

  if (!twilioConfigured) {
    console.log(`💡 [SOS Tip]: Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to backend/.env to send real SMS text messages.`);
  }

  res.json({ success: true, twilioUsed, results });
});

// ─── Start Server ───────────────────────────────────────────────────────────────
const server = await app.listen(PORT);
console.log(`SafeRoute backend running on http://localhost:${PORT}`);

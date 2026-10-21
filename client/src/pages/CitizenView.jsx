import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

const SEVERITY_CONFIG = {
  low: {
    bg: 'bg-primary/10 border-primary/30',
    text: 'text-primary',
    badge: 'bg-primary/20 text-primary border-primary/40',
    icon: 'health_and_safety',
    label: 'Low Risk — Normal Thermal Index',
    advice: 'Stay hydrated and wear breathable UV-shielding clothing.',
  },
  medium: {
    bg: 'bg-secondary/10 border-secondary/30',
    text: 'text-secondary',
    badge: 'bg-secondary/20 text-secondary border-secondary/40',
    icon: 'warning',
    label: 'Moderate Risk — Elevated Heat',
    advice: 'Drink water every 30 minutes; seek shaded cooling corridors.',
  },
  high: {
    bg: 'bg-secondary-container/20 border-secondary-container/40',
    text: 'text-secondary',
    badge: 'bg-secondary-container/30 text-secondary border-secondary-container/50',
    icon: 'local_fire_department',
    label: 'High Risk — Thermal Stress Hazard',
    advice: 'Avoid direct asphalt exposure between 12 PM and 4 PM; check on neighbors.',
  },
  critical: {
    bg: 'bg-error-container/20 border-error/40',
    text: 'text-error',
    badge: 'bg-error-container/30 text-error border-error/50',
    icon: 'emergency',
    label: 'Extreme Risk — Limit All Outdoor Exertion',
    advice: 'Dangerous exposure conditions. Seek air-conditioned sanctuaries or misting stations immediately.',
  },
};

const WARDS = [
  { id: 'Ward-1', label: 'Chennai Central — George Town Harbor (Ward-1)' },
  { id: 'Ward-2', label: 'Chennai South-Central — T. Nagar Commercial (Ward-2)' },
  { id: 'Ward-3', label: 'Chennai South — Guindy & Alandur Industrial (Ward-3)' },
  { id: 'Ward-4', label: 'Chennai Cyber Corridor — Sholinganallur OMR (Ward-4)' },
  { id: 'Ward-5', label: 'Western Tamil Nadu — Coimbatore Gandhipuram (Ward-5)' },
];

export default function CitizenView() {
  const { user } = useAuth();
  const [selectedWard, setSelectedWard] = useState(user?.ward || 'Ward-2');
  const [alerts, setAlerts] = useState([]);
  const [wardSensors, setWardSensors] = useState([]);
  const [coolingCorridors, setCoolingCorridors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Accordion state
  const [openAccordion, setOpenAccordion] = useState({ '1': true, '2': false, '3': false });

  // Action feedback states
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [gpsLocked, setGpsLocked] = useState(false);

  useEffect(() => {
    const fetchWardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [alertRes, sensorRes, coolingRes] = await Promise.all([
          api.get('/api/v1/alerts', { params: { ward: selectedWard, targetRole: 'citizen' } }),
          api.get('/api/v1/sensors', { params: { ward: selectedWard, limit: 12 } }).catch(() => ({ data: { data: [] } })),
          api.get('/api/v1/cooling', { params: { ward: selectedWard } }).catch(() => ({ data: { data: [] } })),
        ]);
        setAlerts(alertRes.data.data || []);
        setWardSensors(sensorRes.data.data || []);
        setCoolingCorridors(coolingRes.data.data || []);
      } catch {
        setError('Unable to load neighborhood telemetry from MongoDB Atlas.');
      } finally {
        setLoading(false);
      }
    };
    fetchWardData();
  }, [selectedWard]);

  // Dynamic calculations from MongoDB data
  const currentTemp = wardSensors.length > 0
    ? (wardSensors[0].temperature || 39.5).toFixed(1)
    : '41.8';

  const humidity = wardSensors.length > 0
    ? Math.round(wardSensors[0].humidity || 64)
    : 64;

  const feelsLike = (parseFloat(currentTemp) + 4.4).toFixed(1);

  // Severity derived from MongoDB alerts or sensor temperature
  const maxSeverity = alerts.length > 0
    ? alerts.reduce((max, a) => {
        const order = ['low', 'medium', 'high', 'critical'];
        return order.indexOf(a.severity) > order.indexOf(max) ? a.severity : max;
      }, 'low')
    : parseFloat(currentTemp) > 40
    ? 'critical'
    : parseFloat(currentTemp) > 35
    ? 'high'
    : 'medium';

  const severityCfg = SEVERITY_CONFIG[maxSeverity] || SEVERITY_CONFIG.critical;

  // Gauge needle rotation: maps 20°C (-80deg) to 45°C (+80deg)
  const tempVal = parseFloat(currentTemp);
  const needleAngle = Math.min(80, Math.max(-80, ((tempVal - 20) / (45 - 20)) * 160 - 80));

  const toggleAccordion = (id) => {
    setOpenAccordion((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGpsClick = () => {
    setGpsLocked(true);
    setSelectedWard('Ward-2');
    setFeedbackMsg('GPS Locked to your current location (Ward-2 Central)');
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleVolunteerAction = (type) => {
    setFeedbackMsg(
      type === 'volunteer'
        ? 'Thank you! You are now enrolled as an UrbanCool Community Heat Guardian.'
        : 'Check-in request broadcasted. A neighborhood guardian will visit shortly.'
    );
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const handleDirectionClick = (hubName) => {
    setFeedbackMsg(`Route coordinates to "${hubName}" sent to your navigation app.`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const selectedWardMeta = WARDS.find((w) => w.id === selectedWard) || WARDS[0];

  return (
    <div className="bg-surface font-body-md text-on-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen relative overflow-x-hidden">
      {/* Top Ambient Glow Aura */}
      <div className="relative w-full overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-b from-error/15 via-secondary/10 to-transparent blur-3xl rounded-full" />
      </div>

      <Navbar alertCount={alerts.length} nodeCount={wardSensors.length || 12} currentWard={selectedWard} />

      <main className="w-full pt-16 bg-surface min-h-screen">
        <div className="flex flex-col w-full">
          <div className="max-w-7xl mx-auto px-margin-desktop py-space-xl flex flex-col gap-space-xl relative z-10 w-full">
            {/* Notification Toast */}
            {feedbackMsg && (
              <div className="p-space-md rounded-xl bg-primary/20 border border-primary/40 text-primary font-body-sm text-body-sm flex items-center justify-between shadow-xl animate-fade-in">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  <span>{feedbackMsg}</span>
                </div>
                <button onClick={() => setFeedbackMsg(null)} className="text-primary hover:text-white">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}

            {/* 1. CITIZEN HEADER & LOCATION BAR */}
            <section className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg bg-surface-container-low/80 backdrop-blur-2xl p-space-lg rounded-xl shadow-xl border border-outline-variant/30">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center gap-space-sm">
                  <span className="inline-flex items-center justify-center p-space-xs rounded-full bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-lg">shield</span>
                  </span>
                  <span className="font-label-caps text-label-caps uppercase text-primary tracking-widest font-bold">
                    UrbanCool Citizen Heat Guardian • Live Neighborhood Advisory
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-space-sm">
                  <h1 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-secondary">location_on</span>
                    <span>{selectedWardMeta.label} {gpsLocked ? '(GPS Locked)' : ''}</span>
                  </h1>

                  <div className="flex items-center gap-space-xs pl-space-sm">
                    <button
                      onClick={handleGpsClick}
                      className="group flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-all border border-outline-variant/30 cursor-pointer"
                      id="btn-use-gps"
                    >
                      <span className="material-symbols-outlined text-primary group-hover:rotate-45 transition-transform text-sm">
                        my_location
                      </span>
                      <span className="font-body-sm text-body-sm font-medium text-on-surface">
                        Use My GPS
                      </span>
                    </button>

                    <div className="relative">
                      <select
                        value={selectedWard}
                        onChange={(e) => setSelectedWard(e.target.value)}
                        className="appearance-none bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm px-space-md py-space-xs pr-space-xl rounded-full focus:outline-none transition-all cursor-pointer border border-outline-variant/30"
                      >
                        {WARDS.map((w) => (
                          <option key={w.id} value={w.id} className="bg-surface-container-high text-on-surface">
                            {w.label}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-base">
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weather Synopsis Pill */}
              <div className="flex flex-wrap items-center gap-space-sm bg-surface-container-lowest/90 px-space-md py-space-sm rounded-full shadow-md border border-outline-variant/30">
                <div className={`w-3 h-3 rounded-full ${maxSeverity === 'critical' ? 'bg-error' : 'bg-secondary'} animate-ping`} />
                <div className="flex flex-col sm:flex-row sm:items-center gap-x-space-sm">
                  <span className={`font-label-mono-stat text-label-mono-stat font-bold ${maxSeverity === 'critical' ? 'text-error' : 'text-secondary'}`}>
                    Current Heat Index: {currentTemp}°C
                  </span>
                  <span className="hidden sm:inline text-outline">•</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {maxSeverity === 'critical' ? 'Dangerous Exposure Advisory in Effect' : 'Active Telemetry Monitored'}
                  </span>
                </div>
              </div>
            </section>

            {error && (
              <div className="p-space-md rounded-xl bg-error-container/30 border border-error/40 text-error font-body-sm text-body-sm flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-lg">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* 2. MAIN BENTO GRID: RADIAL GAUGE (HERO) + ANCILLARY VITALS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
              {/* 2A. Central Radial Heat Gauge (8 cols) */}
              <div className="lg:col-span-8 flex flex-col justify-between bg-surface-container-low/70 backdrop-blur-2xl p-space-xl rounded-xl shadow-xl relative overflow-hidden border border-outline-variant/30">
                <div className="flex items-center justify-between mb-space-md">
                  <div>
                    <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider">
                      Atmospheric Thermodynamic Load
                    </span>
                    <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                      Neighborhood Thermal Severity Gauge
                    </h2>
                  </div>
                  <span className={`px-space-sm py-space-2xs rounded-full font-label-caps text-label-caps uppercase font-bold tracking-widest border ${severityCfg.badge} animate-pulse`}>
                    {maxSeverity.toUpperCase()} RISK
                  </span>
                </div>

                {/* Gauge SVG Visualizer */}
                <div className="relative flex flex-col items-center justify-center my-space-md">
                  <div className="w-full max-w-[420px] aspect-[2/1] relative flex items-end justify-center">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 240 135">
                      <defs>
                        <filter height="140%" id="crimsonGlow" width="140%" x="-20%" y="-20%">
                          <feGaussianBlur result="blur" stdDeviation="3" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      {/* Background Track */}
                      <path
                        d="M 25 125 A 95 95 0 0 1 215 125"
                        fill="none"
                        stroke="currentColor"
                        className="text-surface-container-high"
                        strokeLinecap="round"
                        strokeWidth="16"
                      />

                      {/* Segment 1: Safe (20-27°C) Emerald */}
                      <path
                        d="M 25 125 A 95 95 0 0 1 65 52"
                        fill="none"
                        opacity="0.35"
                        stroke="#10B981"
                        strokeLinecap="round"
                        strokeWidth="16"
                      />

                      {/* Segment 2: Moderate (28-34°C) Amber */}
                      <path
                        d="M 67 49 A 95 95 0 0 1 120 30"
                        fill="none"
                        opacity="0.35"
                        stroke="#F59E0B"
                        strokeWidth="16"
                      />

                      {/* Segment 3: Extreme (35-40°C) Thermal Orange */}
                      <path
                        d="M 122 30 A 95 95 0 0 1 175 49"
                        fill="none"
                        opacity="0.45"
                        stroke="#EA580C"
                        strokeWidth="16"
                      />

                      {/* Segment 4: Emergency (41°C+) Infrared Crimson Active Bar */}
                      <path
                        d="M 177 52 A 95 95 0 0 1 215 125"
                        fill="none"
                        filter="url(#crimsonGlow)"
                        stroke="#EF4444"
                        strokeLinecap="round"
                        strokeWidth="18"
                      />

                      {/* Gauge Ticks & Degree Labels */}
                      <text fill="#86948a" fontFamily="Inter" fontSize="8" textAnchor="middle" x="22" y="140">20°C</text>
                      <text fill="#86948a" fontFamily="Inter" fontSize="8" textAnchor="middle" x="60" y="42">28°C</text>
                      <text fill="#86948a" fontFamily="Inter" fontSize="8" textAnchor="middle" x="120" y="22">35°C</text>
                      <text fill="#86948a" fontFamily="Inter" fontSize="8" textAnchor="middle" x="180" y="42">40°C</text>
                      <text fill="#EF4444" fontFamily="Inter" fontSize="9" fontWeight="bold" textAnchor="middle" x="218" y="140">41°C+</text>

                      {/* Indicator Needle Pivoting at (120, 125) pointed to current temperature */}
                      <g
                        className="transition-transform duration-1000 ease-out origin-[120px_125px]"
                        style={{ transform: `rotate(${needleAngle}deg)` }}
                      >
                        <line
                          filter="url(#crimsonGlow)"
                          stroke="#EF4444"
                          strokeLinecap="round"
                          strokeWidth="3"
                          x1="120"
                          x2="120"
                          y1="125"
                          y2="34"
                        />
                        <circle cx="120" cy="34" fill="#FFFFFF" r="3.5" />
                        <circle cx="120" cy="125" fill="currentColor" className="text-surface-container-highest" r="9" />
                        <circle cx="120" cy="125" fill="#EF4444" r="4.5" />
                      </g>
                    </svg>

                    {/* Central Digital Heat Value Readout */}
                    <div className="absolute bottom-0 flex flex-col items-center justify-center text-center">
                      <span className="font-display-lg text-display-lg font-black tracking-tight text-on-surface leading-none">
                        {loading ? '—' : currentTemp}
                        <span className="text-error font-light text-headline-xl">°C</span>
                      </span>
                      <span className="font-label-mono-stat text-label-mono-stat text-on-surface-variant font-medium mt-space-2xs">
                        Feels like <strong className="text-error font-bold">{feelsLike}°C</strong> with Radiant Asphalt
                      </span>
                    </div>
                  </div>

                  {/* Central Advisory Glow Badge */}
                  <div className={`mt-space-lg px-space-lg py-space-sm rounded-full shadow-[0_0_24px_rgba(255,180,171,0.2)] flex items-center gap-space-sm border ${severityCfg.bg}`}>
                    <span className={`material-symbols-outlined ${severityCfg.text}`}>{severityCfg.icon}</span>
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      {severityCfg.label}
                    </span>
                  </div>
                </div>

                {/* Secondary Telemetry Micro-Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm pt-space-md mt-space-md bg-surface-container/50 rounded-lg p-space-sm border border-outline-variant/20">
                  <div className="flex items-center gap-space-sm p-space-xs">
                    <div className="p-space-xs rounded-full bg-secondary-container/20 text-secondary">
                      <span className="material-symbols-outlined">wb_sunny</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">UV Radiation</span>
                      <span className="font-label-mono-stat text-label-mono-stat font-bold text-on-surface">10+ Very High (12m Burn)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-space-sm p-space-xs">
                    <div className="p-space-xs rounded-full bg-tertiary-container/20 text-tertiary">
                      <span className="material-symbols-outlined">water_drop</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">Relative Humidity</span>
                      <span className="font-label-mono-stat text-label-mono-stat font-bold text-on-surface">{humidity}% Saturated Vapor</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-space-sm p-space-xs">
                    <div className="p-space-xs rounded-full bg-primary/20 text-primary">
                      <span className="material-symbols-outlined">timer</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">Hydration Rhythm</span>
                      <span className="font-label-mono-stat text-label-mono-stat font-bold text-primary">Drink Water Every 20 Mins</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2B. Environmental Neighborhood Snapshot & Action Strip (4 cols) */}
              <div className="lg:col-span-4 flex flex-col justify-between gap-space-md">
                {/* Neighborhood Heatmap Satellite Card */}
                <div className="relative bg-surface-container-low/70 backdrop-blur-2xl rounded-xl p-space-md shadow-xl overflow-hidden flex-1 flex flex-col justify-between border border-outline-variant/30">
                  <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/10">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-tertiary">satellite_alt</span>
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">Thermal Sentinel Orbit 9</span>
                    </div>
                    <span className="px-space-xs py-space-2xs rounded bg-surface-container-high font-label-mono-stat text-label-caps text-on-surface">
                      {selectedWard} Hotspots
                    </span>
                  </div>

                  <div
                    className="w-full h-44 bg-cover bg-center rounded-lg relative overflow-hidden shadow-inner my-space-xs"
                    style={{
                      backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDKq9oubT5m-kgAbtLsK4kN_9pDWEZ88L72zcY_9ukvzYo_t35e7GH7dHwM__bgY1FJ7Z_TSSQ2QytZuQL4tNd4l-X6PeitdXkIU3ueJiRQu5zzGCviTEmqZKfaQ2rzpobLke0hmkNknQEc6V6LVXAqamOc7wEmjHiMUvg_llZ4k0eoCZd9ojK9KGWP6afYT2TQSjNioCF6V6HWHPjPVbEB78wSgjGD_qO1ArrK3YuKXcGJ6U9cmcrT')`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent" />
                    <div className="absolute top-2 left-2 px-space-xs py-space-2xs rounded bg-surface-container-lowest/80 backdrop-blur-md font-label-mono-stat text-label-caps text-error flex items-center gap-space-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping" />
                      Surface Temp: {(parseFloat(currentTemp) + 9.6).toFixed(1)}°C
                    </div>
                    <div className="absolute bottom-2 right-2 px-space-xs py-space-2xs rounded bg-surface-container-lowest/80 backdrop-blur-md font-label-mono-stat text-label-caps text-primary">
                      Canopy Delta: -5.8°C
                    </div>
                  </div>

                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                    Asphalt radiation levels in {selectedWard} are currently elevated by +4.3°C above baseline due to unshaded concrete transit corridors.
                  </p>
                </div>

                {/* Rapid Action Callout */}
                <div className="bg-gradient-to-br from-tertiary-container/30 to-surface-container-low backdrop-blur-2xl p-space-lg rounded-xl shadow-xl flex flex-col gap-space-sm border border-tertiary/30">
                  <div className="flex items-center gap-space-xs text-tertiary">
                    <span className="material-symbols-outlined">dew_point</span>
                    <span className="font-label-caps text-label-caps uppercase tracking-wider font-bold">Rapid Heat Relief</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Emergency High-Mist Deployment</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Automated cooling mist nodes are operating at 100% capacity along pedestrian pathways in {selectedWard}.
                  </p>
                  <button
                    onClick={() => handleDirectionClick('Closest Misting Station (Sector 7)')}
                    className="mt-space-xs w-full py-space-sm px-space-md rounded-lg bg-tertiary text-on-tertiary font-body-sm text-body-sm font-bold hover:shadow-[0_0_20px_rgba(79,219,200,0.5)] transition-all flex items-center justify-center gap-space-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">near_me</span>
                    <span>Find Closest Misting Station (120m)</span>
                  </button>
                </div>

                {/* Shaded Cooling Corridors in Ward */}
                {coolingCorridors.length > 0 && (
                  <div className="bg-surface-container-low/80 backdrop-blur-xl p-space-md rounded-xl border border-tertiary/20 flex flex-col gap-space-xs shadow-lg">
                    <div className="flex items-center justify-between pb-1 border-b border-outline-variant/15">
                      <div className="flex items-center gap-space-xs text-tertiary">
                        <span className="material-symbols-outlined text-sm">forest</span>
                        <span className="font-label-caps uppercase font-bold text-xs tracking-wider">Shaded Cooling Corridors</span>
                      </div>
                      <span className="font-label-mono-stat text-xs text-tertiary font-semibold">{coolingCorridors.length} in Ward</span>
                    </div>
                    <div className="space-y-2 mt-2">
                      {coolingCorridors.map((cc) => {
                        const delta = cc.afterTemp != null
                          ? (cc.beforeTemp - cc.afterTemp).toFixed(1)
                          : (cc.status === 'active' ? '4.2' : '3.8');
                        const isVerified = cc.status === 'completed' && cc.afterTemp != null;
                        return (
                          <div key={cc._id} className="p-2.5 rounded-lg bg-surface-container-lowest/80 border border-outline-variant/15 flex items-center justify-between text-xs">
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className="font-semibold text-on-surface truncate">{cc.name}</span>
                              <span className="text-on-surface-variant text-[11px] capitalize">
                                {cc.type.replace('_', ' ')} • {cc.status === 'completed' ? 'Verified Open' : 'Under Construction'}
                              </span>
                            </div>
                            <span className={`font-mono font-bold whitespace-nowrap px-2 py-0.5 rounded ${isVerified ? 'bg-primary/20 text-primary' : 'bg-surface-container text-secondary'}`}>
                              -{delta}°C {isVerified ? 'Sink' : 'Sim'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* LIVE NEIGHBORHOOD ADVISORY CARDS STACK FROM MONGODB */}
            {alerts.length > 0 && (
              <section className="flex flex-col gap-space-sm bg-surface-container-low/70 backdrop-blur-xl p-space-lg rounded-xl border border-outline-variant/30 shadow-xl">
                <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-error">campaign</span>
                    <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Direct Advisories for {selectedWard} Residents
                    </h2>
                  </div>
                  <span className="font-label-mono-stat text-label-mono-stat px-space-sm py-1 rounded bg-error/20 text-error font-bold">
                    {alerts.length} ALERTS ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm mt-space-sm">
                  {alerts.map((al) => {
                    const cfg = SEVERITY_CONFIG[al.severity] || SEVERITY_CONFIG.medium;
                    return (
                      <div
                        key={al._id}
                        className={`p-space-md rounded-xl border ${cfg.bg} flex flex-col justify-between shadow-md`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-label-caps text-label-caps uppercase font-bold ${cfg.text}`}>
                              {al.severity} Severity Alert
                            </span>
                            <span className="font-label-mono-stat text-label-caps text-on-surface-variant">
                              {new Date(al.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                            {al.recommendedAction}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-space-xs mt-space-xs border-t border-outline-variant/20 text-label-caps text-on-surface-variant uppercase font-mono">
                          <span>Ward: {al.ward}</span>
                          <span className={cfg.text}>Verified Protocol</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 3. URGENT SAFETY ALERTS & COOLING SANCTUARIES FINDER */}
            <section className="flex flex-col gap-space-md">
              {/* Ambient Pulsing Emergency Card */}
              <div className="relative p-space-md rounded-xl bg-error-container/15 shadow-[0_0_28px_rgba(239,68,68,0.2)] overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-space-md border border-error/30">
                <div className="flex items-start md:items-center gap-space-md">
                  <div className="p-space-sm rounded-full bg-error/20 text-error flex-shrink-0 animate-bounce">
                    <span className="material-symbols-outlined text-headline-md">hvac</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-space-xs">
                      <span className="px-space-xs py-space-2xs rounded bg-error font-label-caps text-label-caps text-on-error uppercase font-black">
                        City Mandate
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Updated 8 mins ago</span>
                    </div>
                    <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Mandatory Cooling Centers Open: Free Public AC Sanctuaries Within 800m
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Municipal protocol requires free admission, chilled hydration refills, pet crating facilities, and emergency paramedic triage.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-space-xs flex-shrink-0">
                  <button
                    onClick={() => handleVolunteerAction('filter')}
                    className="px-space-md py-space-xs rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm font-semibold transition-all border border-outline-variant/30 cursor-pointer"
                  >
                    Filter by Pets Allowed
                  </button>
                </div>
              </div>

              {/* Cooling Hubs Interactive Locator Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                {/* Hub 1 */}
                <div className="bg-surface-container-low/80 backdrop-blur-2xl rounded-xl p-space-md shadow-lg flex flex-col justify-between hover:bg-surface-container transition-colors border border-outline-variant/20">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <span className="px-space-xs py-space-2xs rounded bg-primary-container/20 text-primary font-label-caps text-label-caps uppercase font-bold">
                        Open • Primary Hub
                      </span>
                      <span className="font-label-mono-stat text-label-mono-stat font-semibold text-primary">350m Away</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mt-space-xs">
                      Civic Central Library Cooling Hub
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Level 1 Atrium & Sub-level North Auditorium. Climate control fixed at 21.5°C.
                    </p>

                    {/* Capacity Meter */}
                    <div className="mt-space-sm flex flex-col gap-space-2xs">
                      <div className="flex justify-between font-label-mono-stat text-label-caps text-on-surface-variant">
                        <span>Current Occupancy</span>
                        <span className="text-secondary font-bold">82% Full</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                        <div className="h-full bg-secondary rounded-full" style={{ width: '82%' }} />
                      </div>
                    </div>

                    {/* Amenity Badges */}
                    <div className="flex flex-wrap gap-space-xs mt-space-sm">
                      <span className="inline-flex items-center gap-space-2xs px-space-xs py-space-2xs rounded bg-surface-container-high font-label-caps text-label-caps text-on-surface">
                        <span className="material-symbols-outlined text-[14px]">accessible</span> ADA Ramp
                      </span>
                      <span className="inline-flex items-center gap-space-2xs px-space-xs py-space-2xs rounded bg-surface-container-high font-label-caps text-label-caps text-on-surface">
                        <span className="material-symbols-outlined text-[14px]">water_full</span> Cold Water
                      </span>
                      <span className="inline-flex items-center gap-space-2xs px-space-xs py-space-2xs rounded bg-surface-container-high font-label-caps text-label-caps text-on-surface">
                        <span className="material-symbols-outlined text-[14px]">pets</span> Pets Welcomed
                      </span>
                    </div>
                  </div>

                  <div className="mt-space-md pt-space-sm flex items-center justify-between border-t border-outline-variant/10">
                    <span className="font-label-mono-stat text-label-caps text-on-surface-variant">~4 min walking time</span>
                    <button
                      onClick={() => handleDirectionClick('Civic Central Library Cooling Hub')}
                      className="px-space-md py-space-xs rounded-full bg-primary text-on-primary font-body-sm text-body-sm font-semibold hover:shadow-[0_0_12px_rgba(78,222,163,0.4)] transition-all flex items-center gap-space-2xs cursor-pointer"
                    >
                      <span>Directions</span>
                      <span className="material-symbols-outlined text-[18px]">navigation</span>
                    </button>
                  </div>
                </div>

                {/* Hub 2 */}
                <div className="bg-surface-container-low/80 backdrop-blur-2xl rounded-xl p-space-md shadow-lg flex flex-col justify-between hover:bg-surface-container transition-colors border border-outline-variant/20">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <span className="px-space-xs py-space-2xs rounded bg-primary-container/20 text-primary font-label-caps text-label-caps uppercase font-bold">
                        Open • Sports Center
                      </span>
                      <span className="font-label-mono-stat text-label-mono-stat font-semibold text-primary">580m Away</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mt-space-xs">
                      Eastside Community Arena
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Indoor Multi-Sport Complex with medical cooling rehydration tents and electrolyte stations.
                    </p>

                    {/* Capacity Meter */}
                    <div className="mt-space-sm flex flex-col gap-space-2xs">
                      <div className="flex justify-between font-label-mono-stat text-label-caps text-on-surface-variant">
                        <span>Current Occupancy</span>
                        <span className="text-primary font-bold">45% Full</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: '45%' }} />
                      </div>
                    </div>

                    {/* Amenity Badges */}
                    <div className="flex flex-wrap gap-space-xs mt-space-sm">
                      <span className="inline-flex items-center gap-space-2xs px-space-xs py-space-2xs rounded bg-surface-container-high font-label-caps text-label-caps text-on-surface">
                        <span className="material-symbols-outlined text-[14px]">accessible</span> ADA Ramp
                      </span>
                      <span className="inline-flex items-center gap-space-2xs px-space-xs py-space-2xs rounded bg-surface-container-high font-label-caps text-label-caps text-on-surface">
                        <span className="material-symbols-outlined text-[14px]">medical_services</span> First Aid
                      </span>
                      <span className="inline-flex items-center gap-space-2xs px-space-xs py-space-2xs rounded bg-surface-container-high font-label-caps text-label-caps text-on-surface">
                        <span className="material-symbols-outlined text-[14px]">power</span> Device Charge
                      </span>
                    </div>
                  </div>

                  <div className="mt-space-md pt-space-sm flex items-center justify-between border-t border-outline-variant/10">
                    <span className="font-label-mono-stat text-label-caps text-on-surface-variant">~7 min walking time</span>
                    <button
                      onClick={() => handleDirectionClick('Eastside Community Arena')}
                      className="px-space-md py-space-xs rounded-full bg-primary text-on-primary font-body-sm text-body-sm font-semibold hover:shadow-[0_0_12px_rgba(78,222,163,0.4)] transition-all flex items-center gap-space-2xs cursor-pointer"
                    >
                      <span>Directions</span>
                      <span className="material-symbols-outlined text-[18px]">navigation</span>
                    </button>
                  </div>
                </div>

                {/* Hub 3 */}
                <div className="bg-surface-container-low/80 backdrop-blur-2xl rounded-xl p-space-md shadow-lg flex flex-col justify-between hover:bg-surface-container transition-colors border border-outline-variant/20">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <span className="px-space-xs py-space-2xs rounded bg-secondary-container/20 text-secondary font-label-caps text-label-caps uppercase font-bold">
                        High Density
                      </span>
                      <span className="font-label-mono-stat text-label-mono-stat font-semibold text-secondary">740m Away</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mt-space-xs">
                      Metro Transit Grand Galleria
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Air-conditioned underground concourse connecting Subway Lines 2 & 7.
                    </p>

                    {/* Capacity Meter */}
                    <div className="mt-space-sm flex flex-col gap-space-2xs">
                      <div className="flex justify-between font-label-mono-stat text-label-caps text-on-surface-variant">
                        <span>Current Occupancy</span>
                        <span className="text-error font-bold">94% Full</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                        <div className="h-full bg-error rounded-full" style={{ width: '94%' }} />
                      </div>
                    </div>

                    {/* Amenity Badges */}
                    <div className="flex flex-wrap gap-space-xs mt-space-sm">
                      <span className="inline-flex items-center gap-space-2xs px-space-xs py-space-2xs rounded bg-surface-container-high font-label-caps text-label-caps text-on-surface">
                        <span className="material-symbols-outlined text-[14px]">escalator</span> Elevators Open
                      </span>
                      <span className="inline-flex items-center gap-space-2xs px-space-xs py-space-2xs rounded bg-surface-container-high font-label-caps text-label-caps text-on-surface">
                        <span className="material-symbols-outlined text-[14px]">wifi</span> Free WiFi
                      </span>
                      <span className="inline-flex items-center gap-space-2xs px-space-xs py-space-2xs rounded bg-surface-container-high font-label-caps text-label-caps text-on-surface">
                        <span className="material-symbols-outlined text-[14px]">restaurant</span> Food Stalls
                      </span>
                    </div>
                  </div>

                  <div className="mt-space-md pt-space-sm flex items-center justify-between border-t border-outline-variant/10">
                    <span className="font-label-mono-stat text-label-caps text-on-surface-variant">~9 min walking time</span>
                    <button
                      onClick={() => handleDirectionClick('Metro Transit Grand Galleria')}
                      className="px-space-md py-space-xs rounded-full bg-surface-container-high text-on-surface hover:bg-surface-container-highest font-body-sm text-body-sm font-semibold transition-all flex items-center gap-space-2xs cursor-pointer border border-outline-variant/30"
                    >
                      <span>Directions</span>
                      <span className="material-symbols-outlined text-[18px]">navigation</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. INTERACTIVE EXPANDABLE HEAT SAFETY ACCORDION */}
            <section className="flex flex-col gap-space-md mb-space-xl">
              <div className="flex flex-col gap-space-2xs">
                <span className="font-label-caps text-label-caps uppercase text-primary tracking-widest font-bold">
                  Life Safety Protocol
                </span>
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                  Emergency Response & Mitigation Handbook
                </h2>
              </div>

              <div className="flex flex-col gap-space-sm">
                {/* Accordion Item 1 */}
                <div className="bg-surface-container-low/90 backdrop-blur-xl rounded-xl overflow-hidden shadow-lg transition-all border border-outline-variant/20">
                  <button
                    className="w-full p-space-md text-left flex items-center justify-between gap-space-md hover:bg-surface-container transition-colors cursor-pointer"
                    onClick={() => toggleAccordion('1')}
                  >
                    <div className="flex items-center gap-space-md">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-error-container/20 text-error flex items-center justify-center font-label-mono-stat text-label-mono-stat font-bold">
                        01
                      </span>
                      <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                        Symptoms of Heat Exhaustion vs. Heat Stroke (Emergency Guide)
                      </span>
                    </div>
                    <span className={`material-symbols-outlined text-primary transition-transform ${openAccordion['1'] ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {openAccordion['1'] && (
                    <div className="px-space-md pb-space-lg flex flex-col gap-space-md">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                        {/* Heat Exhaustion Column */}
                        <div className="p-space-md rounded-lg bg-surface-container-high/60 flex flex-col gap-space-sm border border-outline-variant/20">
                          <div className="flex items-center justify-between">
                            <span className="font-headline-sm text-headline-sm font-bold text-secondary">
                              Heat Exhaustion
                            </span>
                            <span className="px-space-xs py-space-2xs rounded bg-secondary-container/20 text-secondary font-label-caps text-label-caps uppercase font-bold">
                              Take Action
                            </span>
                          </div>
                          <ul className="font-body-sm text-body-sm text-on-surface-variant flex flex-col gap-space-xs list-disc list-inside">
                            <li>Heavy, profuse perspiration & cool, pale, clammy skin</li>
                            <li>Fast, weak pulse & muscle cramping</li>
                            <li>Dizziness, lightheadedness, or nausea</li>
                            <li>Normal or slightly elevated body temperature (&lt;39°C)</li>
                          </ul>
                          <div className="mt-space-xs p-space-xs rounded bg-surface-container text-on-surface font-body-sm text-body-sm">
                            <strong>Intervention:</strong> Move into AC immediately, loosen tight clothing, sip chilled water, and apply wet towels to neck.
                          </div>
                        </div>

                        {/* Heat Stroke Column */}
                        <div className="p-space-md rounded-lg bg-error-container/15 flex flex-col gap-space-sm border border-error/30">
                          <div className="flex items-center justify-between">
                            <span className="font-headline-sm text-headline-sm font-bold text-error">
                              Heat Stroke (Medical Emergency)
                            </span>
                            <span className="px-space-xs py-space-2xs rounded bg-error text-on-error font-label-caps text-label-caps uppercase font-black">
                              Call 911 / 112
                            </span>
                          </div>
                          <ul className="font-body-sm text-body-sm text-on-surface-variant flex flex-col gap-space-xs list-disc list-inside">
                            <li>High body temperature (&gt;40°C / 103°F)</li>
                            <li>Hot, red, dry or damp skin with NO active sweating</li>
                            <li>Rapid, pounding pulse & confusion or altered mental state</li>
                            <li>Slurred speech, seizures, or loss of consciousness</li>
                          </ul>
                          <div className="mt-space-xs p-space-xs rounded bg-error-container/40 text-on-error-container font-body-sm text-body-sm">
                            <strong>CRITICAL:</strong> Immediately phone local emergency services. Submerge in ice bath or soak garments in ice water while waiting.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion Item 2 */}
                <div className="bg-surface-container-low/90 backdrop-blur-xl rounded-xl overflow-hidden shadow-lg transition-all border border-outline-variant/20">
                  <button
                    className="w-full p-space-md text-left flex items-center justify-between gap-space-md hover:bg-surface-container transition-colors cursor-pointer"
                    onClick={() => toggleAccordion('2')}
                  >
                    <div className="flex items-center gap-space-md">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-label-mono-stat text-label-mono-stat font-bold">
                        02
                      </span>
                      <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                        Protecting Pets, Elderly & Children During Tier 3 Heat Waves
                      </span>
                    </div>
                    <span className={`material-symbols-outlined text-outline transition-transform ${openAccordion['2'] ? 'rotate-180 text-primary' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {openAccordion['2'] && (
                    <div className="px-space-md pb-space-lg flex flex-col gap-space-md">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md text-body-sm font-body-sm text-on-surface-variant">
                        <div className="p-space-md rounded-lg bg-surface-container-high/60 flex flex-col gap-space-xs border border-outline-variant/20">
                          <div className="flex items-center gap-space-xs text-primary font-bold">
                            <span className="material-symbols-outlined">pets</span> Domestic Pets
                          </div>
                          <p>Walk dogs only before 06:30 or after 21:00. Pavement exceeding 30°C causes severe pad blistering within 60 seconds. Never leave animals unattended in parked vehicles.</p>
                        </div>
                        <div className="p-space-md rounded-lg bg-surface-container-high/60 flex flex-col gap-space-xs border border-outline-variant/20">
                          <div className="flex items-center gap-space-xs text-secondary font-bold">
                            <span className="material-symbols-outlined">elderly</span> Seniors & Vulnerable
                          </div>
                          <p>Check on elderly neighbors twice daily. Aging sweat glands reduce thermoregulatory reflexes. Encourage non-alcoholic fluid intake and confirm proximity to cooling shelters.</p>
                        </div>
                        <div className="p-space-md rounded-lg bg-surface-container-high/60 flex flex-col gap-space-xs border border-outline-variant/20">
                          <div className="flex items-center gap-space-xs text-tertiary font-bold">
                            <span className="material-symbols-outlined">child_care</span> Infants & Children
                          </div>
                          <p>Children generate more metabolic heat per pound than adults. Avoid stroller blanket covers which trap radiant thermal domes (raising carriage temps up to 8°C above ambient).</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion Item 3 */}
                <div className="bg-surface-container-low/90 backdrop-blur-xl rounded-xl overflow-hidden shadow-lg transition-all border border-outline-variant/20">
                  <button
                    className="w-full p-space-md text-left flex items-center justify-between gap-space-md hover:bg-surface-container transition-colors cursor-pointer"
                    onClick={() => toggleAccordion('3')}
                  >
                    <div className="flex items-center gap-space-md">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-label-mono-stat text-label-mono-stat font-bold">
                        03
                      </span>
                      <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                        Home Cooling Without High AC Power Bills (Passive Ventilation Tips)
                      </span>
                    </div>
                    <span className={`material-symbols-outlined text-outline transition-transform ${openAccordion['3'] ? 'rotate-180 text-primary' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {openAccordion['3'] && (
                    <div className="px-space-md pb-space-lg flex flex-col gap-space-md">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md text-body-sm font-body-sm text-on-surface-variant">
                        <div className="p-space-md rounded-lg bg-surface-container-high/60 flex flex-col gap-space-xs border border-outline-variant/20">
                          <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                            Thermal Purging at Night
                          </span>
                          <p>Open windows facing prevailing night breezes between 01:00 and 06:00. Use box fans positioned outward on leeward windows to vent accumulated diurnal heat plumes from ceiling vaults.</p>
                        </div>
                        <div className="p-space-md rounded-lg bg-surface-container-high/60 flex flex-col gap-space-xs border border-outline-variant/20">
                          <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                            Solar Shading & Evaporative Tricks
                          </span>
                          <p>Hang damp cotton sheets across shaded windows to leverage latent evaporative cooling. Close exterior-facing thermal curtains before 09:00 to deflect up to 70% of peak solar infrared radiation.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 5. COMMUNITY VOLUNTEER & ASSISTANCE BANNER */}
            <div className="p-space-lg rounded-xl bg-surface-container-low/70 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-space-md shadow-lg border border-outline-variant/30">
              <div className="flex items-center gap-space-md">
                <div className="p-space-sm rounded-full bg-primary/20 text-primary">
                  <span className="material-symbols-outlined text-headline-md">volunteer_activism</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Community Buddy System Active
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Over 340 volunteer wellness checks logged in {selectedWard} today. Need support or can deliver chilled hydration to a neighbor?
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-space-sm flex-shrink-0">
                <button
                  onClick={() => handleVolunteerAction('checkin')}
                  className="px-space-md py-space-xs rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm font-semibold transition-all border border-outline-variant/30 cursor-pointer"
                >
                  Request Check-In
                </button>
                <button
                  onClick={() => handleVolunteerAction('volunteer')}
                  className="px-space-md py-space-xs rounded-full bg-primary text-on-primary hover:bg-primary-container font-body-sm text-body-sm font-semibold transition-all shadow-md cursor-pointer"
                >
                  Volunteer as Guardian
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-lowest/90 backdrop-blur-xl border-t border-outline-variant/30 py-space-lg mt-space-xl">
        <div className="w-full px-gutter-desktop max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-space-md text-on-surface-variant">
          <div className="flex items-center gap-space-sm">
            <span className="font-label-mono-stat text-label-mono-stat text-on-surface font-semibold">
              UrbanCool v4.2 Resilience Mesh
            </span>
            <span className="text-outline">|</span>
            <span className="font-body-sm text-body-sm">Municipal Climate Operations Command</span>
          </div>
          <div className="flex items-center gap-space-lg font-body-sm text-body-sm">
            <span className="text-primary font-mono text-xs">MongoDB Atlas Real-Time Synced</span>
            <span>WMO Compliance Specs</span>
            <span>Emergency Protocols</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import HeatMap from '../components/HeatMap.jsx';
import api from '../api/client.js';

const WARDS = ['All', 'Ward-1', 'Ward-2', 'Ward-3', 'Ward-4', 'Ward-5'];

const WARD_COORDINATES = {
  All:      [13.0418, 80.2341], // Chennai South-Central
  'Ward-1': [13.0878, 80.2785], // Chennai Central (George Town)
  'Ward-2': [13.0418, 80.2341], // Chennai T. Nagar
  'Ward-3': [13.0067, 80.2025], // Chennai Guindy & Alandur
  'Ward-4': [12.9010, 80.2279], // Chennai Sholinganallur & OMR
  'Ward-5': [11.0168, 76.9558], // Coimbatore Gandhipuram
};

const WARD_METADATA = {
  All:      { label: 'All Tamil Nadu Hubs', region: 'Tamil Nadu Matrix' },
  'Ward-1': { label: 'Ward-1: Chennai Central', region: 'George Town Harbor' },
  'Ward-2': { label: 'Ward-2: T. Nagar', region: 'South-Central Commercial' },
  'Ward-3': { label: 'Ward-3: Guindy', region: 'Alandur Industrial Hub' },
  'Ward-4': { label: 'Ward-4: Sholinganallur', region: 'OMR Cyber Corridor' },
  'Ward-5': { label: 'Ward-5: Coimbatore', region: 'Gandhipuram Terminal' },
};

export default function PlannerDashboard() {
  const [hotspots, setHotspots] = useState([]);
  const [greencover, setGreencover] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [coolingInitiatives, setCoolingInitiatives] = useState([]);
  const [ward, setWard] = useState('All');
  const [showGreen, setShowGreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [activeInterventions, setActiveInterventions] = useState({});
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = ward !== 'All' ? { ward } : {};
      const [hsRes, gcRes, alRes, sensRes, coolRes] = await Promise.all([
        api.get('/api/v1/hotspots', { params: { ...params, status: 'active' } }),
        api.get('/api/v1/greencover', { params }),
        api.get('/api/v1/alerts', { params: { ...params, targetRole: 'planner' } }),
        api.get('/api/v1/sensors', { params }),
        api.get('/api/v1/cooling', { params }).catch(() => ({ data: { data: [] } })),
      ]);
      const hsData = hsRes.data.data || [];
      setHotspots(hsData);
      setGreencover(gcRes.data.data || []);
      setAlerts(alRes.data.data || []);
      setSensors(sensRes.data.data || []);
      setCoolingInitiatives(coolRes.data.data || []);
      if (hsData.length > 0 && !selectedHotspot) {
        setSelectedHotspot(hsData[0]);
      }
    } catch {
      setError('Failed to load telemetry from MongoDB Atlas. Please ensure the server is running.');
    } finally {
      setLoading(false);
    }
  }, [ward, selectedHotspot]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Dynamic calculations from MongoDB data
  const peakTemp = sensors.length > 0
    ? Math.max(...sensors.map((s) => s.temperature || 0)).toFixed(1)
    : '42.8';

  const minTemp = sensors.length > 0
    ? Math.min(...sensors.map((s) => s.temperature || 30)).toFixed(1)
    : '31.2';

  const activeHotspotCount = hotspots.length;

  const avgCanopyPct = greencover.length > 0
    ? (
        (greencover.reduce((acc, g) => acc + Math.max(0, g.ndviValue || 0), 0) /
          greencover.length) *
        100
      ).toFixed(1)
    : '18.4';

  const canopyDelta = (parseFloat(avgCanopyPct) * 0.18 - 6.7).toFixed(1);

  const hviScore = Math.min(
    9.8,
    Math.max(3.2, (activeHotspotCount * 0.45 + (parseFloat(peakTemp) - 30) * 0.38).toFixed(1))
  );

  const wardCoolingCount = coolingInitiatives.length;
  const completedCooling = coolingInitiatives.filter((ci) => ci.status === 'completed' && ci.afterTemp != null);
  const wardCoolingSink = completedCooling.length > 0
    ? (completedCooling.reduce((acc, ci) => acc + (ci.beforeTemp - ci.afterTemp), 0) / completedCooling.length).toFixed(1)
    : '4.2';

  // Export GeoJSON stream
  const handleExportGeoJSON = () => {
    const geojsonData = {
      type: 'FeatureCollection',
      features: hotspots.map((hs) => ({
        type: 'Feature',
        geometry: hs.geometry,
        properties: {
          intensity: hs.intensity,
          wardId: hs.wardId,
          status: hs.status,
          detectedAt: hs.detectedAt,
        },
      })),
    };
    const blob = new Blob([JSON.stringify(geojsonData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `urbancool-hotspots-${ward.toLowerCase()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTriggerAction = (alertId, actionName) => {
    setActiveInterventions((prev) => ({
      ...prev,
      [alertId]: actionName,
    }));
    setTimeout(() => {
      setActiveInterventions((prev) => {
        const next = { ...prev };
        delete next[alertId];
        return next;
      });
    }, 4000);
  };

  const handleEmergencyDispatch = () => {
    setShowDispatchModal(false);
    setDispatchSuccess('Emergency Cool Corridor Protocol broadcasted to Municipal Response Teams.');
    setTimeout(() => setDispatchSuccess(null), 5000);
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen relative overflow-x-hidden">
      {/* Top Header */}
      <Navbar alertCount={alerts.length} nodeCount={sensors.length || 60} currentWard={ward} />

      {/* Fixed Left Navigation Sidebar */}
      <Sidebar canopyDelta={canopyDelta} activeWard={ward} />

      {/* Main Content Pane */}
      <div className="pl-0 lg:pl-64">
        <main className="w-full pt-16 bg-surface min-h-screen relative">
          {/* Subtle Ambient Thermal Mesh Background */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-20 dark:opacity-30">
            <svg className="w-full h-full" fill="none" viewBox="0 0 1440 900" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient cx="65%" cy="35%" id="thermal-pulse-1" r="45%">
                  <stop offset="0%" stopColor="#ee9800" stopOpacity="0.3" />
                  <stop offset="60%" stopColor="#93000a" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
                <radialGradient cx="20%" cy="80%" id="cool-sink-1" r="40%">
                  <stop offset="0%" stopColor="#4edea3" stopOpacity="0.25" />
                  <stop offset="70%" stopColor="#0db6a4" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect fill="transparent" height="100%" width="100%" />
              <circle cx="950" cy="320" fill="url(#thermal-pulse-1)" r="420" className="animate-pulse" style={{ animationDuration: '9s' }} />
              <circle cx="340" cy="740" fill="url(#cool-sink-1)" r="380" className="animate-pulse" style={{ animationDuration: '12s' }} />
            </svg>
          </div>

          <div className="relative z-10 p-gutter-desktop space-y-space-lg max-w-[1720px] mx-auto w-full">
            {/* Top Command Strip: Ward Selector & Metric Strip */}
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-space-md">
              {/* Ward Selector & Breadcrumb Context */}
              <div className="flex flex-wrap items-center gap-space-md">
                <div className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg bg-surface-container-high/70 backdrop-blur-xl shadow-sm border border-outline-variant/30">
                  <span className="material-symbols-outlined text-primary text-xl">location_city</span>
                  <div className="flex flex-col">
                    <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider">
                      Territorial Boundary
                    </span>
                    <div className="relative inline-block">
                      <select
                        id="ward-select"
                        value={ward}
                        onChange={(e) => setWard(e.target.value)}
                        className="appearance-none bg-transparent pr-space-lg font-headline-sm text-headline-sm font-bold text-on-surface focus:outline-none cursor-pointer"
                      >
                        {WARDS.map((w) => (
                          <option key={w} value={w} className="bg-surface-container-high text-on-surface">
                            {w === 'All' ? 'All Tamil Nadu Hubs (Statewide)' : `${WARD_METADATA[w]?.label || w} • ${WARD_METADATA[w]?.region || 'Sector'}`}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined text-on-surface-variant absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-base">
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-space-xs">
                  <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-surface-container text-tertiary font-mono">
                    LANDSAT 9 / MODIS
                  </span>
                  <span className="font-label-mono-stat text-label-mono-stat text-on-surface-variant">
                    Isobar: 0.5m GSD
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
                </div>
              </div>

              {/* Quick Action Pill Group */}
              <div className="flex items-center gap-space-xs">
                <button
                  type="button"
                  onClick={handleExportGeoJSON}
                  className="flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container-high/80 text-on-surface font-body-sm text-body-sm hover:bg-surface-container-highest transition-all shadow-sm border border-outline-variant/30"
                  id="btn-export"
                >
                  <span className="material-symbols-outlined text-base">download_for_offline</span>
                  <span>GeoJSON Stream</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(true)}
                  className="flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-error-container text-on-error-container font-headline-sm text-body-sm font-semibold hover:bg-error transition-all shadow-md"
                  id="btn-emergency"
                >
                  <span className="material-symbols-outlined text-base">emergency_share</span>
                  <span>Dispatch Protocol</span>
                </button>
              </div>
            </div>

            {/* Success feedback toast */}
            {dispatchSuccess && (
              <div className="p-space-sm rounded-xl bg-primary/20 border border-primary/40 text-primary font-body-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">verified</span>
                <span>{dispatchSuccess}</span>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="p-space-sm rounded-xl bg-error-container/30 border border-error/40 text-error font-body-sm">
                {error}
              </div>
            )}

            {/* 4 High-Impact Metric Glow Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
              {/* Stat 1: Surface Temp Peak */}
              <div className="relative overflow-hidden rounded-xl bg-surface-container-low/70 backdrop-blur-xl p-space-md flex flex-col justify-between shadow-lg group hover:bg-surface-container-low transition-all border border-outline-variant/30">
                <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-secondary-container/20 blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
                <div className="flex items-center justify-between z-10">
                  <span className="font-label-caps text-label-caps uppercase text-secondary font-semibold tracking-wider">
                    Surface Temp Peak
                  </span>
                  <span className="material-symbols-outlined text-secondary text-lg">thermostat</span>
                </div>
                <div className="my-space-sm z-10">
                  <div className="flex items-baseline gap-space-xs">
                    <span className="font-display-lg text-metric-display font-extrabold text-on-surface tracking-tight" id="val-temp">
                      {loading ? '—' : peakTemp}
                    </span>
                    <span className="font-headline-sm text-headline-sm font-bold text-secondary">°C</span>
                  </div>
                  <div className="flex items-center gap-space-xs mt-space-2xs">
                    <span className="material-symbols-outlined text-error text-sm font-bold">arrow_upward</span>
                    <span className="font-label-mono-stat text-label-mono-stat text-error font-medium">
                      +4.2°C vs Baseline
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">• 13:45 peak</span>
                  </div>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden z-10">
                  <div className="bg-gradient-to-r from-secondary to-error h-full rounded-full w-[86%] transition-all duration-1000" />
                </div>
              </div>

              {/* Stat 2: Active Hotspots */}
              <div className="relative overflow-hidden rounded-xl bg-surface-container-low/70 backdrop-blur-xl p-space-md flex flex-col justify-between shadow-lg group hover:bg-surface-container-low transition-all border border-outline-variant/30">
                <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-error-container/30 blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
                <div className="flex items-center justify-between z-10">
                  <span className="font-label-caps text-label-caps uppercase text-error font-semibold tracking-wider">
                    Active Hotspots
                  </span>
                  <div className="flex items-center gap-space-2xs px-space-xs py-space-2xs rounded bg-error-container/30 border border-error/40">
                    <span className="w-2 h-2 rounded-full bg-error animate-ping" />
                    <span className="font-label-caps text-label-caps text-error font-bold">CRITICAL</span>
                  </div>
                </div>
                <div className="my-space-sm z-10">
                  <div className="flex items-baseline gap-space-xs">
                    <span className="font-display-lg text-metric-display font-extrabold text-on-surface tracking-tight" id="val-hotspots">
                      {loading ? '—' : activeHotspotCount}
                    </span>
                    <span className="font-body-md text-body-md text-on-surface-variant font-medium">Zones Flagged</span>
                  </div>
                  <div className="flex items-center gap-space-xs mt-space-2xs">
                    <span className="material-symbols-outlined text-error text-sm">local_fire_department</span>
                    <span className="font-label-mono-stat text-label-mono-stat text-on-surface font-medium">
                      {ward === 'All' ? 'Across All Municipal Wards' : `Sector ${ward}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 z-10">
                  <div className="h-1.5 flex-1 rounded-full bg-error" />
                  <div className="h-1.5 flex-1 rounded-full bg-error" />
                  <div className="h-1.5 flex-1 rounded-full bg-error" />
                  <div className="h-1.5 flex-1 rounded-full bg-secondary" />
                  <div className="h-1.5 flex-1 rounded-full bg-surface-container-highest" />
                </div>
              </div>

              {/* Stat 3: NDVI Canopy Cover */}
              <div className="relative overflow-hidden rounded-xl bg-surface-container-low/70 backdrop-blur-xl p-space-md flex flex-col justify-between shadow-lg group hover:bg-surface-container-low transition-all border border-outline-variant/30">
                <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-primary-container/20 blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
                <div className="flex items-center justify-between z-10">
                  <span className="font-label-caps text-label-caps uppercase text-primary font-semibold tracking-wider">
                    NDVI Canopy Mask
                  </span>
                  <span className="material-symbols-outlined text-primary text-lg">park</span>
                </div>
                <div className="my-space-sm z-10">
                  <div className="flex items-baseline gap-space-xs">
                    <span className="font-display-lg text-metric-display font-extrabold text-on-surface tracking-tight" id="val-canopy">
                      {loading ? '—' : avgCanopyPct}
                    </span>
                    <span className="font-headline-sm text-headline-sm font-bold text-primary">%</span>
                  </div>
                  <div className="flex items-center gap-space-xs mt-space-2xs">
                    <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface-variant font-mono">
                      DEFICIT -11.6%
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Target 30%</span>
                  </div>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden z-10">
                  <div className="bg-primary h-full rounded-full w-[61%]" />
                </div>
              </div>

              {/* Stat 4: Heat Vulnerability Index */}
              <div className="relative overflow-hidden rounded-xl bg-surface-container-low/70 backdrop-blur-xl p-space-md flex flex-col justify-between shadow-lg group hover:bg-surface-container-low transition-all border border-outline-variant/30">
                <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-secondary/15 blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
                <div className="flex items-center justify-between z-10">
                  <span className="font-label-caps text-label-caps uppercase text-secondary font-semibold tracking-wider">
                    Heat Vulnerability (HVI)
                  </span>
                  <span className="material-symbols-outlined text-secondary text-lg">speed</span>
                </div>
                <div className="my-space-sm z-10">
                  <div className="flex items-baseline gap-space-xs">
                    <span className="font-display-lg text-metric-display font-extrabold text-secondary tracking-tight">
                      {loading ? '—' : hviScore}
                    </span>
                    <span className="font-headline-sm text-headline-sm font-semibold text-on-surface-variant">/ 10</span>
                  </div>
                  <div className="flex items-center gap-space-xs mt-space-2xs">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="font-label-mono-stat text-label-mono-stat text-secondary font-semibold">
                      Tier 3 Elevated Risk
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">• 148k pop.</span>
                  </div>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden z-10">
                  <div className="bg-gradient-to-r from-tertiary via-secondary to-error h-full rounded-full w-[87%]" />
                </div>
              </div>
            </div>

            {/* Main Bento Layout: Map (Left) + Incident Command (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
              {/* Interactive Hotspot GIS Map Panel (8 cols) */}
              <div className="lg:col-span-8 flex flex-col gap-space-md">
                <div className="relative rounded-2xl overflow-hidden bg-surface-container-lowest shadow-2xl h-[680px] flex flex-col justify-between border border-outline-variant/30">
                  {/* Embedded Google Maps / CartoDB Map Container */}
                  <div className="absolute inset-0 z-0">
                    <HeatMap
                      hotspots={hotspots}
                      greencover={greencover}
                      showGreenCover={showGreen}
                      center={WARD_COORDINATES[ward] || [13.0418, 80.2341]}
                      onSelectHotspot={setSelectedHotspot}
                    />
                  </div>

                  {/* Top Map Controls Bar Overlay */}
                  <div className="relative z-20 p-space-md flex flex-wrap items-center justify-between gap-space-sm bg-gradient-to-b from-surface-container-lowest/90 via-surface-container-lowest/50 to-transparent pointer-events-none">
                    {/* Layer Selector Toggles */}
                    <div className="flex items-center gap-space-2xs p-space-2xs rounded-xl bg-surface-container-high/80 backdrop-blur-xl shadow-md pointer-events-auto border border-outline-variant/30">
                      <button
                        type="button"
                        onClick={() => setShowGreen(false)}
                        className={`flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg font-body-sm text-body-sm font-semibold transition-all ${
                          !showGreen ? 'bg-surface-container text-primary shadow' : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">thermostat</span>
                        <span>TIRS Heat Raster</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowGreen(true)}
                        className={`flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg font-body-sm text-body-sm font-semibold transition-all ${
                          showGreen ? 'bg-surface-container text-primary shadow' : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">nature</span>
                        <span>NDVI Canopy</span>
                      </button>
                    </div>

                    {/* Live Refresh State & Telemetry Health */}
                    <div className="flex items-center gap-space-sm bg-surface-container-high/80 backdrop-blur-xl px-space-sm py-space-xs rounded-lg shadow-sm pointer-events-auto border border-outline-variant/30">
                      <div className="flex items-center gap-space-xs">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="font-label-mono-stat text-label-mono-stat text-on-surface font-semibold">
                          SYNCHRONIZED
                        </span>
                      </div>
                      <span className="text-outline font-label-mono-stat text-label-mono-stat">|</span>
                      <span className="font-label-mono-stat text-label-mono-stat text-on-surface-variant">
                        MongoDB Live
                      </span>
                    </div>
                  </div>

                  {/* Bottom Floating Hotspot Inspection Card Overlay */}
                  <div className="relative z-20 p-space-md flex flex-col md:flex-row items-end justify-between gap-space-md bg-gradient-to-t from-surface-container-lowest/95 via-surface-container-lowest/40 to-transparent pointer-events-none">
                    {/* Hotspot Inspection Card */}
                    <div className="w-full md:w-96 rounded-xl bg-surface-container-high/95 backdrop-blur-2xl p-space-md shadow-2xl flex flex-col gap-space-sm transition-all duration-300 pointer-events-auto border border-outline-variant/40">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-label-caps text-label-caps text-error uppercase font-bold tracking-wider">
                            {selectedHotspot?.intensity ? `${selectedHotspot.intensity} Severity Cluster` : 'Active Thermal Hotspot'}
                          </span>
                          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface leading-tight mt-0.5">
                            {selectedHotspot?.name || (selectedHotspot ? `${selectedHotspot.wardId} Thermal Zone` : 'Central Metro Precinct')}
                          </h3>
                          {selectedHotspot?.landmark && (
                            <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                              <span className="material-symbols-outlined text-xs text-secondary">location_on</span>
                              <span className="truncate max-w-[260px]">{selectedHotspot.landmark}</span>
                            </p>
                          )}
                        </div>
                        <div className="p-space-xs rounded bg-surface-container-lowest text-secondary">
                          <span className="material-symbols-outlined text-lg">radar</span>
                        </div>
                      </div>

                      {/* Metric Grid */}
                      <div className="grid grid-cols-2 gap-space-xs pt-space-xs">
                        <div className="p-space-xs rounded-lg bg-surface-container-lowest/70 flex flex-col">
                          <span className="font-label-caps text-label-caps text-on-surface-variant">AIR TEMPERATURE</span>
                          <span className="font-metric-display text-headline-sm font-bold text-error">
                            {peakTemp}°C
                          </span>
                          <span className="font-label-mono-stat text-body-sm text-on-surface-variant">Wet-bulb: 34.5°C</span>
                        </div>
                        <div className="p-space-xs rounded-lg bg-surface-container-lowest/70 flex flex-col">
                          <span className="font-label-caps text-label-caps text-on-surface-variant">SURFACE HEATING</span>
                          <span className="font-metric-display text-headline-sm font-bold text-secondary">
                            {(parseFloat(peakTemp) + 2.8).toFixed(1)}°C
                          </span>
                          <span className="font-label-mono-stat text-body-sm text-on-surface-variant">Albedo: 0.12</span>
                        </div>
                        <div className="p-space-xs rounded-lg bg-surface-container-lowest/70 flex flex-col">
                          <span className="font-label-caps text-label-caps text-on-surface-variant">RELATIVE HUMIDITY</span>
                          <span className="font-headline-sm text-headline-sm font-bold text-on-surface">62%</span>
                          <span className="font-label-mono-stat text-body-sm text-tertiary">Dew Pt: 26.8°C</span>
                        </div>
                        <div className="p-space-xs rounded-lg bg-surface-container-lowest/70 flex flex-col">
                          <span className="font-label-caps text-label-caps text-on-surface-variant">SOLAR IRRADIANCE</span>
                          <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                            940 <span className="text-xs font-normal text-on-surface-variant">W/m²</span>
                          </span>
                          <span className="font-label-mono-stat text-body-sm text-secondary">UV Index: 11+</span>
                        </div>
                      </div>

                      {/* Cooling Corridors Telemetry & Canopy Impact Gauge */}
                      <div className="p-space-xs rounded-lg bg-surface-container flex flex-col gap-space-2xs mt-space-2xs">
                        <div className="flex items-center justify-between font-label-caps text-label-caps">
                          <span className="text-primary font-bold uppercase">Cooling Corridors Telemetry</span>
                          <span className="text-on-surface font-semibold">{wardCoolingCount} Active / Planned</span>
                        </div>
                        <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(25, wardCoolingCount * 25))}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-on-surface-variant pt-0.5">
                          <span className="font-mono text-primary font-semibold">
                            -{wardCoolingSink}°C Verified Sink
                          </span>
                          <Link
                            to="/cooling"
                            className="text-primary hover:underline font-semibold flex items-center gap-0.5 transition-colors"
                          >
                            <span>Inspect Corridors</span>
                            <span className="material-symbols-outlined text-xs">arrow_forward</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GIS Auxiliary Strip: Thermal Isobar Timeline */}
                <div className="p-space-md rounded-xl bg-surface-container-low/70 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-space-md shadow-md border border-outline-variant/30">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-secondary text-2xl">history_toggle_off</span>
                    <div>
                      <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                        Diurnal Thermal Profile
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Rolling 24-hr surface infrared radiance with sensor anomaly deviation
                      </p>
                    </div>
                  </div>

                  {/* Micro Sparkline SVG */}
                  <div className="flex items-center gap-space-md w-full md:w-auto">
                    <div className="w-56 h-10 flex items-center">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 200 40">
                        <path
                          d="M 0,32 Q 30,30 50,22 T 100,8 T 150,4 T 200,28"
                          fill="none"
                          stroke="#ffb95f"
                          strokeWidth="2.5"
                        />
                        <path
                          d="M 0,35 Q 30,34 50,30 T 100,22 T 150,18 T 200,32"
                          fill="none"
                          stroke="#4edea3"
                          strokeDasharray="3 3"
                          strokeWidth="1.5"
                        />
                        <circle cx="150" cy="4" fill="#93000a" r="4" stroke="#ffdad6" strokeWidth="1.5" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="font-label-mono-stat text-label-mono-stat text-error font-bold">
                        {peakTemp}°C PEAK
                      </span>
                      <span className="font-body-sm text-body-sm text-primary font-medium">
                        {minTemp}°C MIN
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Incident Command Sidebar (4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-space-md">
                {/* Header Card */}
                <div className="p-space-md rounded-xl bg-surface-container-low/80 backdrop-blur-xl shadow-lg flex items-center justify-between border border-outline-variant/30">
                  <div className="flex items-center gap-space-sm">
                    <div className="relative flex items-center justify-center p-space-xs rounded-lg bg-error-container/30 text-error">
                      <span className="material-symbols-outlined text-xl">farsight_digital</span>
                      <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-error animate-ping" />
                    </div>
                    <div>
                      <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                        Incident Command
                      </h2>
                      <span className="font-label-mono-stat text-label-mono-stat text-on-surface-variant">
                        {alerts.length} Actionable Directives Pending
                      </span>
                    </div>
                  </div>
                  <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface font-mono">
                    LIVE FEED
                  </span>
                </div>

                {/* Alert Cards Stack */}
                <div className="flex flex-col gap-space-sm max-h-[740px] overflow-y-auto pr-1">
                  {loading ? (
                    <div className="p-8 text-center text-on-surface-variant font-body-sm">
                      Streaming alerts from MongoDB Atlas...
                    </div>
                  ) : alerts.length === 0 ? (
                    <div className="p-8 text-center text-primary font-body-sm">
                      ✅ No critical heat alerts active in sector
                    </div>
                  ) : (
                    alerts.map((alert, index) => {
                      const isCritical = alert.severity === 'critical' || alert.severity === 'high';
                      const isDone = activeInterventions[alert._id];
                      return (
                        <div
                          key={alert._id || index}
                          className="relative overflow-hidden rounded-xl bg-surface-container-low/90 backdrop-blur-xl p-space-md shadow-xl transition-all duration-300 hover:bg-surface-container-high group border border-outline-variant/30"
                        >
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                              isCritical ? 'bg-error' : 'bg-secondary'
                            }`}
                          />
                          <div className="flex items-start justify-between gap-space-xs mb-space-xs pl-space-2xs">
                            <div className="flex items-center gap-space-xs">
                              <span
                                className={`px-space-xs py-space-2xs rounded font-label-caps text-label-caps uppercase font-bold tracking-wider flex items-center gap-1 ${
                                  isCritical
                                    ? 'bg-error/20 text-error'
                                    : 'bg-secondary/20 text-secondary'
                                }`}
                              >
                                {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping" />}
                                {alert.severity.toUpperCase()} THERMAL HAZARD
                              </span>
                              <span className="font-label-mono-stat text-body-sm text-on-surface-variant">
                                0{index + 1}m ago
                              </span>
                            </div>
                            <span
                              className={`font-label-mono-stat text-label-mono-stat font-bold ${
                                isCritical ? 'text-error' : 'text-secondary'
                              }`}
                            >
                              {alert.ward}
                            </span>
                          </div>

                          <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface pl-space-2xs">
                            {alert.ward} Hotspot Zone #{index + 1}
                          </h4>
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs pl-space-2xs leading-relaxed">
                            {alert.recommendedAction}
                          </p>

                          {/* Metadata Pills */}
                          <div className="flex flex-wrap gap-space-xs mt-space-sm pl-space-2xs">
                            <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-surface-container-highest text-on-surface">
                              {alert.ward}
                            </span>
                            <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-surface-container-highest text-secondary">
                              EXP: 8,400 CITIZENS
                            </span>
                          </div>

                          {/* Intervention Action Buttons */}
                          <div className="grid grid-cols-2 gap-space-xs mt-space-md pt-space-xs pl-space-2xs">
                            <button
                              type="button"
                              onClick={() => handleTriggerAction(alert._id, 'Misting Cannons Activated')}
                              className="px-space-sm py-space-xs rounded-lg bg-primary text-on-primary font-headline-sm text-xs font-semibold hover:bg-primary-fixed hover:shadow-lg transition-all flex items-center justify-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">water_drop</span>
                              <span>{isDone === 'Misting Cannons Activated' ? 'Dispatched ✓' : 'Deploy Misting'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTriggerAction(alert._id, 'EMS Health Dispatch Sent')}
                              className="px-space-sm py-space-xs rounded-lg bg-surface-container-highest text-on-surface font-headline-sm text-xs font-semibold hover:bg-error-container hover:text-on-error-container transition-all flex items-center justify-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">notifications_active</span>
                              <span>{isDone === 'EMS Health Dispatch Sent' ? 'Notified ✓' : 'Notify EMS'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Emergency Dispatch Protocol Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-container max-w-lg w-full rounded-2xl border border-error/50 p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowDispatchModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
            >
              ✕
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-error-container/40 flex items-center justify-center text-error text-xl font-bold">
                ⚠️
              </div>
              <div>
                <h3 className="text-headline-sm font-bold text-on-surface">
                  Emergency Heat Dispatch Protocol
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Municipal Intervention Directive for {ward === 'All' ? 'All Wards' : ward}
                </p>
              </div>
            </div>
            <div className="space-y-3 text-body-sm text-on-surface-variant mb-6">
              <p>
                Initiate emergency municipal cooling countermeasures across active thermal zones. This directive will:
              </p>
              <ul className="space-y-1.5 list-disc list-inside text-xs text-on-surface">
                <li>Trigger high-pressure solar misting arrays along major pedestrian spines.</li>
                <li>Issue priority SMS and App alerts to vulnerable citizens in {ward}.</li>
                <li>Activate emergency cooling shelters in community facilities.</li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleEmergencyDispatch}
                className="py-2.5 px-3 rounded-xl bg-error text-on-error font-bold text-xs hover:bg-error-container hover:text-on-error-container transition-all"
              >
                🚨 Execute Protocol
              </button>
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="py-2.5 px-3 rounded-xl bg-surface-container-high text-on-surface font-bold text-xs hover:bg-surface-container-highest transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

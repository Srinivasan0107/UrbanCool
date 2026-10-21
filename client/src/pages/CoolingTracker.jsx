import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import api from '../api/client.js';

const STATUS_TABS = [
  { key: 'all', label: 'All Initiatives' },
  { key: 'active', label: 'Active Construction' },
  { key: 'planned', label: 'Procurement & Planning' },
  { key: 'completed', label: 'Completed & Verifying' },
];

const TYPE_IMAGES = {
  tree_plantation: {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0yPrtKlZ66vullADJj1O9vhE4zyCEhAZqPdInNt_SkPCcQk55AtCqb9WbuS8OqWC_rolGV4mniORJ8hbxgM554sKUPfP5UNHdBDL0Xq0zfCH5z2nfJJTYbWGe6WmidFVfTjjCes7LpngKCVRC6iLG6IRRvwMzN9MUfLjVtksAgAFd3_RPoMc30GAtSGeAbfmYOfeUJ4BAR9yE10ExITVBeX49qWaAksfMBbfGsz6StYI6JJiIWKOq',
    metricTag: 'Transpiration: 92%',
    tagColor: 'text-tertiary',
    icon: 'park',
    label: 'Urban Canopy & Bioswale',
  },
  cool_roof: {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARmPSS8EHAa5oXd-hgAzpXO6F4PAsUN33ZNtIj8YWyfdCUcAIr6F5ovXXaKKVIII-ZJDNBnLyJH6c4RLB5Vrz73nsyQKwIBAIJi_rTf1o6p2gxQyQKhwHksgWgBG9AXAvQctZHpPV4R2kn3Z1vhKQAPZf5s-Qsx3cDC79x6vLPJrePCaLgMCDN5ACxwEGhbegrqNkM3m94PObRenP6Q0IF2qKovH1ZifyE08r_iF4qeh1xgNZhNtTI',
    metricTag: 'Albedo: 0.88',
    tagColor: 'text-primary',
    icon: 'roofing',
    label: 'Reflective Cool Roof & PV',
  },
  reflective_pavement: {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKq9oubT5m-kgAbtLsK4kN_9pDWEZ88L72zcY_9ukvzYo_t35e7GH7dHwM__bgY1FJ7Z_TSSQ2QytZuQL4tNd4l-X6PeitdXkIU3ueJiRQu5zzGCviTEmqZKfaQ2rzpobLke0hmkNknQEc6V6LVXAqamOc7wEmjHiMUvg_llZ4k0eoCZd9ojK9KGWP6afYT2TQSjNioCF6V6HWHPjPVbEB78wSgjGD_qO1ArrK3YuKXcGJ6U9cmcrT',
    metricTag: 'SRI: 82 High-Reflectance',
    tagColor: 'text-secondary',
    icon: 'edit_road',
    label: 'High-Albedo Pavement',
  },
  water_body: {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0lUD7KzmAgPtoLSdhw9Rx0Bs0p9SJwzBOLJ2G50139wx58aEkM0MAlVt6RkxtJmIxLkQ4lzp11iwOJqCTqQ_IePDAnpp1f4P-02cPQoOAZRAQCZ80niklT1aoU9LPEgcA4D1v_Pd-VWlUlfOytsLEBwvz8jCKFKzgf3Jl2Oplbb8V7ioGZB-xiQAj74UKCDc9yyH1fX2eEpmSZRYXMFpoxo3suF99sFTDBGdyA1YtvcGX047k4xxL',
    metricTag: '12 Micro-Mist Nodes',
    tagColor: 'text-tertiary',
    icon: 'water_drop',
    label: 'Micro-Misting Network',
  },
};

const TAMIL_NADU_WARDS = [
  { id: 'All Wards', label: 'All Municipal Wards (Tamil Nadu)' },
  { id: 'Ward-1', label: 'Ward-1: Chennai Central (George Town Harbor)' },
  { id: 'Ward-2', label: 'Ward-2: Chennai South-Central (T. Nagar Commercial)' },
  { id: 'Ward-3', label: 'Ward-3: Chennai South (Guindy & Alandur Industrial)' },
  { id: 'Ward-4', label: 'Ward-4: Chennai Cyber Corridor (Sholinganallur OMR)' },
  { id: 'Ward-5', label: 'Ward-5: Western Tamil Nadu (Coimbatore Gandhipuram)' },
];

const WARD_COORDINATES = {
  'Ward-1': { lat: 13.0878, lng: 80.2785 },
  'Ward-2': { lat: 13.0418, lng: 80.2341 },
  'Ward-3': { lat: 13.0067, lng: 80.2025 },
  'Ward-4': { lat: 12.9010, lng: 80.2279 },
  'Ward-5': { lat: 11.0168, lng: 76.9558 },
};

export default function CoolingTracker() {
  const [allInitiatives, setAllInitiatives] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [wardFilter, setWardFilter] = useState('All Wards');
  const [vectorFilter, setVectorFilter] = useState('all');
  const [impactTierFilter, setImpactTierFilter] = useState('all');
  const [telemetryFilter, setTelemetryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal for registering new initiative
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newInit, setNewInit] = useState({
    name: '',
    type: 'cool_roof',
    ward: 'Ward-1',
    beforeTemp: 42.5,
    description: '',
    lat: 13.0878,
    lng: 80.2785,
    status: 'planned',
  });
  const [submitting, setSubmitting] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(null);

  // Pipeline Stage / Telemetry Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingInit, setEditingInit] = useState(null);
  const [editForm, setEditForm] = useState({
    status: 'planned',
    afterTemp: '',
    description: '',
  });
  const [updatingPipeline, setUpdatingPipeline] = useState(false);

  // Fetch all initiatives from MongoDB Atlas
  const fetchInitiatives = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/v1/cooling');
      const list = res.data.data || [];
      setAllInitiatives(list);
      setSelected((prev) => {
        if (!prev) return list[0] || null;
        const found = list.find((ci) => ci._id === prev._id);
        return found || list[0] || null;
      });
    } catch {
      setError('Failed to fetch cooling initiatives from MongoDB Atlas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitiatives();
  }, [fetchInitiatives]);

  // Filter initiatives dynamically
  const filteredInitiatives = useMemo(() => {
    return allInitiatives.filter((ci) => {
      if (activeTab !== 'all' && ci.status !== activeTab) return false;
      if (wardFilter !== 'All Wards' && ci.ward !== wardFilter) return false;
      if (vectorFilter !== 'all' && ci.type !== vectorFilter) return false;
      if (impactTierFilter !== 'all') {
        const delta = ci.afterTemp != null ? ci.beforeTemp - ci.afterTemp : (ci.status === 'active' ? 4.2 : 3.8);
        if (impactTierFilter === 't4' && delta < 5.0) return false;
        if (impactTierFilter === 't3' && (delta < 3.0 || delta >= 5.0)) return false;
        if (impactTierFilter === 't2' && delta >= 3.0) return false;
      }
      if (telemetryFilter !== 'all') {
        if (telemetryFilter === 'verified' && (ci.status !== 'completed' || ci.afterTemp == null)) return false;
        if (telemetryFilter === 'sim' && ci.status !== 'active') return false;
        if (telemetryFilter === 'calibration' && ci.status !== 'planned') return false;
      }
      return true;
    });
  }, [allInitiatives, activeTab, wardFilter, vectorFilter, impactTierFilter, telemetryFilter]);

  // Keep selected initiative synced with current filter view
  useEffect(() => {
    if (filteredInitiatives.length > 0) {
      if (!selected || !filteredInitiatives.some((ci) => ci._id === selected._id)) {
        setSelected(filteredInitiatives[0]);
      }
    }
  }, [filteredInitiatives, selected]);

  // Aggregate Metrics derived directly from MongoDB & active ward context
  const wardInitiatives = useMemo(() => {
    return wardFilter === 'All Wards' ? allInitiatives : allInitiatives.filter((ci) => ci.ward === wardFilter);
  }, [allInitiatives, wardFilter]);

  const completedList = wardInitiatives.filter((ci) => ci.status === 'completed' && ci.afterTemp != null);
  const activeCount = wardInitiatives.filter((ci) => ci.status === 'active').length;
  const plannedCount = wardInitiatives.filter((ci) => ci.status === 'planned').length;
  const completedCount = completedList.length;

  const avgReduction = completedList.length > 0
    ? (
        completedList.reduce((acc, ci) => acc + (ci.beforeTemp - ci.afterTemp), 0) /
        completedList.length
      ).toFixed(1)
    : '4.7';

  // Capital Deployed & Active Area estimations from ward counts
  const capitalTotal = (wardInitiatives.length * 1.84).toFixed(1);
  const areaTotal = (wardInitiatives.length * 0.182).toFixed(2);

  // Selected Initiative Delta or calculated simulation
  const isCompletedWithAfter = selected?.status === 'completed' && selected?.afterTemp != null;
  const activeDelta = isCompletedWithAfter
    ? (selected.beforeTemp - selected.afterTemp).toFixed(1)
    : selected
    ? (selected.status === 'active' ? '4.2' : '3.8')
    : avgReduction;

  const deltaLabel = isCompletedWithAfter
    ? 'Verified IoT Delta'
    : selected?.status === 'active'
    ? 'CFD Simulated Delta'
    : 'Projected Target Delta';

  // Chart Dynamic SVG Y Calculation
  const getY = (t) => Math.round(250 - ((t - 24) / 18) * 210);

  const basePeak = selected?.beforeTemp || 42.0;
  const realizedPeak = isCompletedWithAfter
    ? selected.afterTemp
    : selected
    ? Number((selected.beforeTemp - (selected.status === 'active' ? 4.2 : 3.8)).toFixed(1))
    : 37.3;

  const yPeakBase = Math.min(270, Math.max(30, getY(basePeak)));
  const yPeakPost = Math.min(270, Math.max(30, getY(realizedPeak)));
  const yNightBase = Math.min(280, Math.max(180, getY(basePeak - 13.5)));
  const yNightPost = Math.min(280, Math.max(180, getY(realizedPeak - 11.5)));

  const baselineCurve = `M 50,${yNightBase} C 180,${yNightBase - 5} 280,${Math.round((yNightBase + yPeakBase) / 2)} 400,${yPeakBase + 45} C 480,${yPeakBase + 15} 540,${yPeakBase} 600,${yPeakBase} C 680,${yPeakBase + 5} 780,${yPeakBase + 50} 880,${Math.round((yNightBase + yPeakBase) / 2 + 20)} C 930,${yNightBase - 15} 970,${yNightBase - 5} 1000,${yNightBase}`;
  const baselineFillPath = `${baselineCurve} L 1000,300 L 50,300 Z`;

  const realizedCurve = `M 50,${yNightPost} C 180,${yNightPost - 5} 280,${Math.round((yNightPost + yPeakPost) / 2)} 400,${yPeakPost + 40} C 480,${yPeakPost + 12} 540,${yPeakPost} 600,${yPeakPost} C 680,${yPeakPost + 6} 780,${yPeakPost + 45} 880,${Math.round((yNightPost + yPeakPost) / 2 + 15)} C 930,${yNightPost - 10} 970,${yNightPost - 5} 1000,${yNightPost}`;
  const realizedFillPath = `${realizedCurve} L 1000,300 L 50,300 Z`;

  // Handler for Exporting Spatial GML / GeoJSON
  const handleExportSpatialGML = () => {
    const exportData = {
      type: 'FeatureCollection',
      metadata: {
        title: 'UrbanCool Municipal Cooling Initiatives',
        source: 'MongoDB Atlas Live Telemetry',
        generatedAt: new Date().toISOString(),
        totalInterventions: filteredInitiatives.length,
      },
      features: filteredInitiatives.map((ci) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [ci.location?.lng || 80.23, ci.location?.lat || 13.04],
        },
        properties: {
          id: ci._id,
          name: ci.name,
          type: ci.type,
          ward: ci.ward,
          status: ci.status,
          startDate: ci.startDate,
          beforeTemp: ci.beforeTemp,
          afterTemp: ci.afterTemp,
          deltaCelsius: ci.afterTemp != null ? (ci.beforeTemp - ci.afterTemp).toFixed(1) : null,
        },
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `urbancool-cooling-corridors-${wardFilter.toLowerCase()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Submit New Intervention to MongoDB Atlas
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const coords = WARD_COORDINATES[newInit.ward] || { lat: 13.0878, lng: 80.2785 };
      await api.post('/api/v1/cooling', {
        name: newInit.name,
        type: newInit.type,
        ward: newInit.ward,
        beforeTemp: parseFloat(newInit.beforeTemp),
        description: newInit.description || 'Municipal capital cooling intervention',
        location: {
          lat: parseFloat(newInit.lat || coords.lat),
          lng: parseFloat(newInit.lng || coords.lng),
        },
        startDate: new Date().toISOString(),
        status: newInit.status || 'planned',
      });
      setRegisterSuccess(`Cooling intervention "${newInit.name}" registered successfully.`);
      setIsRegisterOpen(false);
      setNewInit({
        name: '',
        type: 'cool_roof',
        ward: 'Ward-1',
        beforeTemp: 42.5,
        description: '',
        lat: 13.0878,
        lng: 80.2785,
        status: 'planned',
      });
      fetchInitiatives();
      setTimeout(() => setRegisterSuccess(null), 5000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to register intervention. Make sure you are logged in as a planner.');
    } finally {
      setSubmitting(false);
    }
  };

  // Pipeline Progression Handlers
  const handleAdvancePipeline = async (ci, targetStatus) => {
    try {
      const payload = { status: targetStatus };
      const res = await api.patch(`/api/v1/cooling/${ci._id}`, payload);
      setRegisterSuccess(`Corridor "${ci.name}" pipeline stage updated to ${targetStatus === 'active' ? 'Active Construction' : targetStatus}.`);
      fetchInitiatives();
      if (selected?._id === ci._id) setSelected(res.data.data);
      setTimeout(() => setRegisterSuccess(null), 5000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update pipeline stage.');
    }
  };

  const openTelemetryModal = (ci, suggestedStatus) => {
    setEditingInit(ci);
    setEditForm({
      status: suggestedStatus || ci.status,
      afterTemp: ci.afterTemp != null ? String(ci.afterTemp) : (ci.beforeTemp - 4.5).toFixed(1),
      description: ci.description || '',
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingInit) return;
    setUpdatingPipeline(true);
    try {
      const payload = {
        status: editForm.status,
        description: editForm.description,
      };
      if (editForm.status === 'completed') {
        const val = parseFloat(editForm.afterTemp);
        if (!isNaN(val)) payload.afterTemp = val;
      } else {
        payload.afterTemp = null;
      }
      const res = await api.patch(`/api/v1/cooling/${editingInit._id}`, payload);
      setRegisterSuccess(`Corridor "${editingInit.name}" telemetry and pipeline updated.`);
      setIsEditOpen(false);
      fetchInitiatives();
      if (selected?._id === editingInit._id) setSelected(res.data.data);
      setTimeout(() => setRegisterSuccess(null), 5000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update corridor pipeline.');
    } finally {
      setUpdatingPipeline(false);
    }
  };

  const handleDeleteInitiative = async (ci) => {
    if (!window.confirm(`Are you sure you want to decommission and remove the cooling corridor "${ci.name}"?`)) return;
    try {
      await api.delete(`/api/v1/cooling/${ci._id}`);
      setRegisterSuccess(`Cooling intervention "${ci.name}" removed from pipeline.`);
      fetchInitiatives();
      if (selected?._id === ci._id) setSelected(null);
      setTimeout(() => setRegisterSuccess(null), 5000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete intervention.');
    }
  };

  return (
    <div className="bg-surface font-body-md text-on-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      {/* Header */}
      <Navbar alertCount={3} nodeCount={allInitiatives.length * 6 || 60} currentWard={wardFilter !== 'All Wards' ? wardFilter : 'Ward-1'} />

      {/* Fixed Left Navigation Sidebar */}
      <Sidebar canopyDelta={`-${avgReduction}`} activeWard={wardFilter !== 'All Wards' ? wardFilter : 'Ward-1'} />

      {/* Main Content Pane */}
      <div className="pl-0 lg:pl-64">
        <main className="w-full pt-16 bg-surface min-h-screen">
          <div className="flex flex-col w-full">
            <div className="w-full px-gutter-desktop py-space-xl flex flex-col gap-space-xl max-w-[1720px] mx-auto">
              {/* Notification Banner */}
              {registerSuccess && (
                <div className="p-space-md rounded-xl bg-primary/20 border border-primary/40 text-primary font-body-sm text-body-sm flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    <span>{registerSuccess}</span>
                  </div>
                  <button onClick={() => setRegisterSuccess(null)} className="text-primary hover:text-white">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              )}

              {error && (
                <div className="p-space-md rounded-xl bg-error-container/30 border border-error/40 text-error font-body-sm text-body-sm flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-lg">error</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Top Bar: Header & Spatial Breadcrumb */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
                <div className="flex flex-col gap-space-xs max-w-3xl">
                  <div className="flex items-center gap-space-sm text-tertiary">
                    <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
                    <span className="font-label-caps text-label-caps uppercase tracking-widest text-tertiary">
                      Resilience Deployment Vector // Rev 4.12
                    </span>
                    <span className="text-surface-variant">•</span>
                    <span className="font-label-mono-stat text-label-mono-stat text-on-surface-variant">
                      Ward 01 - 05 Municipal Matrix
                    </span>
                  </div>
                  <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
                    Municipal Cooling Initiative Tracker & Resilience Impact
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Real-time telemetry validation and surface albedo tracking across municipal capital interventions. Measuring direct thermal dissipation against the baseline urban heat island (UHI) index.
                  </p>
                </div>

                {/* Quick Telemetry Snapshot Pill Group */}
                <div className="flex items-center gap-space-sm bg-surface-container-low p-space-xs rounded-xl shadow-lg border border-outline-variant/30">
                  <div className="flex flex-col px-space-md py-space-xs">
                    <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                      Aggregated Sink
                    </span>
                    <span className="font-metric-display text-metric-display text-primary font-bold tracking-tight">
                      -{avgReduction}°C
                    </span>
                  </div>
                  <div className="w-px h-8 bg-surface-container-high" />
                  <div className="flex flex-col px-space-md py-space-xs">
                    <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                      Capital Deployed
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      ${capitalTotal}M
                    </span>
                  </div>
                  <div className="w-px h-8 bg-surface-container-high" />
                  <div className="flex flex-col px-space-md py-space-xs">
                    <span className="font-label-caps text-label-caps uppercase text-tertiary">
                      Active Area
                    </span>
                    <span className="font-headline-sm text-headline-sm text-tertiary font-semibold">
                      {areaTotal}M m²
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Tabs with Sliding Indicator & Filter Console */}
              <div className="flex flex-col gap-space-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md border-b-0 pb-space-xs">
                  {/* Interactive Underline Tabs */}
                  <div className="relative flex flex-wrap items-center gap-space-sm p-space-2xs bg-surface-container-lowest/80 rounded-xl border border-outline-variant/20">
                    {STATUS_TABS.map((tab) => {
                      const count = tab.key === 'all'
                        ? wardInitiatives.length
                        : tab.key === 'active'
                        ? activeCount
                        : tab.key === 'planned'
                        ? plannedCount
                        : completedCount;
                      const isActive = activeTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`relative z-10 px-space-md py-space-xs font-body-sm text-body-sm font-semibold rounded-lg transition-all flex items-center gap-space-xs ${
                            isActive
                              ? 'bg-surface-container-high text-primary shadow-sm'
                              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span
                            className={`font-label-mono-stat text-label-mono-stat px-space-xs py-0.5 rounded-full ${
                              isActive
                                ? 'bg-primary/20 text-primary font-bold'
                                : 'bg-surface-container-highest text-on-surface-variant'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Metric Refresh & Export Group */}
                  <div className="flex items-center gap-space-xs">
                    <button
                      onClick={handleExportSpatialGML}
                      className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all font-body-sm text-body-sm shadow-sm border border-outline-variant/20 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                      <span>Spatial GML</span>
                    </button>
                    <button
                      onClick={() => setIsRegisterOpen(true)}
                      className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all font-body-sm text-body-sm font-semibold shadow-md cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">add_chart</span>
                      <span>Register Intervention</span>
                    </button>
                  </div>
                </div>

                {/* Multifaceted Filter Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm bg-surface-container-low/70 backdrop-blur-md p-space-sm rounded-xl shadow-inner border border-outline-variant/20">
                  {/* Ward Dropdown Filter */}
                  <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-sm py-space-xs rounded-lg shadow-sm border border-outline-variant/10">
                    <span className="material-symbols-outlined text-tertiary text-lg">location_on</span>
                    <div className="flex flex-col w-full min-w-0">
                      <label className="font-label-caps text-label-caps uppercase text-on-surface-variant">Ward Sector</label>
                      <select
                        value={wardFilter}
                        onChange={(e) => setWardFilter(e.target.value)}
                        className="bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none cursor-pointer"
                      >
                        {TAMIL_NADU_WARDS.map((w) => (
                          <option key={w.id} className="bg-surface-container-lowest" value={w.id}>
                            {w.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Intervention Type Filter */}
                  <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-sm py-space-xs rounded-lg shadow-sm border border-outline-variant/10">
                    <span className="material-symbols-outlined text-primary text-lg">nature</span>
                    <div className="flex flex-col w-full min-w-0">
                      <label className="font-label-caps text-label-caps uppercase text-on-surface-variant">Intervention Vector</label>
                      <select
                        value={vectorFilter}
                        onChange={(e) => setVectorFilter(e.target.value)}
                        className="bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none cursor-pointer"
                      >
                        <option className="bg-surface-container-lowest" value="all">All Vectors (Albedo & Canopy)</option>
                        <option className="bg-surface-container-lowest" value="tree_plantation">Urban Canopy & Bioswales</option>
                        <option className="bg-surface-container-lowest" value="cool_roof">Reflective Cool Roofs</option>
                        <option className="bg-surface-container-lowest" value="water_body">Micro-Misting Networks</option>
                        <option className="bg-surface-container-lowest" value="reflective_pavement">Permeable High-Albedo Pavements</option>
                      </select>
                    </div>
                  </div>

                  {/* Impact Rating Filter */}
                  <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-sm py-space-xs rounded-lg shadow-sm border border-outline-variant/10">
                    <span className="material-symbols-outlined text-secondary text-lg">local_fire_department</span>
                    <div className="flex flex-col w-full min-w-0">
                      <label className="font-label-caps text-label-caps uppercase text-on-surface-variant">Target Impact Tier</label>
                      <select
                        value={impactTierFilter}
                        onChange={(e) => setImpactTierFilter(e.target.value)}
                        className="bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none cursor-pointer"
                      >
                        <option className="bg-surface-container-lowest" value="all">Tier 1 to 4 Reductions</option>
                        <option className="bg-surface-container-lowest" value="t4">&gt; 5.0°C Absolute Sink (High)</option>
                        <option className="bg-surface-container-lowest" value="t3">3.0°C - 5.0°C Dissipation</option>
                        <option className="bg-surface-container-lowest" value="t2">&lt; 3.0°C Localized Shade</option>
                      </select>
                    </div>
                  </div>

                  {/* Sensor Verification Filter */}
                  <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-sm py-space-xs rounded-lg shadow-sm border border-outline-variant/10">
                    <span className="material-symbols-outlined text-on-surface-variant text-lg">cloud_download</span>
                    <div className="flex flex-col w-full min-w-0">
                      <label className="font-label-caps text-label-caps uppercase text-on-surface-variant">Telemetry Status</label>
                      <select
                        value={telemetryFilter}
                        onChange={(e) => setTelemetryFilter(e.target.value)}
                        className="bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none cursor-pointer"
                      >
                        <option className="bg-surface-container-lowest" value="all">All Telemetry Vectors</option>
                        <option className="bg-surface-container-lowest" value="verified">Live IoT Verified (&gt;99% Up / Phase 3)</option>
                        <option className="bg-surface-container-lowest" value="sim">CFD Simulated Projections (Phase 2)</option>
                        <option className="bg-surface-container-lowest" value="calibration">Awaiting Thermocouple Sync (Phase 1)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Temperature Impact Section: Dual-Curve Graph & Delta Celebration Card */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-stretch">
                {/* Chart Container: 24h Diurnal Baseline vs Post-Intervention */}
                <div className="xl:col-span-8 bg-surface-container-low/90 backdrop-blur-xl p-space-lg rounded-xl shadow-2xl flex flex-col justify-between relative overflow-hidden border border-outline-variant/20">
                  <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md mb-space-md z-10">
                    <div className="flex flex-col gap-space-2xs">
                      <div className="flex items-center gap-space-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
                        <span className="font-label-caps text-label-caps uppercase text-primary tracking-wider">
                          Diurnal Cycle Dynamic Trace
                        </span>
                      </div>
                      <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                        Surface vs Canopy Temperature Trajectory
                      </h3>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Aggregated Microclimate Loop • {selected?.name || 'Municipal Matrix'} (00:00 - 23:59 UTC)
                      </span>
                    </div>

                    {/* Curve Legend */}
                    <div className="flex items-center gap-space-md bg-surface-container-lowest/80 px-space-md py-space-xs rounded-xl shadow-sm border border-outline-variant/20">
                      <div className="flex items-center gap-space-xs">
                        <span className="w-3 h-1 rounded-full bg-secondary shadow-[0_0_8px_rgba(255,185,95,0.6)]" />
                        <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                          Baseline ({basePeak}°C Peak)
                        </span>
                      </div>
                      <div className="flex items-center gap-space-xs">
                        <span className="w-3 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(78,222,163,0.8)]" />
                        <span className="font-label-caps text-label-caps uppercase text-primary">
                          Post-Intervention ({realizedPeak}°C)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Inline SVG Dual-Curve Graph */}
                  <div className="relative w-full h-72 sm:h-80 z-10 flex flex-col justify-end">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 320">
                      <defs>
                        <linearGradient id="baselineFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#ffb95f" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#ffb95f" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="realizedFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#4edea3" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#4edea3" stopOpacity="0.0" />
                        </linearGradient>
                        <filter height="140%" id="emeraldGlow" width="140%" x="-20%" y="-20%">
                          <feGaussianBlur result="blur" stdDeviation="4" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      {/* Horizontal Grid Reference Lines */}
                      <line stroke="#31353e" strokeDasharray="4,4" strokeOpacity="0.6" x1="0" x2="1000" y1="40" y2="40" />
                      <line stroke="#31353e" strokeDasharray="4,4" strokeOpacity="0.6" x1="0" x2="1000" y1="110" y2="110" />
                      <line stroke="#31353e" strokeDasharray="4,4" strokeOpacity="0.6" x1="0" x2="1000" y1="180" y2="180" />
                      <line stroke="#31353e" strokeDasharray="4,4" strokeOpacity="0.6" x1="0" x2="1000" y1="250" y2="250" />

                      {/* Y-Axis Labels */}
                      <text className="font-label-mono-stat" fill="#86948a" fontSize="11" x="10" y="44">42°C (Critical)</text>
                      <text className="font-label-mono-stat" fill="#86948a" fontSize="11" x="10" y="114">36°C</text>
                      <text className="font-label-mono-stat" fill="#86948a" fontSize="11" x="10" y="184">30°C</text>
                      <text className="font-label-mono-stat" fill="#86948a" fontSize="11" x="10" y="254">24°C</text>

                      {/* Peak Solar Noon Highlight Bar */}
                      <rect fill="#ffb95f" fillOpacity="0.04" height="260" rx="4" width="120" x="520" y="20" />
                      <line stroke="#ffb95f" strokeDasharray="2,2" strokeOpacity="0.3" x1="580" x2="580" y1="20" y2="280" />
                      <text className="font-label-caps" fill="#ffb95f" fontSize="10" x="585" y="32">SOLAR NOON (14:00)</text>

                      {/* Baseline Trajectory Path Area (Dynamic from live selected beforeTemp) */}
                      <path d={baselineFillPath} fill="url(#baselineFill)" />

                      {/* Realized Cooling Path Area (Dynamic from live selected afterTemp/sim) */}
                      <path d={realizedFillPath} fill="url(#realizedFill)" />

                      {/* Baseline Line (Neon Amber) */}
                      <path
                        d={baselineCurve}
                        fill="none"
                        stroke="#ffb95f"
                        strokeLinecap="round"
                        strokeWidth="3"
                      />

                      {/* Realized Line (Cyber Teal / Emerald) */}
                      <path
                        d={realizedCurve}
                        fill="none"
                        filter="url(#emeraldGlow)"
                        stroke="#4edea3"
                        strokeLinecap="round"
                        strokeWidth="3.5"
                      />

                      {/* Peak Difference Vector Annotation */}
                      <line stroke="currentColor" className="text-primary" strokeDasharray="3,3" strokeWidth="2" x1="600" x2="600" y1={yPeakBase} y2={yPeakPost} />
                      <circle cx="600" cy={yPeakBase} fill="#ffb95f" r="5" stroke="currentColor" className="text-surface" strokeWidth="2" />
                      <circle cx="600" cy={yPeakPost} fill="#4edea3" r="5" stroke="currentColor" className="text-surface" strokeWidth="2" />

                      {/* Differential Marker Node */}
                      <g transform={`translate(615, ${Math.min(yPeakBase, yPeakPost) + Math.abs(yPeakPost - yPeakBase) / 2 - 12})`}>
                        <rect fill="currentColor" className="text-surface-container-high" height="24" rx="4" stroke="none" width="120" x="0" y="0" />
                        <text className="font-label-mono-stat fill-primary" fontSize="11" fontWeight="700" x="6" y="16">
                          Δ -{activeDelta}°C SINK
                        </text>
                      </g>
                    </svg>

                    {/* Timeline X-Axis Ticks */}
                    <div className="flex justify-between px-space-md pt-space-xs text-on-surface-variant font-label-mono-stat text-label-mono-stat">
                      <span>02:00</span>
                      <span>06:00</span>
                      <span>10:00</span>
                      <span className="text-secondary font-bold">14:00 (Peak)</span>
                      <span>18:00</span>
                      <span>22:00</span>
                    </div>
                  </div>

                  {/* Telemetry Correlation Footer inside Chart */}
                  <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-md mt-space-md border-t-0 bg-surface-container-lowest/50 p-space-sm rounded-lg border border-outline-variant/10">
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-primary text-lg">hub</span>
                      <span className="font-body-sm text-body-sm text-on-surface">
                        Integrated across 18 Microclimate Towers & Landsat-9 Thermal Infrared Radiometer
                      </span>
                    </div>
                    <div className="flex items-center gap-space-xs font-label-mono-stat text-label-mono-stat text-on-surface-variant">
                      <span>Variance Margin:</span>
                      <span className="text-primary font-semibold">±0.28°C (95% CI)</span>
                    </div>
                  </div>
                </div>

                {/* Prominent Temperature Delta Celebration Badge & Co-benefits Card */}
                <div className="xl:col-span-4 flex flex-col justify-between p-space-lg rounded-xl bg-gradient-to-b from-surface-container-high via-surface-container to-surface-container-low shadow-2xl relative overflow-hidden border border-outline-variant/30">
                  <div className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-primary/10 blur-2xl" />
                  <div className="flex flex-col gap-space-md relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="font-label-caps text-label-caps uppercase px-space-sm py-space-2xs rounded-full bg-primary/10 text-primary font-bold tracking-wider flex items-center gap-space-xs border border-primary/20">
                        <span className="material-symbols-outlined text-xs">auto_awesome</span> {deltaLabel}
                      </span>
                      <span className="font-label-mono-stat text-label-mono-stat text-on-surface-variant uppercase">
                        {selected?.ward || 'WARD 01 CENTRAL'}
                      </span>
                    </div>

                    {/* Giant Delta Counter */}
                    <div className="flex flex-col gap-space-2xs mt-space-xs">
                      <div className="flex items-baseline gap-space-xs">
                        <span className="material-symbols-outlined text-display-lg text-primary animate-bounce">
                          arrow_downward
                        </span>
                        <span className="font-display-lg text-display-lg font-extrabold text-on-surface tracking-tighter">
                          {activeDelta}°C
                        </span>
                      </div>
                      <span className="font-headline-sm text-headline-sm text-primary font-bold">
                        Peak Surface Heat Reduction
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {selected ? `${selected.name}: ` : ''}
                        {isCompletedWithAfter
                          ? `Measured sensor sink of ${activeDelta}°C verified against ${selected.beforeTemp}°C baseline.`
                          : selected?.status === 'active'
                          ? `Active construction stage: projected -${activeDelta}°C thermal sink based on CFD modeling.`
                          : `Procurement & planning stage: estimated -${activeDelta}°C dissipation target.`}
                      </p>
                    </div>

                    {/* Co-Benefit Key Metric Gauges */}
                    <div className="flex flex-col gap-space-sm pt-space-xs">
                      {/* Grid Load Reduction */}
                      <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-lowest/80 border border-outline-variant/10">
                        <div className="flex items-center gap-space-sm">
                          <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                            <span className="material-symbols-outlined text-lg">bolt</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                              Grid Load Reduction
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface font-semibold">
                              Reduced Chiller Demand
                            </span>
                          </div>
                        </div>
                        <span className="font-label-mono-stat text-label-mono-stat font-bold text-secondary">
                          ${Math.round(parseFloat(activeDelta) * 70)}k/yr
                        </span>
                      </div>

                      {/* Carbon Sequestration Eq */}
                      <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-lowest/80 border border-outline-variant/10">
                        <div className="flex items-center gap-space-sm">
                          <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
                            <span className="material-symbols-outlined text-lg">eco</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                              Carbon Sequestration Eq.
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface font-semibold">
                              Equivalent Mature Trees
                            </span>
                          </div>
                        </div>
                        <span className="font-label-mono-stat text-label-mono-stat font-bold text-tertiary">
                          +{Math.round(parseFloat(activeDelta) * 56)} Trees
                        </span>
                      </div>

                      {/* Health Resilience */}
                      <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-lowest/80 border border-outline-variant/10">
                        <div className="flex items-center gap-space-sm">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-lg">medical_services</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                              Health Resilience
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface font-semibold">
                              Vulnerable Citizen Buffer
                            </span>
                          </div>
                        </div>
                        <span className="font-label-mono-stat text-label-mono-stat font-bold text-primary">
                          {(parseFloat(activeDelta) * 1400).toLocaleString()} Pop
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Audit & Verification Badge */}
                  <div className="mt-space-md pt-space-sm flex items-center justify-between border-t border-outline-variant/20 text-on-surface-variant text-label-mono-stat font-label-mono-stat">
                    <span className="flex items-center gap-space-2xs text-primary">
                      <span className="material-symbols-outlined text-sm">verified</span>
                      <span>EPD Sensor #9104-OK</span>
                    </span>
                    <span>MongoDB Atlas Synced</span>
                  </div>
                </div>
              </div>

              {/* 3D Tilt Prioritized Interventions Matrix */}
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-primary text-xl">view_kanban</span>
                    <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                      Prioritized Interventions Matrix
                    </h2>
                  </div>
                  <span className="font-label-mono-stat text-label-mono-stat text-on-surface-variant">
                    {filteredInitiatives.length} Interventions Active • Click to Inspect Diurnal Loop
                  </span>
                </div>

                {loading ? (
                  <div className="py-20 text-center text-on-surface-variant font-body-sm">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Synchronizing with MongoDB Atlas...</span>
                  </div>
                ) : filteredInitiatives.length === 0 ? (
                  <div className="p-space-xl bg-surface-container-low/70 rounded-xl border border-outline-variant/20 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl mb-2 text-secondary">filter_alt_off</span>
                    <p className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                      No initiatives match the selected criteria
                    </p>
                    <p className="font-body-sm text-body-sm mt-1">
                      Reset filters or click &ldquo;Register Intervention&rdquo; to add a new initiative.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-lg">
                    {filteredInitiatives.map((ci) => {
                      const typeMeta = TYPE_IMAGES[ci.type] || TYPE_IMAGES.cool_roof;
                      const isSelected = selected?._id === ci._id;
                      const delta = ci.afterTemp != null
                        ? (ci.beforeTemp - ci.afterTemp).toFixed(1)
                        : null;
                      const progressPct = ci.status === 'completed' ? 100 : ci.status === 'active' ? 68 : 25;
                      const statusBadge = ci.status === 'completed'
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : ci.status === 'active'
                        ? 'bg-tertiary/10 text-tertiary border-tertiary/20'
                        : 'bg-secondary/10 text-secondary border-secondary/20';

                      return (
                        <div
                          key={ci._id}
                          onClick={() => setSelected(ci)}
                          className={`bg-surface-container-low/80 backdrop-blur-xl p-space-md rounded-xl shadow-xl flex flex-col justify-between transition-all duration-300 ease-out cursor-pointer group relative overflow-hidden border ${
                            isSelected
                              ? 'border-primary ring-2 ring-primary/40 bg-surface-container-low scale-[1.01]'
                              : 'border-outline-variant/20 hover:border-outline-variant/60 hover:-translate-y-1'
                          }`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          <div className="flex flex-col gap-space-sm">
                            {/* Card Header Badge & Type */}
                            <div className="flex items-center justify-between">
                              <span className={`font-label-caps text-label-caps uppercase px-space-xs py-space-2xs rounded font-bold border ${statusBadge}`}>
                                {ci.status === 'completed' ? 'Completed • Active' : ci.status === 'active' ? 'Phase 2 Construction' : 'Procurement & Planning'}
                              </span>
                              <span className="font-label-mono-stat text-label-mono-stat text-on-surface-variant uppercase">
                                INIT-{ci._id.slice(-4).toUpperCase()}
                              </span>
                            </div>

                            {/* Visual Context Image */}
                            <div className="w-full h-32 rounded-lg overflow-hidden relative shadow-inner">
                              <img
                                alt={ci.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                src={typeMeta.img}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent" />
                              <div className="absolute bottom-2 left-2 flex items-center gap-space-xs">
                                <span className={`font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-surface-container-lowest/90 ${typeMeta.tagColor} font-bold`}>
                                  {typeMeta.metricTag}
                                </span>
                              </div>
                            </div>

                            {/* Title & Summary */}
                            <div className="flex flex-col gap-space-2xs">
                              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                                {ci.name}
                              </h3>
                              <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                                {ci.description || 'Municipal capital heat mitigation intervention with telemetry validation.'}
                              </p>
                            </div>

                            {/* Impact Metrics */}
                            <div className="grid grid-cols-2 gap-space-xs pt-space-xs">
                              <div className="flex flex-col p-space-xs rounded bg-surface-container-lowest border border-outline-variant/10">
                                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                                  Measured Delta
                                </span>
                                <span className="font-headline-sm text-headline-sm font-bold text-primary">
                                  {delta ? `-${delta}°C` : 'Telemetry Sync'}
                                </span>
                              </div>
                              <div className="flex flex-col p-space-xs rounded bg-surface-container-lowest border border-outline-variant/10">
                                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                                  Baseline Peak
                                </span>
                                <span className="font-headline-sm text-headline-sm font-bold text-secondary">
                                  {ci.beforeTemp}°C
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-on-surface-variant font-label-mono-stat text-label-mono-stat px-space-2xs pt-1">
                              <span>Ward: {ci.ward}</span>
                              <span className="text-tertiary">Eq: +{Math.round((delta || 3.4) * 25)} Trees</span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="flex flex-col gap-space-2xs pt-space-md">
                            <div className="flex justify-between font-label-caps text-label-caps text-on-surface-variant uppercase">
                              <span>Pipeline: {ci.status === 'completed' ? 'Phase 3 (Verified)' : ci.status === 'active' ? 'Phase 2 (Construction)' : 'Phase 1 (Planning)'}</span>
                              <span className="text-primary font-bold">{progressPct}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(78,222,163,0.8)] transition-all duration-500"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>

                          {/* Interactive Pipeline Action Controls */}
                          <div className="flex items-center gap-2 pt-space-xs mt-space-xs border-t border-outline-variant/15">
                            {ci.status === 'planned' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAdvancePipeline(ci, 'active');
                                }}
                                className="flex-1 py-1.5 px-2 rounded-lg bg-tertiary/15 hover:bg-tertiary/25 text-tertiary text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer border border-tertiary/30"
                              >
                                <span className="material-symbols-outlined text-sm">construction</span>
                                <span>Advance to Construction →</span>
                              </button>
                            )}

                            {ci.status === 'active' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openTelemetryModal(ci, 'completed');
                                }}
                                className="flex-1 py-1.5 px-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border border-primary/40 shadow-sm"
                              >
                                <span className="material-symbols-outlined text-sm">verified</span>
                                <span>Record & Complete Telemetry ✓</span>
                              </button>
                            )}

                            {ci.status === 'completed' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openTelemetryModal(ci, 'completed');
                                }}
                                className="flex-1 py-1.5 px-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer border border-outline-variant/20"
                              >
                                <span className="material-symbols-outlined text-sm">tune</span>
                                <span>Update Telemetry ({ci.afterTemp != null ? `-${(ci.beforeTemp - ci.afterTemp).toFixed(1)}°C` : 'Sync'})</span>
                              </button>
                            )}

                            <button
                              type="button"
                              title="Decommission & Remove Intervention"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteInitiative(ci);
                              }}
                              className="p-1.5 rounded-lg hover:bg-error-container/20 text-on-surface-variant hover:text-error transition-all cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Register Intervention Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-space-lg w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setIsRegisterOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-center gap-2 text-primary mb-2">
              <span className="material-symbols-outlined">add_chart</span>
              <span className="font-label-caps uppercase font-bold tracking-wider">Urban Resilience Council</span>
            </div>
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface mb-4">
              Register Cooling Intervention
            </h2>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">
                  Initiative Title
                </label>
                <input
                  type="text"
                  required
                  value={newInit.name}
                  onChange={(e) => setNewInit({ ...newInit, name: e.target.value })}
                  placeholder="e.g. Metro West Reflective Cool Roof Network"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-body-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">
                    Intervention Vector
                  </label>
                  <select
                    value={newInit.type}
                    onChange={(e) => setNewInit({ ...newInit, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-body-sm focus:outline-none focus:border-primary"
                  >
                    <option value="cool_roof">Reflective Cool Roof</option>
                    <option value="tree_plantation">Urban Tree Canopy</option>
                    <option value="water_body">Micro-Misting System</option>
                    <option value="reflective_pavement">Permeable High-Albedo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">
                    Municipal Ward
                  </label>
                  <select
                    value={newInit.ward}
                    onChange={(e) => {
                      const w = e.target.value;
                      const coords = WARD_COORDINATES[w] || { lat: 13.0878, lng: 80.2785 };
                      setNewInit({ ...newInit, ward: w, lat: coords.lat, lng: coords.lng });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-body-sm focus:outline-none focus:border-primary"
                  >
                    {TAMIL_NADU_WARDS.slice(1).map((w) => (
                      <option key={w.id} value={w.id}>{w.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">
                    Baseline Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newInit.beforeTemp}
                    onChange={(e) => setNewInit({ ...newInit, beforeTemp: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-body-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">
                    Latitude / Longitude (Auto-Mapped)
                  </label>
                  <input
                    type="text"
                    value={`${newInit.lat}, ${newInit.lng}`}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant text-body-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">
                  Initial Pipeline Stage
                </label>
                <select
                  value={newInit.status || 'planned'}
                  onChange={(e) => setNewInit({ ...newInit, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-body-sm focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="planned">Phase 1: Procurement & Planning</option>
                  <option value="active">Phase 2: Active Construction</option>
                  <option value="completed">Phase 3: Completed & Verifying</option>
                </select>
              </div>

              <div>
                <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">
                  Technical Specifications / Description
                </label>
                <textarea
                  rows="3"
                  value={newInit.description}
                  onChange={(e) => setNewInit({ ...newInit, description: e.target.value })}
                  placeholder="Deployment notes, high-albedo materials, or irrigation telemetry..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-body-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-lg text-body-sm text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold text-body-sm hover:bg-primary-container transition-all flex items-center gap-1 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Registering...' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pipeline Progression & Telemetry Update Modal */}
      {isEditOpen && editingInit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-surface-container border border-outline-variant/40 rounded-2xl p-space-lg w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-2 text-primary mb-1">
              <span className="material-symbols-outlined">linear_scale</span>
              <span className="font-label-caps uppercase font-bold tracking-wider">Cooling Pipeline Progression</span>
            </div>

            <h2 className="font-headline-md text-headline-md font-bold text-on-surface mb-1">
              Update Corridor Status & Telemetry
            </h2>
            <p className="text-body-sm text-on-surface-variant mb-4">
              {editingInit.name} ({editingInit.ward})
            </p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">
                  Pipeline Stage
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'planned', label: 'Phase 1: Planning', icon: 'edit_calendar' },
                    { key: 'active', label: 'Phase 2: Construction', icon: 'construction' },
                    { key: 'completed', label: 'Phase 3: Verified', icon: 'verified' },
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, status: st.key })}
                      className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        editForm.status === st.key
                          ? 'bg-primary/20 border-primary text-primary font-bold shadow-sm'
                          : 'bg-surface-container-lowest border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">{st.icon}</span>
                      <span className="text-xs">{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-space-xs rounded-lg bg-surface-container-lowest border border-outline-variant/20">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block">
                    Baseline Peak
                  </span>
                  <span className="font-headline-sm text-headline-sm font-bold text-secondary">
                    {editingInit.beforeTemp}°C
                  </span>
                </div>

                <div>
                  <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">
                    {editForm.status === 'completed' ? 'Verified Surface Temp (°C)' : 'Awaiting Sensor Telemetry'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={editForm.status !== 'completed'}
                    value={editForm.status === 'completed' ? editForm.afterTemp : ''}
                    onChange={(e) => setEditForm({ ...editForm, afterTemp: e.target.value })}
                    placeholder={editForm.status === 'completed' ? 'e.g. 37.2' : 'Pending completion'}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-body-sm focus:outline-none focus:border-primary disabled:opacity-50"
                  />
                </div>
              </div>

              {editForm.status === 'completed' && editForm.afterTemp && (
                <div className="p-space-xs rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between text-xs text-primary font-semibold">
                  <span>Calculated Verified Dissipation:</span>
                  <span className="text-sm font-bold font-mono">
                    -{(editingInit.beforeTemp - parseFloat(editForm.afterTemp)).toFixed(1)}°C SINK
                  </span>
                </div>
              )}

              <div>
                <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">
                  Progress Notes / Telemetry Log
                </label>
                <textarea
                  rows="3"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Material reflectance index, sensor serial numbers, or installation status..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-body-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-lg text-body-sm text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPipeline}
                  className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold text-body-sm hover:bg-primary-container transition-all flex items-center gap-1 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {updatingPipeline ? 'Updating...' : 'Save Pipeline Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

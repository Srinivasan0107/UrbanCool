import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';
import SensorReading from './src/models/SensorReading.js';
import WeatherStation from './src/models/WeatherStation.js';
import HeatHotspot from './src/models/HeatHotspot.js';
import GreenCoverZone from './src/models/GreenCoverZone.js';
import CoolingInitiative from './src/models/CoolingInitiative.js';
import Alert from './src/models/Alert.js';
import { connectDB } from './src/db.js';

// Tamil Nadu Municipal Wards & Sectors
const WARDS = ['Ward-1', 'Ward-2', 'Ward-3', 'Ward-4', 'Ward-5'];

// Real Tamil Nadu City & District Coordinates
const WARD_CENTERS = [
  { name: 'Chennai Central — George Town Harbor', lat: 13.0878, lng: 80.2785 },
  { name: 'Chennai South-Central — T. Nagar Commercial', lat: 13.0418, lng: 80.2341 },
  { name: 'Chennai South — Guindy & Alandur Industrial', lat: 13.0067, lng: 80.2025 },
  { name: 'Chennai Cyber Corridor — Sholinganallur & OMR', lat: 12.9010, lng: 80.2279 },
  { name: 'Western Tamil Nadu — Coimbatore Gandhipuram', lat: 11.0168, lng: 76.9558 },
];

function rand(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function makeOrganicThermalContour(center, radiusDeg = 0.0055, numPoints = 28) {
  const { lat, lng } = center;
  const coordinates = [];
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * (2 * Math.PI);
    // Smooth harmonic wave creates realistic thermal plume dispersion
    const harmonic1 = Math.sin(angle * 3) * 0.16;
    const harmonic2 = Math.cos(angle * 2) * 0.10;
    const harmonic3 = Math.sin(angle * 5) * 0.05;
    const factor = 1 + harmonic1 + harmonic2 + harmonic3;
    const rLat = radiusDeg * factor * 0.92;
    const rLng = radiusDeg * factor * 1.08;
    coordinates.push([
      Number((lng + Math.cos(angle) * rLng).toFixed(6)),
      Number((lat + Math.sin(angle) * rLat).toFixed(6)),
    ]);
  }
  return {
    type: 'Polygon',
    coordinates: [coordinates],
  };
}

function makeEcologicalCanopyContour(center, radiusDeg = 0.012, numPoints = 32) {
  const { lat, lng } = center;
  const coordinates = [];
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * (2 * Math.PI);
    const wave = 1 + 0.14 * Math.sin(angle * 4) + 0.08 * Math.cos(angle * 3);
    coordinates.push([
      Number((lng + Math.cos(angle) * radiusDeg * wave * 1.1).toFixed(6)),
      Number((lat + Math.sin(angle) * radiusDeg * wave * 0.9).toFixed(6)),
    ]);
  }
  return {
    type: 'Polygon',
    coordinates: [coordinates],
  };
}

export async function seedDB() {
  await connectDB();
  console.log('Connected to MongoDB. Clearing existing collections...');

  await Promise.all([
    User.deleteMany({}),
    SensorReading.deleteMany({}),
    WeatherStation.deleteMany({}),
    HeatHotspot.deleteMany({}),
    GreenCoverZone.deleteMany({}),
    CoolingInitiative.deleteMany({}),
    Alert.deleteMany({}),
  ]);

  // ── 1. Users ───────────────────────────────────────────────────────────────
  const plannerHash = await bcrypt.hash('planner123', 10);
  const citizenHash = await bcrypt.hash('citizen123', 10);
  await User.create([
    {
      name: 'Dr. K. Annamalai',
      email: 'planner@urbancool.dev',
      passwordHash: plannerHash,
      role: 'planner',
      ward: 'Ward-1',
      phone: '+91 94440 18274',
      department: 'Greater Chennai Corporation (GCC) — Disaster Management & Urban Heat Resilience Cell',
      notificationPreferences: { email: true, push: true, sms: true, criticalOnly: false },
    },
    {
      name: 'S. Meenakshi Sundaram',
      email: 'citizen@urbancool.dev',
      passwordHash: citizenHash,
      role: 'citizen',
      ward: 'Ward-2',
      phone: '+91 98401 67890',
      department: 'T. Nagar Residents Welfare & Climate Action Network',
      notificationPreferences: { email: true, push: true, sms: false, criticalOnly: true },
    },
  ]);
  console.log('✓ Users seeded (2)');

  // ── 2. Sensor Readings (120+ across Tamil Nadu) ─────────────────────────────
  const sensorReadings = [];
  for (let w = 0; w < 5; w++) {
    const center = WARD_CENTERS[w];
    for (let i = 0; i < 24; i++) {
      sensorReadings.push({
        sensorId:    `TN-SENS-${WARDS[w]}-${String(i + 1).padStart(2, '0')}`,
        ward:        WARDS[w],
        lat:         center.lat + rand(-0.015, 0.015),
        lng:         center.lng + rand(-0.015, 0.015),
        temperature: rand(32.4, 44.8), // Realistic peak Tamil Nadu summer temps
        humidity:    rand(52, 86),    // Realistic coastal humidity
        timestamp:   daysAgo(Math.floor(Math.random() * 7)),
      });
    }
  }
  await SensorReading.insertMany(sensorReadings);
  console.log(`✓ Sensor readings seeded (${sensorReadings.length}) for Tamil Nadu`);

  // ── 3. Weather Stations (IMD Observatories in Tamil Nadu) ───────────────────
  const stationNames = [
    'IMD Regional Met Centre — Nungambakkam',
    'Meenambakkam Airport Met Station',
    'Guindy Industrial Microclimate Station',
    'OMR Sholinganallur High-Tech Weather Lab',
    'Coimbatore Peelamedu Regional Agro-Met Station',
  ];

  await WeatherStation.insertMany(
    WARDS.map((ward, i) => ({
      stationId:   `TN-WS-${ward}`,
      name:        stationNames[i],
      location:    { lat: WARD_CENTERS[i].lat, lng: WARD_CENTERS[i].lng },
      temperature: rand(33.5, 42.8),
      humidity:    rand(54, 82),
      windSpeed:   rand(6, 24),
      timestamp:   new Date(),
    }))
  );
  console.log('✓ Weather stations seeded (5 Tamil Nadu IMD Stations)');

  // ── 4. Heat Hotspots (Accurate Tamil Nadu Urban Landmarks) ────────────────
  const REAL_TAMIL_NADU_HOTSPOTS = [
    // Ward-1: Chennai Central & North
    {
      name: 'Chennai Central Terminus & Wall Tax Road',
      landmark: 'Puratchi Thalaivar Dr. M.G. Ramachandran Concourse',
      wardId: 'Ward-1',
      center: { lat: 13.0827, lng: 80.2755 },
      intensity: 'critical',
      peakTemp: 44.8,
      radiusDeg: 0.0055,
      status: 'active',
      detectedAt: daysAgo(1),
    },
    {
      name: 'George Town Harbor & Rajaji Salai Logistics Spine',
      landmark: 'Chennai Port Container Corridor & High Density Warehousing',
      wardId: 'Ward-1',
      center: { lat: 13.0891, lng: 80.2842 },
      intensity: 'high',
      peakTemp: 43.6,
      radiusDeg: 0.0062,
      status: 'active',
      detectedAt: daysAgo(3),
    },
    {
      name: 'Broadway Bus Terminus & NSC Bose Road Axis',
      landmark: 'High Commercial Density & Asphalt Core',
      wardId: 'Ward-1',
      center: { lat: 13.0915, lng: 80.2830 },
      intensity: 'medium',
      peakTemp: 41.2,
      radiusDeg: 0.0048,
      status: 'active',
      detectedAt: daysAgo(5),
    },

    // Ward-2: Chennai South-Central (T. Nagar)
    {
      name: 'T. Nagar Ranganathan Street Pedestrian Heat Core',
      landmark: 'Usman Road Flyover & Extreme Footfall Retail District',
      wardId: 'Ward-2',
      center: { lat: 13.0405, lng: 80.2332 },
      intensity: 'critical',
      peakTemp: 45.2,
      radiusDeg: 0.0052,
      status: 'active',
      detectedAt: daysAgo(1),
    },
    {
      name: 'Pondy Bazaar & Panagal Park Commercial Concourse',
      landmark: 'Sir Thyagaraya Road Urban Canyon & Concrete Retail Block',
      wardId: 'Ward-2',
      center: { lat: 13.0425, lng: 80.2380 },
      intensity: 'high',
      peakTemp: 43.1,
      radiusDeg: 0.0045,
      status: 'active',
      detectedAt: daysAgo(2),
    },
    {
      name: 'Kodambakkam High Road Rail Overbridge',
      landmark: 'Heavy Vehicular Congestion & Asphalt Radiation Zone',
      wardId: 'Ward-2',
      center: { lat: 13.0512, lng: 80.2260 },
      intensity: 'medium',
      peakTemp: 41.8,
      radiusDeg: 0.0042,
      status: 'resolved',
      detectedAt: daysAgo(8),
    },

    // Ward-3: Chennai South (Guindy & Alandur)
    {
      name: 'Guindy Industrial Estate & SIDCO Foundry Hub',
      landmark: 'Thiru-Vi-Ka Industrial Complex & Metal Fabrication Units',
      wardId: 'Ward-3',
      center: { lat: 13.0102, lng: 80.2030 },
      intensity: 'critical',
      peakTemp: 44.5,
      radiusDeg: 0.0068,
      status: 'active',
      detectedAt: daysAgo(2),
    },
    {
      name: 'Kathipara Cloverleaf Grade Separator Junction',
      landmark: 'Multi-Level Elevated Asphalt Highway & Metro Interchange',
      wardId: 'Ward-3',
      center: { lat: 13.0072, lng: 80.2052 },
      intensity: 'high',
      peakTemp: 43.4,
      radiusDeg: 0.0058,
      status: 'active',
      detectedAt: daysAgo(4),
    },
    {
      name: 'Alandur Metro Concourse & GST Road Axis',
      landmark: 'Southern Grand Trunk Road Transit Bottleneck',
      wardId: 'Ward-3',
      center: { lat: 12.9985, lng: 80.2015 },
      intensity: 'medium',
      peakTemp: 41.0,
      radiusDeg: 0.0050,
      status: 'resolved',
      detectedAt: daysAgo(11),
    },

    // Ward-4: Chennai Cyber Corridor (OMR & South)
    {
      name: 'OMR Sholinganallur Junction & Tech Boulevard',
      landmark: 'IT Corridor Multilane Expressway & Glass Façade Towers',
      wardId: 'Ward-4',
      center: { lat: 12.9010, lng: 80.2279 },
      intensity: 'critical',
      peakTemp: 44.0,
      radiusDeg: 0.0072,
      status: 'active',
      detectedAt: daysAgo(1),
    },
    {
      name: 'Siruseri SIPCOT IT Park Logistics Gate',
      landmark: 'Massive Paved Campus & Low Vegetation Thermal Island',
      wardId: 'Ward-4',
      center: { lat: 12.8315, lng: 80.2185 },
      intensity: 'high',
      peakTemp: 42.9,
      radiusDeg: 0.0065,
      status: 'active',
      detectedAt: daysAgo(3),
    },
    {
      name: 'Thoraipakkam 200 Feet Radial Road Concourse',
      landmark: 'East Coast Road Link Expressway Thermal Basin',
      wardId: 'Ward-4',
      center: { lat: 12.9350, lng: 80.2310 },
      intensity: 'medium',
      peakTemp: 40.5,
      radiusDeg: 0.0055,
      status: 'active',
      detectedAt: daysAgo(6),
    },

    // Ward-5: Western Tamil Nadu (Coimbatore)
    {
      name: 'Coimbatore Gandhipuram Central Bus Terminus',
      landmark: 'Dr. Nanjappa Road Commercial Concourse & Diesel Exhaust Hub',
      wardId: 'Ward-5',
      center: { lat: 11.0168, lng: 76.9670 },
      intensity: 'critical',
      peakTemp: 43.8,
      radiusDeg: 0.0060,
      status: 'active',
      detectedAt: daysAgo(1),
    },
    {
      name: 'Cross-Cut Road & 100 Feet Road Commercial Core',
      landmark: 'Dense High-Rise Gold & Textile Retail Canyon',
      wardId: 'Ward-5',
      center: { lat: 11.0225, lng: 76.9620 },
      intensity: 'high',
      peakTemp: 42.4,
      radiusDeg: 0.0048,
      status: 'active',
      detectedAt: daysAgo(4),
    },
    {
      name: 'Peelamedu Heavy Foundry & Engineering Cluster',
      landmark: 'Avinashi Road Industrial Belt & Textile Machinery Parks',
      wardId: 'Ward-5',
      center: { lat: 11.0315, lng: 77.0125 },
      intensity: 'medium',
      peakTemp: 41.5,
      radiusDeg: 0.0056,
      status: 'active',
      detectedAt: daysAgo(5),
    },
    {
      name: 'Singanallur Bus Stand & Trichy Road Corridor',
      landmark: 'Eastern Transit Node & Heavy Freight Corridors',
      wardId: 'Ward-5',
      center: { lat: 10.9995, lng: 77.0220 },
      intensity: 'low',
      peakTemp: 39.2,
      radiusDeg: 0.0045,
      status: 'resolved',
      detectedAt: daysAgo(12),
    },
  ];

  const hotspots = REAL_TAMIL_NADU_HOTSPOTS.map((h) => ({
    name:       h.name,
    landmark:   h.landmark,
    peakTemp:   h.peakTemp,
    center:     h.center,
    geometry:   makeOrganicThermalContour(h.center, h.radiusDeg),
    intensity:  h.intensity,
    wardId:     h.wardId,
    detectedAt: h.detectedAt,
    status:     h.status,
  }));

  const createdHotspots = await HeatHotspot.insertMany(hotspots);
  console.log(`✓ Heat hotspots seeded (${createdHotspots.length} accurate Tamil Nadu landmarks)`);

  // ── 5. Green Cover Zones (Tamil Nadu Canopy & Wetland Parks) ───────────────
  const ndviValues = [0.28, 0.32, 0.58, 0.64, 0.52];
  await GreenCoverZone.insertMany(
    WARDS.map((ward, i) => ({
      wardId:             ward,
      geometry:           makeEcologicalCanopyContour(WARD_CENTERS[i], 0.012),
      ndviValue:          ndviValues[i],
      changeFromBaseline: rand(-0.08, 0.14),
      recordedAt:         daysAgo(30),
    }))
  );
  console.log('✓ Green cover zones seeded (5 Tamil Nadu ecological zones)');

  // ── 6. Cooling Initiatives (Tamil Nadu Real Interventions) ──────────────────
  const coolingInterventions = [
    {
      name: 'Singara Chennai 2.0 Titanium Dioxide Reflective Cool Roofs — T. Nagar',
      description: 'High-albedo reflective elastomer membrane applied across 65,000 sq ft commercial roofs on Usman Road & Ranganathan St.',
      type: 'cool_roof',
      ward: 'Ward-2',
      location: { lat: 13.0402, lng: 80.2337 },
      beforeTemp: 44.2,
      afterTemp: 38.4,
      status: 'completed',
    },
    {
      name: 'GCC Kotturpuram Canal Bank Miyawaki Urban Dense Forest',
      description: 'Native tree afforestation with 22,000 multi-tier indigenous species (Neem, Marudham, Pungai) along the Adyar river basin.',
      type: 'tree_plantation',
      ward: 'Ward-1',
      location: { lat: 13.0827, lng: 80.2707 },
      beforeTemp: 43.5,
      afterTemp: 38.1,
      status: 'completed',
    },
    {
      name: 'Automated Solar High-Mist Cooling Network — Chennai Central Concourse',
      description: 'Atomized high-pressure evaporative chillers triggered when Wet Bulb Globe Temperature exceeds 31°C around suburban train terminals.',
      type: 'water_body',
      ward: 'Ward-1',
      location: { lat: 13.0820, lng: 80.2750 },
      beforeTemp: 42.8,
      afterTemp: 37.0,
      status: 'completed',
    },
    {
      name: 'High-Albedo Permeable Pavements & Bio-Retention Swales — Anna Nagar',
      description: 'Interlocking high-solar-reflectance permeable pavers providing ground cooling and coastal stormwater percolation.',
      type: 'reflective_pavement',
      ward: 'Ward-1',
      location: { lat: 13.0850, lng: 80.2150 },
      beforeTemp: 41.5,
      afterTemp: 36.8,
      status: 'completed',
    },
    {
      name: 'Guindy Industrial Estate Photovoltaic Shading Pergolas — SIDCO',
      description: 'Bifacial solar canopy corridors shielding pedestrian manufacturing workers from asphalt radiation.',
      type: 'cool_roof',
      ward: 'Ward-3',
      location: { lat: 13.0067, lng: 80.2025 },
      beforeTemp: 43.8,
      status: 'active',
    },
    {
      name: 'Adyar Eco-Park Brackish Wetland Restoration & Microclimate Sink',
      description: '358-acre tidal wetland rejuvenation providing continuous natural cooling buffer for residential South Chennai.',
      type: 'water_body',
      ward: 'Ward-4',
      location: { lat: 12.9860, lng: 80.2520 },
      beforeTemp: 42.0,
      afterTemp: 37.2,
      status: 'completed',
    },
    {
      name: 'OMR IT Expressway Tree Shading Corridors — Sholinganallur Junction',
      description: '4.5 km dense multi-row evergreen shade trees along the expressway median to reduce concrete heat dome.',
      type: 'tree_plantation',
      ward: 'Ward-4',
      location: { lat: 12.9010, lng: 80.2279 },
      beforeTemp: 44.0,
      status: 'active',
    },
    {
      name: 'Coimbatore Peelamedu Industrial Buffer Green Belt',
      description: 'Western Tamil Nadu heat mitigation belt with 14,000 drought-tolerant native trees along Avinashi Road.',
      type: 'tree_plantation',
      ward: 'Ward-5',
      location: { lat: 11.0250, lng: 76.9950 },
      beforeTemp: 41.8,
      status: 'active',
    },
    {
      name: 'George Town Port Gates Automated Mist Hydration Arches',
      description: 'Heavy vehicle freight terminal atomization arches reducing roadside surface temperatures for port logistics workers.',
      type: 'water_body',
      ward: 'Ward-1',
      location: { lat: 13.0900, lng: 80.2850 },
      beforeTemp: 43.6,
      status: 'planned',
    },
    {
      name: 'Madurai Heritage Zone Breathable Limestone Pavements',
      description: 'Low thermal emissivity natural limestone paving replacing asphalt around Meenakshi Amman Temple core.',
      type: 'reflective_pavement',
      ward: 'Ward-3',
      location: { lat: 13.0200, lng: 80.1900 },
      beforeTemp: 42.5,
      status: 'planned',
    },
    {
      name: 'Panagal Park Cool Roof Shading Pergolas — T. Nagar Pedestrian Hub',
      description: 'Reflective canopies with integrated solar power and water refilling stations for senior shoppers.',
      type: 'cool_roof',
      ward: 'Ward-2',
      location: { lat: 13.0418, lng: 80.2341 },
      beforeTemp: 43.9,
      status: 'active',
    },
    {
      name: 'Coimbatore Gandhipuram Bus Terminal Micro-Misting Roof Network',
      description: 'High-capacity misting lines beneath corrugated iron terminal shelters to mitigate extreme ambient midday heat.',
      type: 'water_body',
      ward: 'Ward-5',
      location: { lat: 11.0168, lng: 76.9558 },
      beforeTemp: 42.2,
      status: 'planned',
    },
  ];

  await CoolingInitiative.insertMany(
    coolingInterventions.map((ci, i) => ({
      ...ci,
      startDate: daysAgo(90 - i * 6),
    }))
  );
  console.log(`✓ Cooling initiatives seeded (${coolingInterventions.length} Tamil Nadu projects)`);

  // ── 7. Alerts & Notification System (Tamil Nadu Real Advisories) ───────────
  const tamilNaduAlerts = [
    {
      title: 'CRITICAL: Extreme Coastal Heat Dome Over George Town Port',
      severity: 'critical',
      ward: 'Ward-1',
      targetRole: 'all',
      recommendedAction: 'Wet Bulb Temperature at 34.2°C. Open emergency misting shelters at Central Station & Port Gates. GCC mobile medical vans dispatched.',
      createdAt: daysAgo(0),
      read: false,
    },
    {
      title: 'HIGH: T. Nagar Commercial Asphalt Radiation Warning',
      severity: 'high',
      ward: 'Ward-2',
      targetRole: 'citizen',
      recommendedAction: 'Usman Road surface temperature exceeded 43.8°C. Commuters advised to utilize shaded pedestrian plaza and hydrated rest shelters.',
      createdAt: daysAgo(1),
      read: false,
    },
    {
      title: 'CRITICAL: Guindy Transit Hub Industrial Roof Heat Surge',
      severity: 'critical',
      ward: 'Ward-3',
      targetRole: 'planner',
      recommendedAction: 'Industrial roof surface temp reached 52.4°C. Dispatch evaporative chiller tankers along SIDCO bus bay immediately.',
      createdAt: daysAgo(1),
      read: false,
    },
    {
      title: 'HIGH: Sholinganallur OMR IT Corridor Solar Glare & Radiation',
      severity: 'high',
      ward: 'Ward-4',
      targetRole: 'all',
      recommendedAction: 'Glass facade heat reflection elevated ambient road temp by +4.2°C. Avoid outdoor athletic activities between 12:00 PM and 4:00 PM.',
      createdAt: daysAgo(2),
      read: true,
    },
    {
      title: 'CRITICAL: Coimbatore Gandhipuram Bus Stand Heat Wave Advisory',
      severity: 'critical',
      ward: 'Ward-5',
      targetRole: 'all',
      recommendedAction: 'Severe dry heat wave triggered. Free buttermilk and chilled ORS distribution booths active across bus bays 1 to 4.',
      createdAt: daysAgo(2),
      read: false,
    },
    {
      title: 'MEDIUM: Kotturpuram Adyar River Corridor Monitoring',
      severity: 'medium',
      ward: 'Ward-1',
      targetRole: 'citizen',
      recommendedAction: 'Miyawaki urban forest providing localized -4.6°C cooling. Residents encouraged to utilize shaded walking tracks.',
      createdAt: daysAgo(3),
      read: true,
    },
    {
      title: 'HIGH: Alandur Metro Interchange Thermal Exposure Alert',
      severity: 'high',
      ward: 'Ward-3',
      targetRole: 'all',
      recommendedAction: 'Elevated platform temperature recorded at 41.5°C. AC waiting halls opened with free drinking water for senior citizens.',
      createdAt: daysAgo(3),
      read: true,
    },
    {
      title: 'LOW: Anna Nagar West Sensor Cluster Nominal',
      severity: 'low',
      ward: 'Ward-1',
      targetRole: 'planner',
      recommendedAction: 'Permeable pavement pilot performing within standard threshold. Sub-surface moisture retention verified.',
      createdAt: daysAgo(4),
      read: true,
    },
    {
      title: 'MEDIUM: Peelamedu Coimbatore Industrial Heat Spillover',
      severity: 'medium',
      ward: 'Ward-5',
      targetRole: 'all',
      recommendedAction: 'Advise textile mill workers to take mandatory 15-minute hydration breaks every hour during afternoon shifts.',
      createdAt: daysAgo(5),
      read: true,
    },
  ];

  // Add more varied alerts linked to hotspots
  const intensities = ['low', 'medium', 'high', 'critical'];
  for (let i = 0; i < 15; i++) {
    const wardIdx = i % 5;
    const sev = intensities[i % 4];
    tamilNaduAlerts.push({
      title: `${sev.toUpperCase()} Thermal Alert — ${WARDS[wardIdx]}`,
      hotspotId: createdHotspots[i % createdHotspots.length]._id,
      severity: sev,
      recommendedAction: `District emergency alert for ${WARD_CENTERS[wardIdx].name}. Ensure municipal water points are active and check on elderly neighbors.`,
      targetRole: ['planner', 'citizen', 'all'][i % 3],
      ward: WARDS[wardIdx],
      createdAt: daysAgo(i + 1),
      read: i > 4,
    });
  }

  await Alert.insertMany(tamilNaduAlerts);
  console.log(`✓ Alerts & notifications seeded (${tamilNaduAlerts.length} Tamil Nadu records)`);

  console.log('\n======================================================');
  console.log('  UrbanCool Tamil Nadu Dataset Seed Completed Successfully!');
  console.log('======================================================');
  console.log('Regions: Chennai (George Town, T. Nagar, Guindy, OMR) & Coimbatore');
  console.log('Planner Login : planner@urbancool.dev / planner123');
  console.log('Citizen Login : citizen@urbancool.dev / citizen123');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

// Auto-run when called directly
if (process.argv[1]?.endsWith('seed.js')) {
  seedDB().catch(console.error);
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { useTheme } from '../context/ThemeContext.jsx';
import 'leaflet/dist/leaflet.css';

const INTENSITY_COLOR = {
  low:      '#4edea3',
  medium:   '#ffb95f',
  high:     '#ee9800',
  critical: '#ffb4ab',
};

const INTENSITY_FILL = {
  low:      '#10b981',
  medium:   '#ffb95f',
  high:     '#ee9800',
  critical: '#dc2626',
};

const GOOGLE_DARK_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0f131c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0e16' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#86948a' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bbcabf' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#4edea3' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#13281e' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#38b584' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1b2230' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#161c28' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#a0aab5' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#253043' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1a2332' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#ffb95f' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1e2637' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#4fdbc8' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#09111e' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#304b6b' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#09111e' }] },
];

/**
 * Calculates or retrieves the accurate coordinate center of any hotspot.
 */
function getHotspotCenter(hs) {
  if (hs?.center && typeof hs.center.lat === 'number' && typeof hs.center.lng === 'number') {
    return [hs.center.lat, hs.center.lng];
  }
  if (hs?.geometry?.type === 'Point' && Array.isArray(hs.geometry.coordinates)) {
    return [hs.geometry.coordinates[1], hs.geometry.coordinates[0]];
  }
  if (hs?.geometry?.type === 'Polygon' && hs.geometry.coordinates?.[0]?.length) {
    const coords = hs.geometry.coordinates[0];
    let sumLat = 0;
    let sumLng = 0;
    coords.forEach(([lng, lat]) => {
      sumLng += lng;
      sumLat += lat;
    });
    return [sumLat / coords.length, sumLng / coords.length];
  }
  return [13.0418, 80.2341];
}

/**
 * Map controller hook component to ensure Leaflet renders immediately
 * without blank tiles, and animates smoothly to ward changes.
 */
function MapController({ center, isDark }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 80);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    const t3 = setTimeout(() => map.invalidateSize(), 700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [map, isDark]);

  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, 13, { duration: 1.2 });
    }
  }, [center, map]);

  return null;
}

function hotspotContourStyle(feature) {
  const intensity = feature.properties?.intensity || 'medium';
  return {
    color: INTENSITY_COLOR[intensity] || '#ffb95f',
    fillColor: INTENSITY_FILL[intensity] || '#ee9800',
    fillOpacity: intensity === 'critical' ? 0.28 : 0.18,
    weight: 1.5,
    dashArray: '3 5', // smooth organic plume boundary instead of a solid rigid box
  };
}

function greenCoverStyle() {
  return {
    color: '#4edea3',
    fillColor: '#10b981',
    fillOpacity: 0.3,
    weight: 1.5,
    dashArray: '3 4',
  };
}

function renderHotspotPopupHTML(p, isDark) {
  const bg = isDark ? '#0f131c' : '#ffffff';
  const text = isDark ? '#dfe2ee' : '#0f172a';
  const titleColor = isDark ? '#ffffff' : '#0f172a';
  const subColor = isDark ? '#bbcabf' : '#475569';
  const dateColor = isDark ? '#86948a' : '#64748b';
  const badgeBg = p.intensity === 'critical' ? '#dc2626' : p.intensity === 'high' ? '#ee9800' : '#ffb95f';
  const border = isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0';

  return `
    <div style="background:${bg}; color:${text}; padding:14px; border-radius:12px; font-family:Inter,sans-serif; min-width:240px; border:${border}; box-shadow:0 12px 28px rgba(0,0,0,0.25);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; gap:8px;">
        <span style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:${subColor};">
          ${p.wardId || 'Tamil Nadu'}
        </span>
        <span style="background:${badgeBg}; color:#ffffff; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700; text-transform:uppercase;">
          ${p.intensity}
        </span>
      </div>
      <div style="font-weight:700; color:${titleColor}; font-size:13px; margin-bottom:4px; line-height:1.3;">
        ${p.name || 'Thermal Ground Core'}
      </div>
      ${p.landmark ? `<div style="font-size:11px; color:${subColor}; margin-bottom:8px;">📍 ${p.landmark}</div>` : ''}
      <div style="display:flex; justify-content:space-between; align-items:center; background:${isDark ? '#1a202c' : '#f1f5f9'}; padding:6px 10px; border-radius:8px; margin-bottom:8px;">
        <span style="font-size:11px; color:${subColor};">Peak Surface Temp:</span>
        <strong style="color:#ef4444; font-size:13px;">${p.peakTemp ? `${p.peakTemp}°C` : 'Elevated'}</strong>
      </div>
      <div style="font-size:10px; color:${dateColor}; display:flex; justify-content:space-between;">
        <span>Status: <b style="color:#10b981;">${p.status || 'Active'}</b></span>
        <span>${new Date(p.detectedAt || Date.now()).toLocaleDateString()}</span>
      </div>
    </div>
  `;
}

let isGoogleMapsConfigured = false;
function ensureGoogleMapsConfigured(key) {
  if (!isGoogleMapsConfigured && key) {
    try {
      setOptions({ key, v: 'weekly' });
      isGoogleMapsConfigured = true;
    } catch {
      // Options already configured
    }
  }
}

export default function HeatMap({
  hotspots = [],
  greencover = [],
  showGreenCover = false,
  center = [13.0418, 80.2341],
  onSelectHotspot,
}) {
  const { isDark } = useTheme();
  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Default to leaflet_vector for 100% reliable, zero-lag, instant 50ms load
  const [provider, setProvider] = useState('leaflet_vector');
  const [googleLoadError, setGoogleLoadError] = useState(null);

  const googleMapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const infoWindowRef = useRef(null);
  const markersRef = useRef([]);

  const hotspotGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: hotspots.map((hs) => ({
      type: 'Feature',
      geometry: hs.geometry,
      properties: {
        id: hs._id,
        name: hs.name || `${hs.wardId} Thermal Core`,
        landmark: hs.landmark || 'Urban Thermal Area',
        peakTemp: hs.peakTemp,
        center: hs.center,
        intensity: hs.intensity,
        wardId: hs.wardId,
        status: hs.status,
        detectedAt: hs.detectedAt,
      },
    })),
  }), [hotspots]);

  const greenCoverGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: greencover.map((gc) => ({
      type: 'Feature',
      geometry: gc.geometry,
      properties: { wardId: gc.wardId, ndviValue: gc.ndviValue },
    })),
  }), [greencover]);

  // Handle Google Maps authentication failures gracefully
  useEffect(() => {
    window.gm_authFailure = () => {
      console.warn('Google Maps authentication failed (gm_authFailure). Falling back to CartoDB.');
      setGoogleLoadError('Google Maps key unauthorized or restricted on localhost. Switched to CartoDB.');
      setProvider('leaflet_vector');
    };
    return () => {
      delete window.gm_authFailure;
    };
  }, []);

  // Google Maps initialisation and reactive updates
  useEffect(() => {
    if (!provider.startsWith('google') || !googleKey || !googleMapRef.current) return;

    let isMounted = true;
    ensureGoogleMapsConfigured(googleKey);

    importLibrary('maps')
      .then(({ Map, InfoWindow, Circle, Marker }) => {
        if (!isMounted || !googleMapRef.current) return;

        const mapTypeId = provider === 'google_satellite' ? 'hybrid' : 'roadmap';
        const styles = provider === 'google_dark' ? (isDark ? GOOGLE_DARK_STYLES : []) : [];
        const bgColor = isDark ? '#0a0e16' : '#f8fafc';

        if (!mapInstanceRef.current) {
          const map = new Map(googleMapRef.current, {
            center: { lat: center[0], lng: center[1] },
            zoom: 13,
            styles: styles,
            mapTypeId: mapTypeId,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            backgroundColor: bgColor,
          });
          mapInstanceRef.current = map;
          infoWindowRef.current = new InfoWindow();
        } else {
          mapInstanceRef.current.setMapTypeId(mapTypeId);
          mapInstanceRef.current.setOptions({
            styles: styles,
            backgroundColor: bgColor,
          });
          mapInstanceRef.current.panTo({ lat: center[0], lng: center[1] });
        }

        const map = mapInstanceRef.current;

        // Clear existing markers and halos
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        // Clear existing GeoJSON data features
        map.data.forEach((feature) => {
          map.data.remove(feature);
        });

        // Add Organic Hotspots Plumes
        if (hotspotGeoJSON.features.length > 0) {
          map.data.addGeoJson(hotspotGeoJSON);
        }

        // Add Green Cover
        if (showGreenCover && greenCoverGeoJSON.features.length > 0) {
          map.data.addGeoJson(greenCoverGeoJSON);
        }

        map.data.setStyle((feature) => {
          const intensity = feature.getProperty('intensity');
          const ndvi = feature.getProperty('ndviValue');

          if (intensity) {
            const fillColor = INTENSITY_FILL[intensity] || '#ee9800';
            const strokeColor = INTENSITY_COLOR[intensity] || '#ffb95f';
            return {
              fillColor: fillColor,
              fillOpacity: intensity === 'critical' ? 0.3 : 0.2,
              strokeColor: strokeColor,
              strokeWeight: 1.5,
              clickable: true,
            };
          } else if (ndvi !== undefined) {
            return {
              fillColor: '#10b981',
              fillOpacity: 0.3,
              strokeColor: '#4edea3',
              strokeWeight: 1.5,
              clickable: false,
            };
          }
          return {};
        });

        // Add accurate landmark pins and radiant heat halos on Google Maps
        hotspots.forEach((hs) => {
          const [lat, lng] = getHotspotCenter(hs);
          const intensity = hs.intensity || 'medium';
          const color = INTENSITY_COLOR[intensity] || '#ffb95f';
          const fill = INTENSITY_FILL[intensity] || '#ee9800';

          // Outer radiant thermal halo
          const halo = new Circle({
            strokeColor: color,
            strokeOpacity: 0.7,
            strokeWeight: 1.5,
            fillColor: fill,
            fillOpacity: intensity === 'critical' ? 0.2 : 0.12,
            map: map,
            center: { lat, lng },
            radius: intensity === 'critical' ? 500 : 350,
          });
          markersRef.current.push(halo);

          // Core landmark pin
          const pin = new Marker({
            position: { lat, lng },
            map: map,
            title: `${hs.name || hs.wardId} (${hs.peakTemp || ''}°C)`,
            icon: {
              path: 0, // SymbolPath.CIRCLE
              scale: intensity === 'critical' ? 8 : 7,
              fillColor: fill,
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });

          pin.addListener('click', () => {
            if (infoWindowRef.current) {
              infoWindowRef.current.setContent(renderHotspotPopupHTML(hs, isDark));
              infoWindowRef.current.setPosition({ lat, lng });
              infoWindowRef.current.open(map);
            }
            if (onSelectHotspot) onSelectHotspot(hs);
          });
          markersRef.current.push(pin);
        });
      })
      .catch((err) => {
        console.warn('Google Maps failed to load, falling back to CartoDB:', err);
        setGoogleLoadError(err.message || 'Google Maps failed to initialize');
        setProvider('leaflet_vector');
      });

    return () => {
      isMounted = false;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
  }, [provider, googleKey, showGreenCover, hotspotGeoJSON, greenCoverGeoJSON, hotspots, center, isDark, onSelectHotspot]);

  return (
    <div
      className="rounded-2xl border border-outline-variant/30 shadow-2xl overflow-hidden relative w-full h-full"
      style={{ minHeight: '520px' }}
    >
      {/* Map Engine Switcher & Provider Pill (Positioned cleanly at bottom-right) */}
      <div className="absolute bottom-4 right-4 z-[900] flex flex-wrap items-center gap-1.5 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-outline-variant/40 shadow-xl text-xs">
        <span className="font-semibold text-on-surface-variant flex items-center gap-1 text-[11px] mr-1">
          <span className="material-symbols-outlined text-primary text-sm">map</span>
          Base:
        </span>

        <button
          type="button"
          onClick={() => setProvider('leaflet_vector')}
          className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${
            provider === 'leaflet_vector'
              ? 'bg-primary text-on-primary font-bold shadow-sm'
              : 'text-on-surface hover:bg-surface-container-high'
          }`}
          title="Instant loading high-contrast GIS basemap"
        >
          {isDark ? 'Dark Canvas' : 'Light Canvas'}
        </button>

        <button
          type="button"
          onClick={() => setProvider('leaflet_satellite')}
          className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${
            provider === 'leaflet_satellite'
              ? 'bg-primary text-on-primary font-bold shadow-sm'
              : 'text-on-surface hover:bg-surface-container-high'
          }`}
          title="High resolution Earth satellite imagery"
        >
          Satellite
        </button>

        <button
          type="button"
          onClick={() => setProvider('leaflet_osm')}
          className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${
            provider === 'leaflet_osm'
              ? 'bg-primary text-on-primary font-bold shadow-sm'
              : 'text-on-surface hover:bg-surface-container-high'
          }`}
          title="Standard OpenStreetMap street network"
        >
          Street Map
        </button>

        {googleKey && (
          <>
            <button
              type="button"
              onClick={() => setProvider('google_dark')}
              className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${
                provider === 'google_dark'
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'text-on-surface hover:bg-surface-container-high'
              }`}
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => setProvider('google_satellite')}
              className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${
                provider === 'google_satellite'
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'text-on-surface hover:bg-surface-container-high'
              }`}
            >
              Satellite
            </button>
          </>
        )}

        {googleLoadError && (
          <span className="text-secondary font-mono text-[10px] pl-1" title={googleLoadError}>
            (Active: CartoDB)
          </span>
        )}
      </div>

      {/* Render Google Maps or Leaflet Container */}
      {provider.startsWith('google') && googleKey ? (
        <div
          ref={googleMapRef}
          style={{
            height: '100%',
            width: '100%',
            minHeight: '520px',
            background: isDark ? '#0a0e16' : '#f8fafc',
          }}
        />
      ) : (
        <MapContainer
          center={center}
          zoom={13}
          style={{
            height: '100%',
            width: '100%',
            minHeight: '520px',
            background: isDark ? '#0a0e16' : '#f8fafc',
          }}
          scrollWheelZoom
        >
          {/* Synchronized Viewport & Invalidation Controller */}
          <MapController center={center} isDark={isDark} />

          {/* Dynamic Basemap Layer */}
          {provider === 'leaflet_satellite' ? (
            <TileLayer
              key="esri-satellite"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
              maxZoom={18}
            />
          ) : provider === 'leaflet_osm' ? (
            <TileLayer
              key="osm-tiles"
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={19}
            />
          ) : (
            <TileLayer
              key={isDark ? 'esri-dark' : 'esri-light'}
              url={
                isDark
                  ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
                  : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
              }
              attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ"
              maxZoom={16}
            />
          )}

          {/* Organic Thermal Dispersion Plumes (No rigid rectangular boxes) */}
          {hotspotGeoJSON.features.length > 0 && (
            <GeoJSON
              key={`hs-contour-${isDark ? 'dark' : 'light'}-${hotspots.length}-${JSON.stringify(center)}`}
              data={hotspotGeoJSON}
              style={hotspotContourStyle}
              onEachFeature={(feature, layer) => {
                if (feature.properties) {
                  layer.bindPopup(renderHotspotPopupHTML(feature.properties, isDark));
                  layer.on('click', () => {
                    if (onSelectHotspot) {
                      const matched = hotspots.find((h) => h._id === feature.properties.id);
                      if (matched) onSelectHotspot(matched);
                    }
                  });
                }
              }}
            />
          )}

          {/* Accurate Landmark Pins & Radiant Thermal Halos */}
          {hotspots.map((hs, idx) => {
            const pointCenter = getHotspotCenter(hs);
            const intensity = hs.intensity || 'medium';
            const color = INTENSITY_COLOR[intensity] || '#ffb95f';
            const fill = INTENSITY_FILL[intensity] || '#ee9800';

            return (
              <React.Fragment key={`hotspot-marking-${hs._id || idx}`}>
                {/* 1. Radiant Thermal Halos (Concentric heat dissipation aura) */}
                <CircleMarker
                  center={pointCenter}
                  radius={intensity === 'critical' ? 28 : intensity === 'high' ? 22 : 16}
                  pathOptions={{
                    color: color,
                    fillColor: fill,
                    fillOpacity: intensity === 'critical' ? 0.22 : 0.14,
                    weight: 1.5,
                    dashArray: '4, 6',
                  }}
                  interactive={false}
                />

                {/* 2. Core Pinpoint Landmark Marker */}
                <CircleMarker
                  center={pointCenter}
                  radius={intensity === 'critical' ? 8 : 7}
                  pathOptions={{
                    color: '#ffffff',
                    weight: 2.5,
                    fillColor: fill,
                    fillOpacity: 1,
                  }}
                  eventHandlers={{
                    click: () => {
                      if (onSelectHotspot) onSelectHotspot(hs);
                    },
                  }}
                >
                  {/* Hover Tag with Landmark Name and Temperature */}
                  <Tooltip
                    direction="top"
                    offset={[0, -10]}
                    opacity={0.96}
                    sticky
                    className="custom-thermal-tooltip"
                  >
                    <div className="bg-slate-900/95 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 shadow-xl flex items-center gap-2 pointer-events-none">
                      <span className="text-sm">
                        {intensity === 'critical' ? '🔥' : intensity === 'high' ? '⚠️' : '🌡️'}
                      </span>
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span className="text-amber-400 font-extrabold">
                            {hs.peakTemp ? `${hs.peakTemp}°C` : `${intensity.toUpperCase()}`}
                          </span>
                          <span className="text-slate-500 font-normal">•</span>
                          <span className="text-slate-100 max-w-[160px] truncate">
                            {hs.name || hs.landmark || hs.wardId}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {hs.landmark || `${hs.wardId} Accurate Landmark`}
                        </div>
                      </div>
                    </div>
                  </Tooltip>

                  {/* Detailed Telemetry Click Popup */}
                  <Popup className="thermal-telemetry-popup" maxWidth={300}>
                    <div className="p-1 font-sans">
                      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-outline-variant/30">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant font-bold block">
                            {hs.wardId} • Tamil Nadu Hub
                          </span>
                          <h4 className="font-bold text-on-surface text-sm leading-snug">
                            {hs.name || 'Thermal Ground Core'}
                          </h4>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md text-white ${
                            intensity === 'critical'
                              ? 'bg-red-600'
                              : intensity === 'high'
                              ? 'bg-orange-500'
                              : 'bg-amber-500'
                          }`}
                        >
                          {intensity}
                        </span>
                      </div>

                      {hs.landmark && (
                        <p className="text-xs text-on-surface-variant mb-2.5 flex items-center gap-1.5">
                          <span>📍</span>
                          <span>{hs.landmark}</span>
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 mb-2.5 bg-surface-container/60 p-2 rounded-lg text-xs">
                        <div>
                          <span className="text-[10px] text-on-surface-variant block uppercase font-medium">
                            Peak Surface
                          </span>
                          <span className="font-extrabold text-red-500 text-sm">
                            {hs.peakTemp ? `${hs.peakTemp}°C` : 'Elevated'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-on-surface-variant block uppercase font-medium">
                            Telemetry
                          </span>
                          <span className="font-semibold text-emerald-500 text-xs">
                            ● {hs.status || 'Active'}
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-on-surface-variant flex justify-between">
                        <span>Coord: {pointCenter[0].toFixed(4)}°N, {pointCenter[1].toFixed(4)}°E</span>
                        <span>{new Date(hs.detectedAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            );
          })}

          {/* Green Cover Canopy Layer */}
          {showGreenCover && greenCoverGeoJSON.features.length > 0 && (
            <GeoJSON
              key={`gc-${isDark ? 'dark' : 'light'}-${JSON.stringify(greenCoverGeoJSON)}`}
              data={greenCoverGeoJSON}
              style={greenCoverStyle}
            />
          )}
        </MapContainer>
      )}
    </div>
  );
}

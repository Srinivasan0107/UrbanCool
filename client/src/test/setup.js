import '@testing-library/jest-dom';

// Stub leaflet CSS — jsdom cannot process it and the import causes Vitest to hang.
vi.mock('leaflet/dist/leaflet.css', () => ({}));

// Stub leaflet & react-leaflet — they require real DOM APIs (canvas/SVG)
// that jsdom doesn't provide, so any component importing them would crash.
vi.mock('leaflet', () => ({ default: {} }));
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => children,
  TileLayer: () => null,
  GeoJSON: () => null,
  CircleMarker: ({ children }) => children,
  Popup: ({ children }) => children,
  Tooltip: ({ children }) => children,
  LayersControl: () => null,
  useMap: () => ({
    invalidateSize: () => {},
    flyTo: () => {},
  }),
}));

// Stub ResizeObserver — recharts ResponsiveContainer uses it; jsdom doesn't implement it.
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

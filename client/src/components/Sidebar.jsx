import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ canopyDelta = '-3.4', activeWard = 'Ward-1' }) {
  const location = useLocation();

  const navItems = [
    {
      name: 'GIS Thermal Twin',
      path: '/dashboard',
      icon: 'public',
      color: 'text-primary',
    },
    {
      name: 'Cooling Corridors',
      path: '/cooling',
      icon: 'forest',
      color: 'text-tertiary',
    },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 glass-strong z-40 hidden lg:flex flex-col justify-between py-space-md border-r border-white/8">
      <div className="flex flex-col gap-space-lg px-space-md">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-space-sm pt-2">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-widest font-bold">
            Mission Telemetry
          </span>
          <span className="clay-pill text-tertiary font-mono">
            NODE VERIFIED
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-space-xs">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-space-sm px-space-md py-space-sm rounded-xl transition-all ${
                  isActive
                    ? 'clay-btn-primary text-white font-bold shadow-md'
                    : 'text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface'
                }`}
              >
                <span className={`material-symbols-outlined text-xl ${isActive ? 'text-white' : item.color}`}>
                  {item.icon}
                </span>
                <span className="font-body-sm text-body-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Telemetry Card */}
      <div className="px-space-md pb-2">
        <div className="p-space-md rounded-2xl clay-card flex flex-col gap-space-xs shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps text-secondary font-bold uppercase tracking-wider">
              Canopy Delta
            </span>
            <span className="font-label-mono-stat text-label-mono-stat text-on-surface font-bold">
              {canopyDelta}°C
            </span>
          </div>
          <div className="w-full h-2 rounded-full clay-inset overflow-hidden my-1">
            <div className="h-full bg-primary rounded-full w-3/4 shadow-[0_0_8px_rgba(78,222,163,0.6)]" />
          </div>
          <span className="font-body-sm text-xs text-on-surface-variant truncate">
            Target: {activeWard} Mist Rails & Canopy
          </span>
        </div>
      </div>
    </aside>
  );
}

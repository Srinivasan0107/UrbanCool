import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import ProfileModal from './ProfileModal.jsx';
import NotificationDrawer from './NotificationDrawer.jsx';

export default function Navbar({ alertCount = 3, nodeCount = 60, currentWard = 'Ward-1' }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [utcTime, setUtcTime] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(alertCount);

  useEffect(() => {
    setUnreadAlerts(alertCount);
  }, [alertCount]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toTimeString().split(' ')[0] + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface-container-lowest/80 backdrop-blur-2xl z-40 border-b border-outline-variant/20 shadow-[0_1px_16px_rgba(0,0,0,0.4)]">
        <div className="h-16 w-full px-gutter-desktop flex items-center justify-between gap-space-md">
          {/* Left: Platform Emblem & Live Node Clusters Pill */}
          <div className="flex items-center gap-space-lg">
            <Link to="/" className="flex items-center gap-space-sm group">
              <span className="text-2xl transition-transform group-hover:scale-110">🌿</span>
              <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">
                UrbanCool
              </span>
            </Link>

            <div className="hidden xl:flex items-center gap-space-xs px-space-sm py-space-2xs rounded-full bg-surface-container-high/60 shadow-[inset_0_0_8px_rgba(78,222,163,0.1)]">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-label-caps text-label-caps uppercase tracking-wider text-primary">
                Tamil Nadu Telemetry: Live Sync • {nodeCount} Node Clusters
              </span>
            </div>
          </div>

          {/* Right: Heat Advisory Pill, Notification Bell, UTC Clock, Profile Manager & Logout */}
          <div className="flex items-center gap-space-md">
            {/* Heat Advisory Pill */}
            <div
              onClick={() => setIsNotifOpen(true)}
              className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-error-container/20 border border-error/30 shadow-[0_0_12px_rgba(255,180,171,0.15)] cursor-pointer hover:bg-error-container/30 transition-all"
              title="Click to inspect active heat advisories"
            >
              <span className="w-2 h-2 rounded-full bg-error animate-ping" />
              <span className="font-label-caps text-label-caps uppercase font-bold text-error whitespace-nowrap">
                {unreadAlerts > 0 ? `Tier 3 Heat Advisory (${unreadAlerts})` : 'Nominal Thermal Index'}
              </span>
            </div>

            {/* Notification Bell Icon */}
            <button
              type="button"
              onClick={() => setIsNotifOpen(true)}
              className="relative p-2 rounded-xl bg-surface-container-high/60 hover:bg-surface-container-highest text-on-surface transition-all border border-outline-variant/30 flex items-center justify-center cursor-pointer group shadow-sm"
              title="Mission Alert Center (Notifications)"
            >
              <span className="material-symbols-outlined text-lg text-on-surface group-hover:text-primary transition-colors">
                notifications
              </span>
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-on-error font-mono font-bold text-[10px] flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse">
                  {unreadAlerts}
                </span>
              )}
            </button>

            {/* White / Dark Mode Changer Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-surface-container-high/60 hover:bg-surface-container-highest text-on-surface transition-all border border-outline-variant/30 flex items-center justify-center cursor-pointer group shadow-sm"
              title={isDark ? 'Switch to White / Light Mode' : 'Switch to Cyber Dark Mode'}
              aria-label={isDark ? 'Switch to White Mode' : 'Switch to Dark Mode'}
            >
              <span
                className={`material-symbols-outlined text-lg transition-transform duration-300 ${
                  isDark
                    ? 'text-amber-400 group-hover:rotate-45'
                    : 'text-primary group-hover:-rotate-45'
                }`}
              >
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Clock & Ward Sector */}
            <div className="hidden md:flex flex-col text-right font-label-mono-stat text-label-mono-stat">
              <span className="text-on-surface font-semibold">{utcTime}</span>
              <span className="font-body-sm text-xs text-on-surface-variant truncate max-w-[180px]">
                {user?.ward || currentWard} • Tamil Nadu
              </span>
            </div>

            {/* User Profile Manager Button & Sign Out */}
            {user && (
              <div className="flex items-center gap-space-xs pl-space-xs">
                {/* Profile Manager Trigger */}
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-full bg-surface-container-high/60 hover:bg-surface-container-highest border border-outline-variant/30 transition-all cursor-pointer group shadow-sm"
                  title="Open Profile Manager & Settings"
                >
                  <div className="relative flex items-center justify-center p-0.5 rounded-full bg-surface-container-high ring-1 ring-primary/40">
                    <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase group-hover:scale-105 transition-transform">
                      {user.name ? user.name.charAt(0) : user.role === 'planner' ? 'P' : 'C'}
                    </span>
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-primary ring-2 ring-surface-container-lowest" />
                  </div>

                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-semibold text-on-surface truncate max-w-[120px]">
                      {user.name || 'User Profile'}
                    </span>
                    <span className="text-[10px] font-mono text-tertiary capitalize">
                      {user.role}
                    </span>
                  </div>

                  <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:text-primary transition-colors">
                    tune
                  </span>
                </button>

                {/* Sign Out Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container-high transition-colors ml-1 cursor-pointer"
                  title="Sign out"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile Manager Modal */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      {/* Notification Alerts Drawer */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onAlertCountChange={(cnt) => setUnreadAlerts(cnt)}
      />
    </>
  );
}

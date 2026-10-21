import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

const SEVERITY_STYLES = {
  critical: {
    bg: 'bg-error-container/20 border-error/40',
    text: 'text-error',
    badge: 'bg-error text-on-error font-black',
    dot: 'bg-error',
  },
  high: {
    bg: 'bg-secondary-container/20 border-secondary-container/40',
    text: 'text-secondary',
    badge: 'bg-secondary-container text-on-secondary-container font-bold',
    dot: 'bg-secondary',
  },
  medium: {
    bg: 'bg-secondary/10 border-secondary/30',
    text: 'text-secondary',
    badge: 'bg-secondary/20 text-secondary font-semibold',
    dot: 'bg-secondary',
  },
  low: {
    bg: 'bg-primary/10 border-primary/30',
    text: 'text-primary',
    badge: 'bg-primary/20 text-primary font-semibold',
    dot: 'bg-primary',
  },
};

const TAMIL_NADU_WARDS = ['Ward-1', 'Ward-2', 'Ward-3', 'Ward-4', 'Ward-5'];

export default function NotificationDrawer({ isOpen, onClose, onAlertCountChange }) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    severity: 'critical',
    ward: user?.ward || 'Ward-1',
    recommendedAction: '',
    targetRole: 'all',
  });
  const [broadcasting, setBroadcasting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/alerts');
      const list = res.data.data || [];
      setAlerts(list);
      const unreadCount = list.filter((a) => !a.read).length;
      if (onAlertCountChange) onAlertCountChange(unreadCount);
    } catch {
      // Ignore network errors on polling
    } finally {
      setLoading(false);
    }
  }, [onAlertCountChange]);

  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    }
  }, [isOpen, fetchAlerts]);

  // Request browser desktop notification permission
  const handleRequestDesktopPermission = async () => {
    if (!('Notification' in window)) {
      setFeedback('Desktop notifications are not supported on this browser.');
      setTimeout(() => setFeedback(null), 4000);
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      new Notification('UrbanCool Tamil Nadu Heat Resilience', {
        body: 'Browser push notifications successfully enabled for Tier 3 Heat Alerts.',
        icon: 'https://lh3.googleusercontent.com/aida/AEtjO1WiYUsO4mCkrpnCPCVoWOxkizdzP2FHnCc6_cXnvCBYrlpx8SABFgIeq8jtQLygwBGDYPhgMQBwjELyrF8kA6cW299uN_HWc4f9PNhh9VF4iLUxmPNr61W2GB-gq8i0RJz0AZSRd5a0V_2J37dtL9mCt45qshlM-vyPIa96dNSLA5NJB6qNBjajhxs45DtiaFD62TzS0o7GieIKe4VzO7u5nN0GRy-gDbovyaPgyIt2pM09gYzBbPo-apI',
      });
      setFeedback('Browser notifications active.');
    } else {
      setFeedback('Notification permission dismissed or denied.');
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      await api.patch(`/api/v1/alerts/${alertId}/read`);
      setAlerts((prev) =>
        prev.map((a) => (a._id === alertId ? { ...a, read: true } : a))
      );
      const unread = alerts.filter((a) => a._id !== alertId && !a.read).length;
      if (onAlertCountChange) onAlertCountChange(unread);
    } catch {
      // Failed to update
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/api/v1/alerts/mark-all-read', {});
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
      if (onAlertCountChange) onAlertCountChange(0);
      setFeedback('All alerts marked as read.');
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      // Failed to update
    }
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    setBroadcasting(true);
    try {
      await api.post('/api/v1/alerts', broadcastForm);
      setFeedback('Emergency alert broadcasted successfully to all devices!');
      setIsBroadcastOpen(false);
      setBroadcastForm({
        title: '',
        severity: 'critical',
        ward: user?.ward || 'Ward-1',
        recommendedAction: '',
        targetRole: 'all',
      });
      fetchAlerts();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to broadcast alert.');
    } finally {
      setBroadcasting(false);
    }
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (activeTab === 'critical') return a.severity === 'critical';
      if (activeTab === 'high') return a.severity === 'high';
      if (activeTab === 'unread') return !a.read;
      return true;
    });
  }, [alerts, activeTab]);

  const unreadCount = alerts.filter((a) => !a.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-surface-container-low/95 border-l border-outline-variant/30 h-full shadow-2xl flex flex-col justify-between"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="p-space-md bg-surface-container-lowest border-b border-outline-variant/20 flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-xl animate-pulse">
                crisis_alert
              </span>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Mission Alert Center
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              Live Telemetry Streams • Tamil Nadu
            </span>
            <span className="font-label-mono-stat text-xs px-2 py-0.5 rounded-full bg-error-container/30 text-error font-bold">
              {unreadCount} Unread
            </span>
          </div>

          {feedback && (
            <div className="mt-1 p-2 rounded-lg bg-primary/20 border border-primary/30 text-primary text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">info</span>
              <span>{feedback}</span>
            </div>
          )}

          {/* Quick Actions Row */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/10 text-xs">
            <button
              onClick={handleMarkAllRead}
              className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">done_all</span>
              <span>Mark All Read</span>
            </button>

            <button
              onClick={handleRequestDesktopPermission}
              className="text-tertiary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">notifications</span>
              <span>Enable Browser Push</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-space-md py-2 bg-surface-container-lowest/80 border-b border-outline-variant/10 flex gap-1">
          {[
            { key: 'all', label: 'All', count: alerts.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'critical', label: 'Critical', count: alerts.filter((a) => a.severity === 'critical').length },
            { key: 'high', label: 'High', count: alerts.filter((a) => a.severity === 'high').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                activeTab === tab.key
                  ? 'bg-surface-container-high text-primary border border-primary/30'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>{tab.label}</span>
              <span className="font-mono text-[10px] opacity-75">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Alert List Scroll Area */}
        <div className="flex-1 overflow-y-auto p-space-md space-y-3">
          {loading ? (
            <div className="text-center py-12 text-on-surface-variant text-body-sm">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Checking live telemetry alerts...</span>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2 text-primary">verified_user</span>
              <p className="font-headline-sm text-body-sm font-semibold text-on-surface">No alerts in this category</p>
              <p className="text-xs text-on-surface-variant mt-0.5">All monitored sectors operating within nominal threshold.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const cfg = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium;
              return (
                <div
                  key={alert._id}
                  className={`p-space-sm rounded-xl border transition-all ${cfg.bg} ${
                    !alert.read ? 'ring-1 ring-primary/40 shadow-lg' : 'opacity-85'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot} ${!alert.read ? 'animate-ping' : ''}`} />
                      <span className={`font-label-caps text-label-caps uppercase px-1.5 py-0.5 rounded ${cfg.badge}`}>
                        {alert.severity}
                      </span>
                      <span className="font-label-mono-stat text-xs text-on-surface-variant truncate">
                        {alert.ward}
                      </span>
                    </div>

                    {!alert.read && (
                      <button
                        onClick={() => handleMarkAsRead(alert._id)}
                        className="text-[11px] text-primary hover:underline font-mono flex items-center gap-0.5 cursor-pointer flex-shrink-0"
                      >
                        <span className="material-symbols-outlined text-xs">check</span>
                        <span>Ack</span>
                      </button>
                    )}
                  </div>

                  <h4 className="font-headline-sm text-body-sm font-bold text-on-surface mb-1 leading-snug">
                    {alert.title || `${alert.severity.toUpperCase()} Thermal Advisory`}
                  </h4>

                  <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed mb-2">
                    {alert.recommendedAction}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-outline pt-1 border-t border-outline-variant/10">
                    <span>Target: {alert.targetRole || 'all'}</span>
                    <span>{new Date(alert.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Drawer Actions & Broadcast Button */}
        <div className="p-space-md bg-surface-container-lowest border-t border-outline-variant/20 flex flex-col gap-2">
          {user?.role === 'planner' && (
            <button
              onClick={() => setIsBroadcastOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-error-container text-on-error-container font-headline-sm text-body-sm font-bold hover:bg-error transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">emergency_share</span>
              <span>Broadcast Emergency Heat Advisory</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-1.5 text-center text-xs text-on-surface-variant hover:text-on-surface"
          >
            Close Notification Center
          </button>
        </div>

        {/* Broadcast Modal Overlay */}
        {isBroadcastOpen && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md p-space-md flex flex-col justify-center animate-fade-in">
            <div className="bg-surface-container-low border border-error/50 rounded-2xl p-space-md shadow-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2 text-error">
                  <span className="material-symbols-outlined">campaign</span>
                  <span className="font-headline-sm text-body-sm font-bold text-on-surface">
                    Broadcast Emergency Advisory
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBroadcastOpen(false)}
                  className="text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <form onSubmit={handleBroadcastSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs uppercase font-mono text-on-surface-variant mb-1">
                    Advisory Headline
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastForm.title}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                    placeholder="e.g. CRITICAL: Extreme Asphalt Radiant Surge"
                    className="w-full px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-error"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs uppercase font-mono text-on-surface-variant mb-1">
                      Severity Tier
                    </label>
                    <select
                      value={broadcastForm.severity}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, severity: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface focus:outline-none cursor-pointer"
                    >
                      <option value="critical">Critical (Emergency)</option>
                      <option value="high">High (Thermal Stress)</option>
                      <option value="medium">Medium (Advisory)</option>
                      <option value="low">Low (Precaution)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-mono text-on-surface-variant mb-1">
                      Target Sector
                    </label>
                    <select
                      value={broadcastForm.ward}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, ward: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface focus:outline-none cursor-pointer"
                    >
                      {TAMIL_NADU_WARDS.map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono text-on-surface-variant mb-1">
                    Mandatory Public Directives
                  </label>
                  <textarea
                    rows="3"
                    required
                    value={broadcastForm.recommendedAction}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, recommendedAction: e.target.value })}
                    placeholder="Evaporative misting activated. Free AC shelters open at Central concourse..."
                    className="w-full px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-error"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsBroadcastOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-on-surface-variant hover:text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={broadcasting}
                    className="px-4 py-1.5 rounded-lg bg-error text-on-error font-bold text-xs hover:bg-error-container transition-all shadow-md disabled:opacity-50 flex items-center gap-1"
                  >
                    {broadcasting ? 'Broadcasting...' : 'Transmit Alert'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

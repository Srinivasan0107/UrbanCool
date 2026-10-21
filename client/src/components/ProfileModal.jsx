import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

const TAMIL_NADU_WARDS = [
  { id: 'Ward-1', label: 'Ward-1: Chennai Central (George Town Harbor)' },
  { id: 'Ward-2', label: 'Ward-2: Chennai South-Central (T. Nagar Commercial)' },
  { id: 'Ward-3', label: 'Ward-3: Chennai South (Guindy & Alandur Industrial)' },
  { id: 'Ward-4', label: 'Ward-4: Chennai Cyber Corridor (Sholinganallur OMR)' },
  { id: 'Ward-5', label: 'Ward-5: Western Tamil Nadu (Coimbatore Gandhipuram)' },
];

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateUser, logout } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'planner',
    ward: 'Ward-1',
    phone: '+91 94440 18274',
    department: 'Greater Chennai Corporation (GCC) — Disaster Management & Urban Heat Resilience Cell',
    notificationPreferences: {
      email: true,
      push: true,
      sms: true,
      criticalOnly: false,
    },
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || 'Dr. K. Annamalai',
        email: user.email || 'planner@urbancool.dev',
        role: user.role || 'planner',
        ward: user.ward || 'Ward-1',
        phone: user.phone || '+91 94440 18274',
        department: user.department || 'Greater Chennai Corporation (GCC) — Disaster Management Cell',
        notificationPreferences: user.notificationPreferences || {
          email: true,
          push: true,
          sms: true,
          criticalOnly: false,
        },
      });
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await api.put('/api/v1/users/me', form);
      const updated = res.data.data;
      updateUser({
        name: updated.name,
        role: updated.role,
        ward: updated.ward,
        phone: updated.phone,
        department: updated.department,
        notificationPreferences: updated.notificationPreferences,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePref = (key) => {
    setForm((prev) => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: !prev.notificationPreferences[key],
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className="bg-surface-container-low/95 border border-outline-variant/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Header with Cyber Glow */}
        <div className="relative px-space-lg py-space-md bg-surface-container-lowest/90 border-b border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-lg">
              {form.name ? form.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Profile & Operational Credentials
                </h2>
                <span className="font-label-caps text-label-caps px-space-xs py-0.5 rounded bg-primary/10 text-primary font-mono font-bold border border-primary/20">
                  NODE VERIFIED
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Tamil Nadu Climate Operations Command • Mission Authority
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSave} className="p-space-lg overflow-y-auto space-y-space-md flex-1">
          {saveSuccess && (
            <div className="p-space-sm rounded-xl bg-primary/20 border border-primary/40 text-primary font-body-sm flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-lg">verified</span>
              <span>Profile and alert channels successfully updated in MongoDB Atlas.</span>
            </div>
          )}

          {error && (
            <div className="p-space-sm rounded-xl bg-error-container/30 border border-error/40 text-error font-body-sm flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Role Perspective Switcher */}
          <div className="p-space-sm rounded-xl bg-surface-container-lowest border border-outline-variant/20">
            <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-2">
              Operational Role & Perspective
            </label>
            <div className="grid grid-cols-2 gap-space-sm">
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'planner' })}
                className={`py-2 px-3 rounded-lg font-body-sm font-semibold flex items-center justify-center gap-2 border transition-all ${
                  form.role === 'planner'
                    ? 'bg-primary/20 text-primary border-primary/50 shadow-[0_0_12px_rgba(78,222,163,0.2)]'
                    : 'bg-surface-container-high text-on-surface-variant border-outline-variant/20 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">monitoring</span>
                <span>Urban Heat Planner</span>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'citizen' })}
                className={`py-2 px-3 rounded-lg font-body-sm font-semibold flex items-center justify-center gap-2 border transition-all ${
                  form.role === 'citizen'
                    ? 'bg-secondary/20 text-secondary border-secondary/50 shadow-[0_0_12px_rgba(255,185,95,0.2)]'
                    : 'bg-surface-container-high text-on-surface-variant border-outline-variant/20 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">person</span>
                <span>Citizen Resident</span>
              </button>
            </div>
          </div>

          {/* Name & Email Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
            <div>
              <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-body-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={form.email}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest/60 border border-outline-variant/20 text-on-surface-variant text-body-sm cursor-not-allowed"
              />
            </div>
          </div>

          {/* Jurisdiction / Ward & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
            <div>
              <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">
                Assigned Tamil Nadu Ward Sector
              </label>
              <select
                value={form.ward}
                onChange={(e) => setForm({ ...form, ward: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-body-sm focus:outline-none focus:border-primary cursor-pointer"
              >
                {TAMIL_NADU_WARDS.map((w) => (
                  <option key={w.id} value={w.id} className="bg-surface-container-lowest">
                    {w.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">
                Emergency Mobile / SMS Alerts
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98401 23456"
                className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-body-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Department / Organization */}
          <div>
            <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">
              Affiliated Department / Municipal Agency
            </label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-body-sm focus:outline-none focus:border-primary"
            />
          </div>

          {/* Notification Alert System Preferences */}
          <div className="p-space-md rounded-xl bg-surface-container-lowest/80 border border-outline-variant/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps uppercase text-primary font-bold tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">notifications_active</span>
                Notification Alert Channels
              </span>
              <span className="text-xs text-on-surface-variant font-mono">Real-Time Dispatch</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center justify-between p-2 rounded-lg bg-surface-container-high/40 border border-outline-variant/10 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">cell_tower</span>
                  <span className="font-body-sm text-body-sm text-on-surface">Push Alerts (Tier 3)</span>
                </div>
                <input
                  type="checkbox"
                  checked={form.notificationPreferences.push}
                  onChange={() => handleTogglePref('push')}
                  className="rounded text-primary focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-surface-container-high/40 border border-outline-variant/10 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-base">sms</span>
                  <span className="font-body-sm text-body-sm text-on-surface">SMS Thermal Warnings</span>
                </div>
                <input
                  type="checkbox"
                  checked={form.notificationPreferences.sms}
                  onChange={() => handleTogglePref('sms')}
                  className="rounded text-secondary focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-surface-container-high/40 border border-outline-variant/10 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-base">mail</span>
                  <span className="font-body-sm text-body-sm text-on-surface">Email Thermal Twin Digest</span>
                </div>
                <input
                  type="checkbox"
                  checked={form.notificationPreferences.email}
                  onChange={() => handleTogglePref('email')}
                  className="rounded text-tertiary focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-surface-container-high/40 border border-outline-variant/10 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-base">crisis_alert</span>
                  <span className="font-body-sm text-body-sm text-on-surface">Critical Only Filter</span>
                </div>
                <input
                  type="checkbox"
                  checked={form.notificationPreferences.criticalOnly}
                  onChange={() => handleTogglePref('criticalOnly')}
                  className="rounded text-error focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Telemetry Security Info */}
          <div className="flex items-center justify-between p-2 px-3 rounded-lg bg-surface-container/50 border border-outline-variant/10 text-xs text-on-surface-variant font-mono">
            <span>Auth: Google OAuth 2.0 (Verified)</span>
            <span className="text-primary font-bold">MongoDB Atlas Live Sync</span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-outline-variant/20">
            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
              }}
              className="px-4 py-2 rounded-lg text-body-sm text-error hover:bg-error-container/20 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>Sign Out</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-body-sm text-on-surface-variant hover:text-on-surface"
              >
                Close
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold text-body-sm hover:bg-primary-container transition-all flex items-center gap-1 shadow-md disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

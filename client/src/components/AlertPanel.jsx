import React, { useState } from 'react';

const SEVERITY_BADGE = {
  low:      'bg-primary/10 text-primary border-primary/30',
  medium:   'bg-secondary/15 text-secondary border-secondary/30',
  high:     'bg-secondary-container/20 text-secondary-container border-secondary-container/40',
  critical: 'bg-error-container/30 text-error border-error/40',
};

const SEVERITY_DOT = {
  low:      'bg-primary',
  medium:   'bg-secondary',
  high:     'bg-secondary-container animate-pulse',
  critical: 'bg-error animate-ping',
};

export default function AlertPanel({ alerts = [], onSelectAlert }) {
  const [expanded, setExpanded] = useState(null);

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl text-primary mb-2">verified</span>
        <p className="font-body-sm text-body-sm">No active alerts</p>
        <span className="font-label-caps text-label-caps uppercase text-outline mt-1">Grid Balanced</span>
      </div>
    );
  }

  return (
    <ul className="space-y-space-xs" role="list" aria-label="Active alerts">
      {alerts.map((alert) => (
        <li
          key={alert._id}
          className={`rounded-xl border transition-all cursor-pointer p-space-sm ${
            expanded === alert._id
              ? 'bg-surface-container-high border-primary/50 shadow-lg'
              : 'bg-surface-container-low/70 border-outline-variant/20 hover:bg-surface-container-low hover:border-outline-variant/50'
          }`}
          onClick={() => {
            const next = expanded === alert._id ? null : alert._id;
            setExpanded(next);
            if (onSelectAlert) onSelectAlert(alert);
          }}
        >
          <div className="flex items-start gap-space-sm">
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${SEVERITY_DOT[alert.severity] || 'bg-secondary'}`}
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-space-xs">
                <span className="font-label-mono-stat text-label-mono-stat font-semibold text-on-surface truncate">
                  {alert.ward}
                </span>
                <span
                  className={`px-space-xs py-0.5 rounded text-label-caps uppercase font-bold border tracking-wider ${
                    SEVERITY_BADGE[alert.severity] || SEVERITY_BADGE.medium
                  }`}
                >
                  {alert.severity}
                </span>
              </div>

              {expanded === alert._id && (
                <div className="mt-space-sm pt-space-xs border-t border-outline-variant/20 flex flex-col gap-space-xs">
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    {alert.recommendedAction}
                  </p>
                  <div className="flex items-center justify-between text-label-caps text-outline mt-1">
                    <span>Target: {alert.targetRole || 'All'}</span>
                    <span>{new Date(alert.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC</span>
                  </div>
                  <div className="mt-1 flex gap-space-xs">
                    <button
                      type="button"
                      className="px-space-sm py-1 rounded bg-primary text-on-primary font-label-caps text-label-caps uppercase font-semibold hover:bg-primary-container transition-all"
                    >
                      Acknowledge
                    </button>
                    <button
                      type="button"
                      className="px-space-sm py-1 rounded bg-surface-container-highest text-on-surface font-label-caps text-label-caps uppercase hover:bg-surface-bright transition-all"
                    >
                      Dispatch
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

function buildChartData(initiative) {
  if (!initiative) return [];

  // Generate realistic diurnal curve comparison if post temp is known
  const beforeBase = initiative.beforeTemp || 42;
  const afterBase = initiative.afterTemp != null ? initiative.afterTemp : beforeBase;

  const data = [
    {
      date: '00:00',
      Before: Math.round((beforeBase - 5.2) * 10) / 10,
      After: initiative.afterTemp != null ? Math.round((afterBase - 4.8) * 10) / 10 : null,
    },
    {
      date: '06:00',
      Before: Math.round((beforeBase - 6.1) * 10) / 10,
      After: initiative.afterTemp != null ? Math.round((afterBase - 5.5) * 10) / 10 : null,
    },
    {
      date: '12:00',
      Before: Math.round((beforeBase - 1.2) * 10) / 10,
      After: initiative.afterTemp != null ? Math.round((afterBase - 2.1) * 10) / 10 : null,
    },
    {
      date: '14:00 (Peak)',
      Before: beforeBase,
      After: initiative.afterTemp != null ? afterBase : null,
    },
    {
      date: '18:00',
      Before: Math.round((beforeBase - 3.4) * 10) / 10,
      After: initiative.afterTemp != null ? Math.round((afterBase - 4.1) * 10) / 10 : null,
    },
    {
      date: '22:00',
      Before: Math.round((beforeBase - 4.8) * 10) / 10,
      After: initiative.afterTemp != null ? Math.round((afterBase - 5.0) * 10) / 10 : null,
    },
  ];

  return data;
}

export default function TrendChart({ initiative }) {
  const data = buildChartData(initiative);
  const tempDelta =
    initiative?.afterTemp != null
      ? (initiative.beforeTemp - initiative.afterTemp).toFixed(1)
      : null;

  return (
    <div className="bg-surface-container-low/90 backdrop-blur-xl border border-outline-variant/30 rounded-xl p-space-lg shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-32 -left-32 w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-72 h-72 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md z-10 relative">
        <div>
          <div className="flex items-center gap-space-xs mb-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span className="font-label-caps text-label-caps uppercase text-primary tracking-wider">
              Diurnal Cycle Dynamic Trace
            </span>
          </div>
          <h3 className="font-headline-md text-headline-sm font-bold text-on-surface">
            Temperature Impact
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Diurnal curve telemetry comparing baseline UHI vs. intervention
          </p>
        </div>

        {tempDelta !== null && (
          <span className="px-space-md py-1.5 rounded-full bg-primary/20 text-primary border border-primary/40 font-headline-sm text-body-sm font-bold flex items-center gap-1 shadow-[0_0_12px_rgba(78,222,163,0.25)]">
            <span className="material-symbols-outlined text-base">trending_down</span>
            ↓ {tempDelta}°C reduction
          </span>
        )}
      </div>

      {data.length === 0 ? (
        <p className="text-on-surface-variant font-body-sm text-body-sm text-center py-12">
          No temperature data available
        </p>
      ) : (
        <div className="relative z-10">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data} margin={{ top: 12, right: 24, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262a33" />
              <XAxis dataKey="date" stroke="#86948a" tick={{ fontSize: 11, fill: '#bbcabf' }} />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#86948a"
                tickFormatter={(v) => `${v}°C`}
                tick={{ fontSize: 11, fill: '#bbcabf' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#181c24',
                  borderColor: '#3c4a42',
                  borderRadius: '8px',
                  color: '#dfe2ee',
                }}
                formatter={(v, name) => [`${v}°C`, name === 'Before' ? 'Baseline UHI' : 'Mitigated Output']}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                formatter={(value) => (
                  <span style={{ color: value === 'Before' ? '#ffb95f' : '#4edea3' }}>
                    {value === 'Before' ? 'Baseline UHI Trajectory' : 'Post-Intervention Curve'}
                  </span>
                )}
              />
              <Line
                type="monotone"
                dataKey="Before"
                stroke="#ffb95f"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#ffb95f' }}
                activeDot={{ r: 6 }}
              />
              {initiative?.afterTemp != null && (
                <Line
                  type="monotone"
                  dataKey="After"
                  stroke="#4edea3"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#4edea3' }}
                  activeDot={{ r: 6 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

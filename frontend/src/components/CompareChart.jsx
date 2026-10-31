import { useMemo, useState } from 'react';
import { useChartColors } from '../lib/chartColors';
import { EmptyState } from './States';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from 'recharts';

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildChartData(series) {
  const byTime = new Map();

  for (const s of series) {
    for (const point of s.points) {
      const key = new Date(point.scraped_at).toISOString();
      if (!byTime.has(key)) {
        byTime.set(key, { timeKey: key, time: formatDate(point.scraped_at) });
      }
      byTime.get(key)[s.platform] = point.price;
    }
  }

  return Array.from(byTime.values()).sort(
    (a, b) => new Date(a.timeKey) - new Date(b.timeKey)
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-time">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: ₹{Number(entry.value).toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  );
}

export default function CompareChart({ series, visiblePlatforms }) {
  const colors = useChartColors();
  const PLATFORM_COLORS = { amazon: colors.amazon, flipkart: colors.flipkart };
  const axis = { tick: { fontSize: 11, fill: colors.axis }, tickLine: false, axisLine: false };
  const allPlatforms = useMemo(
    () => [...new Set(series?.map((s) => s.platform) ?? [])],
    [series]
  );
  const [hidden, setHidden] = useState({});

  const hasData = series?.some((s) => s.points?.length > 0);
  if (!hasData) {
    return (
      <EmptyState icon="chart" title="No price history for this group">
        Refresh prices on the dashboard, or widen the date range.
      </EmptyState>
    );
  }

  const data = buildChartData(series);
  const platforms = visiblePlatforms ?? allPlatforms;

  const togglePlatform = (platform) => {
    setHidden((h) => ({ ...h, [platform]: !h[platform] }));
  };

  return (
    <>
      <div className="platform-toggles">
        {platforms.map((platform) => (
          <button
            key={platform}
            type="button"
            className={`platform-chip ${hidden[platform] ? 'off' : 'on'}`}
            style={{ '--chip-color': PLATFORM_COLORS[platform] || colors.accent }}
            onClick={() => togglePlatform(platform)}
          >
            {platform}
          </button>
        ))}
        <span className="muted">Click a store to show or hide it. Drag the handles under the chart to zoom.</span>
      </div>
      <div className="chart-wrap chart-wrap-tall">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid stroke={colors.grid} vertical={false} />
            <XAxis dataKey="time" interval="preserveStartEnd" minTickGap={32} {...axis} />
            <YAxis width={64} tickFormatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} {...axis} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Brush dataKey="time" height={28} stroke={colors.accent} fill="transparent" />
            {platforms.map((platform) =>
              hidden[platform] ? null : (
                <Line
                  key={platform}
                  type="monotone"
                  dataKey={platform}
                  name={platform}
                  stroke={PLATFORM_COLORS[platform] || colors.accent}
                  strokeWidth={2}
                  dot={data.length < 25 ? { r: 2.5 } : false}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              )
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

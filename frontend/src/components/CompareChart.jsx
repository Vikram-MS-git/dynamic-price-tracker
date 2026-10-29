import { useMemo, useState } from 'react';
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

const PLATFORM_COLORS = {
  amazon: '#ff9900',
  flipkart: '#2874f0',
};

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
  const allPlatforms = useMemo(
    () => [...new Set(series?.map((s) => s.platform) ?? [])],
    [series]
  );
  const [hidden, setHidden] = useState({});

  const hasData = series?.some((s) => s.points?.length > 0);
  if (!hasData) {
    return <p>No price history for this group. Run seed:demo or refresh prices.</p>;
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
            style={{ '--chip-color': PLATFORM_COLORS[platform] || '#2563eb' }}
            onClick={() => togglePlatform(platform)}
          >
            {platform}
          </button>
        ))}
        <span className="muted">Click to show/hide lines · drag brush below chart to zoom</span>
      </div>
      <div className="chart-wrap chart-wrap-tall">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Brush dataKey="time" height={28} stroke="#2563eb" />
            {platforms.map((platform) =>
              hidden[platform] ? null : (
                <Line
                  key={platform}
                  type="monotone"
                  dataKey={platform}
                  name={platform}
                  stroke={PLATFORM_COLORS[platform] || '#2563eb'}
                  strokeWidth={2}
                  dot={{ r: 2 }}
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

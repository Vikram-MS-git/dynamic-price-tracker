import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Skeleton } from './States';
import { useChartColors } from '../lib/chartColors';
import { formatINR } from '../lib/format';

function Tip({ active, payload, label, name }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-time">{label}</p>
      <p>
        {name}: <strong>{formatINR(payload[0].value)}</strong>
      </p>
    </div>
  );
}

export default function DashboardCharts({ analytics, loading }) {
  const c = useChartColors();

  if (loading) {
    return (
      <div className="chart-grid">
        <div className="card"><Skeleton style={{ height: 240 }} /></div>
        <div className="card"><Skeleton style={{ height: 240 }} /></div>
      </div>
    );
  }
  if (!analytics) return null;

  const platformData = (analytics.byPlatform ?? []).map((row) => ({
    platform: row.platform.charAt(0).toUpperCase() + row.platform.slice(1),
    key: row.platform,
    avgPrice: Number(row.avg_latest_price) || 0,
    products: row.product_count,
  }));

  const trendData = (analytics.dailyTrend ?? []).map((row) => ({
    day: new Date(row.day).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    avgPrice: Number(row.avg_price) || 0,
  }));

  if (!platformData.length && !trendData.length) return null;

  const axis = { tick: { fontSize: 11, fill: c.axis }, tickLine: false, axisLine: false };

  return (
    <div className="chart-grid">
      <div className="card chart-card">
        <div className="card-head">
          <div>
            <h3>Market trend</h3>
            <p className="muted">Average recorded price across products, last 14 days</p>
          </div>
        </div>
        {trendData.length ? (
          <div className="chart-wrap chart-wrap-sm">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c.accent} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={c.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={c.grid} vertical={false} />
                <XAxis dataKey="day" interval="preserveStartEnd" {...axis} />
                <YAxis width={56} tickFormatter={(v) => formatINR(v, { compact: true })} {...axis} />
                <Tooltip content={<Tip name="Avg price" />} cursor={{ stroke: c.grid }} />
                <Area type="monotone" dataKey="avgPrice" stroke={c.accent} strokeWidth={2} fill="url(#trendFill)" activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="muted chart-empty">Not enough history in the last 14 days yet.</p>
        )}
        <p className="muted chart-footnote">
          {analytics.totalPricePoints?.toLocaleString('en-IN') ?? 0} price observations recorded
        </p>
      </div>

      <div className="card chart-card">
        <div className="card-head">
          <div>
            <h3>Average price by store</h3>
            <p className="muted">Latest price per product, averaged</p>
          </div>
        </div>
        {platformData.length ? (
          <div className="chart-wrap chart-wrap-sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={c.grid} vertical={false} />
                <XAxis dataKey="platform" {...axis} />
                <YAxis width={56} tickFormatter={(v) => formatINR(v, { compact: true })} {...axis} />
                <Tooltip content={<Tip name="Avg" />} cursor={{ fill: c.grid, opacity: 0.4 }} />
                <Bar dataKey="avgPrice" fill={c.accent} radius={[6, 6, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="muted chart-empty">No store data yet.</p>
        )}
      </div>
    </div>
  );
}

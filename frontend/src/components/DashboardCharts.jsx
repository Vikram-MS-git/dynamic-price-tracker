import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const PLATFORM_COLORS = {
  amazon: '#ff9900',
  flipkart: '#2874f0',
};

export default function DashboardCharts({ analytics, loading }) {
  if (loading) return <p className="loading-pulse">Loading charts…</p>;
  if (!analytics) return null;

  const platformData = (analytics.byPlatform ?? []).map((row) => ({
    platform: row.platform,
    avgPrice: Number(row.avg_latest_price) || 0,
    products: row.product_count,
    fill: PLATFORM_COLORS[row.platform] || '#2563eb',
  }));

  const trendData = (analytics.dailyTrend ?? []).map((row) => ({
    day: new Date(row.day).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    avgPrice: Number(row.avg_price) || 0,
    samples: row.samples,
  }));

  if (!platformData.length && !trendData.length) {
    return (
      <p className="muted">Add products and price history to see dashboard charts.</p>
    );
  }

  return (
    <div className="dashboard-charts">
      {platformData.length > 0 && (
        <div className="card chart-card">
          <h3>Average latest price by platform</h3>
          <div className="chart-wrap chart-wrap-sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Avg']} />
                <Bar dataKey="avgPrice" name="Avg price" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {trendData.length > 0 && (
        <div className="card chart-card">
          <h3>Market trend (14 days)</h3>
          <div className="chart-wrap chart-wrap-sm">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Avg']} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgPrice"
                  name="Avg across products"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <p className="muted chart-footnote">
        Total price observations in DB: {analytics.totalPricePoints?.toLocaleString('en-IN') ?? 0}
      </p>
    </div>
  );
}

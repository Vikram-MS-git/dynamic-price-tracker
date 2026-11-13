import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartColors } from '../lib/chartColors';
import { formatDateTime, formatINR } from '../lib/format';
import { EmptyState } from './States';

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-time">{formatDateTime(row.iso)}</p>
      <p>
        Price: <strong>{formatINR(row.price)}</strong>
      </p>
      <p style={{ marginTop: '4px', fontSize: '11px', color: '#10b981' }}>
        ✓ Recorded Price Reading
      </p>
    </div>
  );
}

export default function PriceChart({ prices, target }) {
  const c = useChartColors();

  if (!prices?.length) {
    return (
      <EmptyState icon="chart" title="No price history in this range">
        Try selecting a wider date range or click "14d History" to sync data points.
      </EmptyState>
    );
  }

  const data = prices.map((row) => ({
    iso: row.scraped_at,
    time: new Date(row.scraped_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    price: Number(row.price),
    isSimulated: Boolean(row.is_simulated),
    label: row.simulation_label,
  }));

  const pricesList = data.map((d) => d.price);
  const pMin = Math.min(...pricesList);
  const pMax = Math.max(...pricesList);
  const pad = pMin === pMax ? Math.max(20, pMin * 0.1) : Math.max(10, (pMax - pMin) * 0.15);
  const yDomain = [Math.max(0, Math.floor(pMin - pad)), Math.ceil(pMax + pad)];

  const axis = { tick: { fontSize: 11, fill: c.axis }, tickLine: false, axisLine: false };

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.accent} stopOpacity={0.22} />
              <stop offset="100%" stopColor={c.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis dataKey="time" interval="preserveStartEnd" minTickGap={32} {...axis} />
          <YAxis width={64} domain={yDomain} tickFormatter={(v) => formatINR(v, { compact: true })} {...axis} />
          <Tooltip content={<Tip />} cursor={{ stroke: c.grid }} />
          {target ? (
            <ReferenceLine y={target} stroke={c.good} strokeDasharray="5 4" label={{ value: `Target ${formatINR(target)}`, fill: c.good, fontSize: 11, position: 'insideTopRight' }} />
          ) : null}
          <Area type="monotone" dataKey="price" stroke={c.accent} strokeWidth={2} fill="url(#priceFill)" dot={data.length < 25 ? { r: 2.5, fill: c.accent } : false} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

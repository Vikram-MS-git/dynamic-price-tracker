import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartColors } from '../lib/chartColors';
import { formatDateTime, formatINR } from '../lib/format';
import { EmptyState } from './States';
import Icon from './Icon';

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  if (row.isPredicted) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-time">{row.displayDate}</p>
        <p>
          AI Projected Price: <strong>{formatINR(row.predictedPrice)}</strong>
        </p>
        {row.lowerBound != null && row.upperBound != null && (
          <p className="text-xs muted" style={{ marginTop: '2px' }}>
            95% Confidence Corridor: {formatINR(row.lowerBound)} – {formatINR(row.upperBound)}
          </p>
        )}
        <div className="row gap-xs items-center" style={{ marginTop: '6px' }}>
          <span className="badge badge-accent text-xs">
            <Icon name="sparkle" size={10} /> AI Forecast Horizon ({row.confidence}% Confidence)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-time">{formatDateTime(row.iso)}</p>
      <p>
        Price: <strong>{formatINR(row.price)}</strong>
      </p>
      <p style={{ marginTop: '4px', fontSize: '11px', color: '#10b981' }}>
        ✓ Recorded Store Price
      </p>
    </div>
  );
}

export default function PriceChart({ prices, target, forecast = [], showForecast = false }) {
  const c = useChartColors();

  if (!prices?.length) {
    return (
      <EmptyState icon="chart" title="No price history in this range">
        Try selecting a wider date range or click "14d History" to sync data points.
      </EmptyState>
    );
  }

  const historyData = prices.map((row) => ({
    iso: row.scraped_at,
    time: new Date(row.scraped_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    price: Number(row.price),
    isPredicted: false,
  }));

  let chartData = historyData;
  let allPrices = historyData.map((d) => d.price);

  if (showForecast && forecast.length > 0) {
    const lastHist = historyData[historyData.length - 1];

    // Bridge point: connects historical curve seamlessly to the forecast curve
    const bridgePoint = {
      ...lastHist,
      predictedPrice: lastHist.price,
      isBridge: true,
    };

    const futureData = forecast.map((f) => ({
      time: f.shortDate || f.displayDate,
      displayDate: f.displayDate,
      predictedPrice: f.predictedPrice,
      lowerBound: f.lowerBound,
      upperBound: f.upperBound,
      confidence: f.confidence,
      isPredicted: true,
    }));

    chartData = [...historyData.slice(0, -1), bridgePoint, ...futureData];
    allPrices = [
      ...historyData.map((d) => d.price),
      ...forecast.map((f) => f.predictedPrice),
      ...forecast.map((f) => f.upperBound),
      ...forecast.map((f) => f.lowerBound),
    ].filter(Number.isFinite);
  }

  const pMin = Math.min(...allPrices);
  const pMax = Math.max(...allPrices);
  const pad = pMin === pMax ? Math.max(20, pMin * 0.1) : Math.max(10, (pMax - pMin) * 0.15);
  const yDomain = [Math.max(0, Math.floor(pMin - pad)), Math.ceil(pMax + pad)];

  const axis = { tick: { fontSize: 11, fill: c.axis }, tickLine: false, axisLine: false };
  const lastHistoryPoint = historyData[historyData.length - 1];

  return (
    <div className="chart-container-wrap">
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.accent} stopOpacity={0.22} />
                <stop offset="100%" stopColor={c.accent} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={c.grid} vertical={false} />
            <XAxis dataKey="time" interval="preserveStartEnd" minTickGap={28} {...axis} />
            <YAxis width={64} domain={yDomain} tickFormatter={(v) => formatINR(v, { compact: true })} {...axis} />
            <Tooltip content={<Tip />} cursor={{ stroke: c.grid }} />

            {/* Target price reference line */}
            {target ? (
              <ReferenceLine
                y={target}
                stroke={c.good}
                strokeDasharray="5 4"
                label={{ value: `Target ${formatINR(target)}`, fill: c.good, fontSize: 11, position: 'insideTopRight' }}
              />
            ) : null}

            {/* Vertical separator dividing historical readings from forward forecast */}
            {showForecast && lastHistoryPoint && (
              <ReferenceLine
                x={lastHistoryPoint.time}
                stroke="var(--border-strong)"
                strokeDasharray="3 3"
                label={{ value: 'Projected ➔', fill: 'var(--text-3)', fontSize: 10, position: 'insideTopLeft' }}
              />
            )}

            {/* Historical Recorded Price */}
            <Area
              type="monotone"
              dataKey="price"
              stroke={c.accent}
              strokeWidth={2}
              fill="url(#priceFill)"
              dot={historyData.length < 25 ? { r: 2.5, fill: c.accent } : false}
              activeDot={{ r: 5 }}
            />

            {/* 7-Day AI Predicted Forecast Line */}
            {showForecast && (
              <Area
                type="monotone"
                dataKey="predictedPrice"
                stroke="#10b981"
                strokeWidth={2.2}
                strokeDasharray="5 4"
                fill="url(#forecastFill)"
                dot={{ r: 3.5, fill: '#10b981', stroke: '#fff', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#10b981' }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {showForecast && (
        <div className="forecast-legend-bar">
          <div className="forecast-legend-item">
            <span className="legend-dot legend-recorded" />
            <span className="text-xs">Recorded Store Price</span>
          </div>
          <div className="forecast-legend-item">
            <span className="legend-dash legend-projected" />
            <span className="text-xs">7-Day AI Projected Forecast</span>
          </div>
          <div className="forecast-legend-item">
            <span className="legend-band" />
            <span className="text-xs">95% Confidence Corridor</span>
          </div>
        </div>
      )}
    </div>
  );
}

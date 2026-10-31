import { formatINR } from '../lib/format';
import PlatformBadge from './PlatformBadge';

export default function CompareInsights({ stats }) {
  if (!stats?.length) return null;

  const valid = stats.filter((s) => s.avg != null && s.count > 0);
  if (valid.length < 2) {
    return (
      <p className="notice">
        Add the same product on another store (using the same group name) to compare prices.
      </p>
    );
  }

  const sorted = [...valid].sort((a, b) => a.avg - b.avg);
  const cheapest = sorted[0];
  const priciest = sorted[sorted.length - 1];
  const diff = priciest.avg - cheapest.avg;
  const pct = cheapest.avg ? Math.round((diff / cheapest.avg) * 1000) / 10 : 0;
  const mostVolatile = [...valid].sort((a, b) => (b.stdDev ?? 0) - (a.stdDev ?? 0))[0];

  return (
    <div className="kpi-grid two">
      <div className="kpi">
        <span className="kpi-label">Lower average price</span>
        <div className="kpi-value small"><PlatformBadge platform={cheapest.platform} /> {formatINR(cheapest.avg)}</div>
        <div className="kpi-sub">{formatINR(diff)} ({pct}%) less than {priciest.platform} at {formatINR(priciest.avg)}</div>
      </div>
      <div className="kpi">
        <span className="kpi-label">More volatile</span>
        <div className="kpi-value small"><PlatformBadge platform={mostVolatile.platform} /> σ {mostVolatile.stdDev ?? '—'}</div>
        <div className="kpi-sub">Higher standard deviation means larger price swings in this period</div>
      </div>
    </div>
  );
}

function formatPrice(v) {
  return `₹${Number(v).toLocaleString('en-IN')}`;
}

export default function CompareInsights({ stats }) {
  if (!stats?.length) return null;

  const valid = stats.filter((s) => s.avg != null && s.count > 0);
  if (valid.length < 2) {
    return (
      <p className="insight-banner muted">
        Add the same product on another platform (same Group name) to compare.
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
    <div className="insight-row">
      <div className="insight-card insight-save">
        <strong>Lower average price</strong>
        <p>
          <span className="badge">{cheapest.platform}</span> at {formatPrice(cheapest.avg)}
        </p>
        <p className="muted">
          vs {priciest.platform} ({formatPrice(priciest.avg)}) — about {pct}% difference
        </p>
      </div>
      <div className="insight-card">
        <strong>More volatile (RQ1)</strong>
        <p>
          <span className="badge">{mostVolatile.platform}</span> — std dev{' '}
          {mostVolatile.stdDev ?? '—'}
        </p>
        <p className="muted">Higher std dev = larger price swings in this period</p>
      </div>
    </div>
  );
}

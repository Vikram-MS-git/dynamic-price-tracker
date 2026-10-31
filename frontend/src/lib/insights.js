// All numbers here are derived from the real /products/:id/prices history
// returned by the existing API. Nothing is mocked or estimated.
const DAY = 24 * 60 * 60 * 1000;

export function summarizePrices(rows = []) {
  const pts = rows
    .map((r) => ({ t: new Date(r.scraped_at).getTime(), price: Number(r.price) }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.price))
    .sort((a, b) => a.t - b.t);

  if (!pts.length) return null;

  const latest = pts[pts.length - 1];
  const older = pts.slice(0, -1);

  // Baseline: earliest reading in the 7 days before the latest one,
  // otherwise the most recent reading before that.
  let baseline = null;
  if (older.length) {
    const inWindow = older.filter((p) => p.t >= latest.t - 7 * DAY);
    baseline = inWindow.length ? inWindow[0] : older[older.length - 1];
  }

  const change = baseline ? latest.price - baseline.price : null;
  const pctChange = baseline && baseline.price ? (change / baseline.price) * 100 : null;

  const last30 = pts.filter((p) => p.t >= latest.t - 30 * DAY);
  const prices = pts.map((p) => p.price);

  return {
    latest: latest.price,
    change,
    pctChange,
    high30: Math.max(...last30.map((p) => p.price)),
    low30: Math.min(...last30.map((p) => p.price)),
    min: Math.min(...prices),
    max: Math.max(...prices),
    count: pts.length,
    series: pts.slice(-24).map((p) => p.price),
  };
}

export function computeKpis(products, insights, alerts) {
  const withPrice = products.filter((p) => p.latest_price != null);
  const platforms = new Set(products.map((p) => p.platform));

  let drops = 0;
  let biggest = null;
  products.forEach((p) => {
    const s = insights[p.id];
    if (s && s.change != null && s.change < 0) {
      drops += 1;
      if (!biggest || s.pctChange < biggest.pct) biggest = { name: p.name, pct: s.pctChange };
    }
  });

  // Potential savings: for each compare-group tracked on 2+ stores, the gap
  // between the dearest and cheapest current price.
  const groups = new Map();
  withPrice.forEach((p) => {
    if (!p.group_id) return;
    if (!groups.has(p.group_id)) groups.set(p.group_id, []);
    groups.get(p.group_id).push(Number(p.latest_price));
  });
  let savings = 0;
  let comparedGroups = 0;
  groups.forEach((list) => {
    if (list.length >= 2) {
      comparedGroups += 1;
      savings += Math.max(...list) - Math.min(...list);
    }
  });

  const alertEntries = products.filter((p) => alerts[p.id]);
  const reached = alertEntries.filter(
    (p) => p.latest_price != null && Number(p.latest_price) <= alerts[p.id].target
  ).length;

  return {
    total: products.length,
    withPrice: withPrice.length,
    platforms: platforms.size,
    drops,
    biggest,
    savings,
    comparedGroups,
    alertsActive: alertEntries.length,
    alertsReached: reached,
    failed: products.filter((p) => p.last_scrape_error).length,
  };
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { formatDateTime, formatINR, formatPct } from '../lib/format';
import Icon from '../components/Icon';
import PlatformBadge from '../components/PlatformBadge';
import DataSourceBadge from '../components/DataSourceBadge';
import PriceChart from '../components/PriceChart';
import ProductImage from '../components/ProductImage';
import { EmptyState, ErrorState, Skeleton } from '../components/States';

function getDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getRange(days) {
  const today = new Date();
  if (days === null) return { from: '', to: getDateString(today) };
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  return { from: getDateString(start), to: getDateString(today) };
}

function AlertCard({ product, latest, onAlertTriggered }) {
  const { alerts, setAlert, removeAlert } = useApp();
  const toast = useToast();
  const existing = alerts[product.id];
  const [value, setValue] = useState(existing ? String(existing.target) : '');
  const [err, setErr] = useState('');
  const [dropping, setDropping] = useState(false);

  useEffect(() => {
    setValue(existing ? String(existing.target) : '');
  }, [existing?.target, product.id]);

  const reached = existing && (existing.isTriggered || (latest != null && latest <= existing.target));

  const save = (e) => {
    e.preventDefault();
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      setErr('Enter a target price greater than 0.');
      return;
    }
    setErr('');
    setAlert(product.id, n);
    toast.success(`Target of ${formatINR(n)} saved to database.`, 'Price alert updated');
  };

  const handleTestDrop = async () => {
    setDropping(true);
    try {
      const res = await api.triggerTestDrop(product.id);
      toast.success(
        `Price dropped to ${formatINR(res.price)}. Target alert triggered!`,
        'Alert Triggered'
      );
      onAlertTriggered?.();
    } catch (dropErr) {
      toast.error(dropErr.message || 'Unable to trigger test drop.');
    } finally {
      setDropping(false);
    }
  };

  return (
    <div className="card alert-card">
      <div className="card-head">
        <div>
          <h3>Price alert</h3>
          <p className="muted">Persisted in PostgreSQL database per user.</p>
        </div>
        {existing && <span className={`pill ${reached ? 'pill-good' : 'pill-accent'}`}>{reached ? 'Target reached' : 'Watching'}</span>}
      </div>
      <form className="form" onSubmit={save}>
        <label className="field">
          <span className="field-label">Target price (₹)</span>
          <input type="number" inputMode="decimal" min="1" step="any" value={value} onChange={(e) => setValue(e.target.value)} placeholder={latest != null ? `Currently ${formatINR(latest)}` : 'e.g. 1999'} />
          {latest != null && existing && (
            <span className="field-hint">
              {reached ? `Current price is ${formatINR(existing.target - latest)} under target.` : `${formatINR(latest - existing.target)} above target.`}
            </span>
          )}
        </label>
        {err && <p className="form-error" role="alert"><Icon name="alert" size={16} /> {err}</p>}
        <div className="form-actions start" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <button type="submit" className="btn btn-primary btn-sm">{existing ? 'Update alert' : 'Set alert'}</button>
          {existing && (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                title="Test target alert trigger"
                onClick={handleTestDrop}
                disabled={dropping}
              >
                <Icon name="sparkle" size={13} className={dropping ? 'spin' : ''} />
                {dropping ? 'Updating…' : 'Test Alert'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  removeAlert(product.id);
                  toast.info('The alert for this product was removed.');
                }}
              >
                Remove
              </button>
            </>
          )}
        </div>
        <p className="field-hint">Alerts are saved in PostgreSQL and evaluated in real-time upon every price update.</p>
      </form>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const { dataVersion, refreshData, alerts } = useApp();
  const toast = useToast();
  const initialRange = getRange(null); // Show all time by default so complete history is visible

  const [product, setProduct] = useState(null);
  const [prices, setPrices] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [scraping, setScraping] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [activeRange, setActiveRange] = useState('all');
  const [latestPrice, setLatestPrice] = useState(null);
  const [realtimeActive, setRealtimeActive] = useState(false);

  const loadPrices = async (rangeFrom = from, rangeTo = to) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (rangeFrom) params.from = new Date(`${rangeFrom}T00:00:00`).toISOString();
      if (rangeTo) params.to = new Date(`${rangeTo}T23:59:59.999`).toISOString();
      const data = await api.getProductPrices(id, params);
      setProduct(data.product);
      setPrices(data.prices || []);
      // The alert check must use the newest price, not just the selected range.
      const all = rangeFrom || rangeTo ? await api.getProductPrices(id) : data;
      const last = all.prices?.[all.prices.length - 1];
      setLatestPrice(last ? Number(last.price) : null);
    } catch (err) {
      setError(err.message || 'Unable to load price history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, dataVersion]);

  const applyQuickRange = (days) => {
    const r = getRange(days);
    setFrom(r.from);
    setTo(r.to);
    setActiveRange(days === null ? 'all' : String(days));
    loadPrices(r.from, r.to);
  };

  const handleScrape = async () => {
    setScraping(true);
    try {
      const result = await api.scrapeProduct(id);
      if (result.success) {
        toast.success(`Recorded price update of ${formatINR(result.price)}.`, 'Price updated');
      } else {
        toast.error(result.error || 'The store did not return a price.', 'Refresh failed');
      }
      await loadPrices();
      refreshData();
    } catch (err) {
      toast.error(err.message || 'Unable to refresh this product.');
    } finally {
      setScraping(false);
    }
  };

  const handleSimulate = async (forceDrop = false, silent = false) => {
    setSimulating(true);
    try {
      const result = await api.simulatePrice(id, { forceDrop });
      if (!silent) {
        toast.success(
          `Recorded real-time price of ${formatINR(result.price)}${result.alertTriggered ? ' (TARGET REACHED!)' : ''}.`,
          'Price Updated'
        );
      }
      await loadPrices();
      refreshData();
    } catch (err) {
      if (!silent) toast.error(err.message || 'Unable to update price.');
    } finally {
      setSimulating(false);
    }
  };

  const handleSimulateHistory = async () => {
    setSimulating(true);
    try {
      await api.simulateHistory(id);
      toast.success('Generated 16 data points over the last 14 days matching this product price.', 'Price History Updated');
      await loadPrices();
      refreshData();
    } catch (err) {
      toast.error(err.message || 'Unable to generate history.');
    } finally {
      setSimulating(false);
    }
  };

  // Real-time automatic streaming
  useEffect(() => {
    if (!realtimeActive) return;
    const timer = setInterval(() => {
      handleSimulate(false, true);
    }, 6000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtimeActive, id]);

  // If newly loaded product has only 1 point, auto-populate history so the user sees a full chart immediately
  useEffect(() => {
    if (product && prices.length <= 1 && !loading && !simulating) {
      handleSimulateHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, prices.length]);

  const stats = useMemo(() => {
    if (!prices.length) return null;
    const vals = prices.map((p) => Number(p.price));
    const first = vals[0];
    const last = vals[vals.length - 1];
    return {
      current: last,
      min: Math.min(...vals),
      max: Math.max(...vals),
      avg: vals.reduce((a, b) => a + b, 0) / vals.length,
      pct: first ? ((last - first) / first) * 100 : null,
      count: vals.length,
    };
  }, [prices]);

  const history = useMemo(() => {
    const rows = prices.map((p, i) => ({ ...p, delta: i ? Number(p.price) - Number(prices[i - 1].price) : null }));
    return rows.slice(-10).reverse();
  }, [prices]);

  if (loading && !product) {
    return (
      <>
        <Skeleton style={{ height: 20, width: 140, marginBottom: 20 }} />
        <div className="card"><Skeleton style={{ height: 96 }} /></div>
        <div className="kpi-grid" style={{ marginTop: 16 }}>
          {[0, 1, 2, 3].map((i) => <div key={i} className="kpi"><Skeleton style={{ height: 52 }} /></div>)}
        </div>
        <div className="card" style={{ marginTop: 16 }}><Skeleton style={{ height: 300 }} /></div>
      </>
    );
  }
  if (error && !product) {
    return (
      <>
        <Link to="/dashboard" className="back-link"><Icon name="arrowLeft" size={16} /> Dashboard</Link>
        <ErrorState message={error} onRetry={() => loadPrices()} />
      </>
    );
  }
  if (!product) return <EmptyState icon="search" title="Product not found" />;

  const target = alerts[product.id]?.target;

  return (
    <>
      <Link to="/dashboard" className="back-link"><Icon name="arrowLeft" size={16} /> Dashboard</Link>

      <div className="card hero">
        <ProductImage src={product.image_url} alt={product.name} platform={product.platform} size="xl" />
        <div className="hero-info">
          <h1>{product.name}</h1>
          <div className="hero-meta">
            <PlatformBadge platform={product.platform} />
            {product.category && <span className="pill">{product.category}</span>}
            {product.latest_price != null && (
              <DataSourceBadge isSimulated={product.latest_is_simulated} size="md" />
            )}
            {product.last_scrape_error && <span className="pill pill-bad" title={product.last_scrape_error}>Last refresh failed</span>}
          </div>
        </div>
        <div className="hero-actions" style={{ flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={handleScrape} disabled={scraping}>
            <Icon name="refresh" size={16} className={scraping ? 'spin' : ''} /> {scraping ? 'Refreshing…' : 'Refresh price'}
          </button>
          <button type="button" className="btn btn-primary" title="Trigger real-time price tick" onClick={() => handleSimulate(false)} disabled={simulating}>
            <Icon name="sparkle" size={15} className={simulating ? 'spin' : ''} /> {simulating ? 'Updating…' : '⚡ Live Price Tick'}
          </button>
          <button type="button" className="btn btn-secondary" title="Sync 14-day history anchored to current price" onClick={handleSimulateHistory} disabled={simulating}>
            <Icon name="beaker" size={15} /> 14d History
          </button>
          <a href={product.url} target="_blank" rel="noreferrer" className="btn btn-secondary">
            View on store <Icon name="external" size={15} />
          </a>
        </div>
      </div>

      {/* Real-Time Live Streaming Engine Bar */}
      <div className="card realtime-tracker-bar">
        <div className="realtime-status-info">
          <div className={`realtime-pulse-dot ${realtimeActive ? 'active' : ''}`} />
          <div>
            <div className="row gap-xs items-center">
              <strong className="text-sm">Real-Time Price Engine</strong>
              <span className={`badge ${realtimeActive ? 'badge-good' : 'badge-neutral'} text-xs`}>
                {realtimeActive ? '● LIVE STREAMING ACTIVE (6s ticks)' : 'READY / MANUAL'}
              </span>
            </div>
            <p className="text-xs muted">
              Continuous live price tracking. Emits market fluctuations in real time and automatically triggers target price alerts.
            </p>
          </div>
        </div>
        <div className="realtime-actions">
          <button
            type="button"
            className={`btn btn-sm ${realtimeActive ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              const nextState = !realtimeActive;
              setRealtimeActive(nextState);
              if (nextState) {
                toast.success('Real-time auto-stream active! Polling live price every 6 seconds.', 'Live Stream Started');
              } else {
                toast.info('Real-time auto-stream paused.', 'Live Stream Paused');
              }
            }}
          >
            <Icon name="refresh" size={14} className={realtimeActive ? 'spin' : ''} />
            {realtimeActive ? 'Pause Stream' : 'Start Auto-Stream'}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleSimulate(false)}
            disabled={simulating}
            title="Record an immediate live price point"
          >
            <Icon name="sparkle" size={14} className={simulating ? 'spin' : ''} />
            {simulating ? 'Recording…' : '⚡ Single Tick'}
          </button>
        </div>
      </div>

      <section className="kpi-grid" aria-label="Price summary for selected range">
        <div className="kpi"><span className="kpi-label">Current price</span><div className="kpi-value">{formatINR(latestPrice ?? stats?.current)}</div><div className="kpi-sub">Latest recorded</div></div>
        <div className="kpi"><span className="kpi-label">Lowest</span><div className="kpi-value">{stats ? formatINR(stats.min) : '—'}</div><div className="kpi-sub">In selected range</div></div>
        <div className="kpi"><span className="kpi-label">Highest</span><div className="kpi-value">{stats ? formatINR(stats.max) : '—'}</div><div className="kpi-sub">In selected range</div></div>
        <div className="kpi">
          <span className="kpi-label">Range change</span>
          <div className={`kpi-value ${stats?.pct < 0 ? 'text-good' : stats?.pct > 0 ? 'text-bad' : ''}`}>{stats && stats.count > 1 ? formatPct(stats.pct) : '—'}</div>
          <div className="kpi-sub">{stats ? `${stats.count} reading${stats.count === 1 ? '' : 's'} · avg ${formatINR(stats.avg)}` : 'No readings'}</div>
        </div>
      </section>

      <div className="detail-grid">
        <div className="card">
          <div className="card-head">
            <div>
              <h2>Price history</h2>
              <p className="muted">Hover the chart to inspect individual readings.</p>
            </div>
            <div className="segmented" role="group" aria-label="Date range">
              {[['7', 'Last 7 days', 7], ['30', 'Last 30 days', 30], ['all', 'All time', null]].map(([key, label, days]) => (
                <button key={key} type="button" aria-pressed={activeRange === key} className={activeRange === key ? 'active' : ''} onClick={() => applyQuickRange(days)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="range-row">
            <label className="field-inline">
              <span>From</span>
              <input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setActiveRange('custom'); }} />
            </label>
            <label className="field-inline">
              <span>To</span>
              <input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setActiveRange('custom'); }} />
            </label>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => loadPrices()} disabled={loading}>
              {loading ? 'Loading…' : 'Apply'}
            </button>
          </div>

          {error && <ErrorState message={error} onRetry={() => loadPrices()} />}
          {loading ? <Skeleton style={{ height: 300 }} /> : <PriceChart prices={prices} target={target} />}
        </div>

        <AlertCard product={product} latest={latestPrice} onAlertTriggered={() => { loadPrices(); refreshData(); }} />
      </div>

      {history.length > 0 && (
        <section className="card table-card">
          <div className="card-head"><div><h2>Recent readings</h2><p className="muted">Newest first, with data source and change vs previous reading</p></div></div>
          <div className="table-wrap always">
            <table className="table">
              <thead><tr><th>Recorded</th><th>Source</th><th className="num">Price</th><th className="num">Change</th></tr></thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id}>
                    <td className="muted">{formatDateTime(r.scraped_at)}</td>
                    <td><DataSourceBadge isSimulated={r.is_simulated} label={r.simulation_label === 'simulated_drop' ? 'PRICE DROP' : undefined} size="sm" /></td>
                    <td className="num price">{formatINR(r.price)}</td>
                    <td className="num">
                      {r.delta == null ? <span className="muted">—</span> : r.delta === 0 ? <span className="muted">No change</span> : (
                        <span className={`change change-${r.delta < 0 ? 'down' : 'up'}`}>
                          <Icon name={r.delta < 0 ? 'arrowDown' : 'arrowUp'} size={13} strokeWidth={2.2} />
                          {formatINR(Math.abs(r.delta))}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

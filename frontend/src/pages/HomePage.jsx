import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { usePriceInsights } from '../hooks/usePriceInsights';
import { computeKpis } from '../lib/insights';
import { timeAgo } from '../lib/format';
import DashboardStats from '../components/DashboardStats';
import DashboardCharts from '../components/DashboardCharts';
import ProductList from '../components/ProductList';
import HowToRealProducts from '../components/HowToRealProducts';
import Icon from '../components/Icon';
import { ErrorState } from '../components/States';

const SORTS = [
  { id: 'recent', label: 'Recently added' },
  { id: 'price-low', label: 'Price: low to high' },
  { id: 'price-high', label: 'Price: high to low' },
  { id: 'drop', label: 'Biggest drop' },
  { id: 'name', label: 'Name A–Z' },
];

export default function HomePage() {
  const [params, setParams] = useSearchParams();
  const query = (params.get('q') || '').trim().toLowerCase();
  const { dataVersion, refreshData, alerts } = useApp();
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scraping, setScraping] = useState(false);
  const [platform, setPlatform] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [data, dash] = await Promise.all([api.getProducts(), api.getDashboard().catch(() => null)]);
      setProducts(data);
      setAnalytics(dash);
    } catch (err) {
      setError(err.message || 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load({ silent: dataVersion > 0 });
  }, [load, dataVersion]);

  const { insights, loading: insightsLoading } = usePriceInsights(products);
  const kpis = useMemo(() => computeKpis(products, insights, alerts), [products, insights, alerts]);

  // Tell the user once per session when a saved price target is reached.
  useEffect(() => {
    products.forEach((p) => {
      const a = alerts[p.id];
      if (!a || p.latest_price == null || Number(p.latest_price) > a.target) return;
      const key = `dpt.notified.${p.id}.${a.target}`;
      try {
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
      } catch {
        /* ignore storage errors */
      }
      toast.success(`${p.name} is at or below your target of ₹${a.target.toLocaleString('en-IN')}.`, 'Price alert');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, alerts]);

  const handleScrapeAll = async () => {
    setScraping(true);
    try {
      const s = await api.scrapeAll();
      if (s.failed > 0) toast.error(`${s.failed} of ${s.total} could not be refreshed. Check the backend logs for details.`, `Updated ${s.scraped} of ${s.total}`);
      else toast.success(`All ${s.scraped} product${s.scraped === 1 ? '' : 's'} refreshed.`, 'Prices updated');
      refreshData();
    } catch (err) {
      toast.error(err.message || 'Unable to refresh prices.');
    } finally {
      setScraping(false);
    }
  };

  const platforms = useMemo(() => [...new Set(products.map((p) => String(p.platform).toLowerCase()))], [products]);

  const visible = useMemo(() => {
    const list = products.filter((p) => {
      const matchesQ = !query || [p.name, p.category, p.platform].filter(Boolean).some((v) => String(v).toLowerCase().includes(query));
      const matchesP = platform === 'all' || String(p.platform).toLowerCase() === platform;
      return matchesQ && matchesP;
    });
    const price = (p) => (p.latest_price == null ? null : Number(p.latest_price));
    const cmpNull = (a, b, fn) => (a == null ? 1 : b == null ? -1 : fn(a, b));
    list.sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return cmpNull(price(a), price(b), (x, y) => x - y);
        case 'price-high': return cmpNull(price(a), price(b), (x, y) => y - x);
        case 'drop': return cmpNull(insights[a.id]?.pctChange, insights[b.id]?.pctChange, (x, y) => x - y);
        case 'name': return String(a.name).localeCompare(String(b.name));
        default: return 0;
      }
    });
    return list;
  }, [products, query, platform, sortBy, insights]);

  const hasFilters = !!query || platform !== 'all' || sortBy !== 'recent';
  const clearFilters = () => {
    setPlatform('all');
    setSortBy('recent');
    const next = new URLSearchParams(params);
    next.delete('q');
    setParams(next, { replace: true });
  };

  const lastUpdated = products.reduce((m, p) => (p.last_scraped_at && (!m || p.last_scraped_at > m) ? p.last_scraped_at : m), null);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            {loading ? 'Loading your tracked products…' : lastUpdated ? `Prices last updated ${timeAgo(lastUpdated)}` : 'Price intelligence for Amazon India and Flipkart'}
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleScrapeAll} disabled={scraping || loading || !products.length}>
          <Icon name="refresh" size={16} className={scraping ? 'spin' : ''} />
          {scraping ? 'Refreshing…' : 'Refresh all prices'}
        </button>
      </div>

      {error && !products.length ? (
        <ErrorState message={error} onRetry={() => load()} />
      ) : (
        <>
          <DashboardStats kpis={kpis} loading={loading} insightsLoading={insightsLoading && !Object.keys(insights).length} />
          <DashboardCharts analytics={analytics} loading={loading} />

          <section className="card table-card">
            <div className="card-head table-head">
              <div>
                <h2>Tracked products</h2>
                <p className="muted" aria-live="polite">
                  {loading ? ' ' : `Showing ${visible.length} of ${products.length}${query ? ` matching “${params.get('q')}”` : ''}`}
                </p>
              </div>
              <div className="toolbar">
                {platforms.length > 1 && (
                  <div className="segmented" role="group" aria-label="Filter by store">
                    {['all', ...platforms].map((p) => (
                      <button key={p} type="button" aria-pressed={platform === p} className={platform === p ? 'active' : ''} onClick={() => setPlatform(p)}>
                        {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
                <label className="select">
                  <span className="sr-only">Sort products</span>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    {SORTS.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            {error && <ErrorState message={error} onRetry={() => load()} />}
            <ProductList
              products={visible}
              totalCount={products.length}
              loading={loading}
              insights={insights}
              insightsLoading={insightsLoading}
              hasFilters={hasFilters}
              onClearFilters={clearFilters}
              onChanged={refreshData}
            />
          </section>

          {!loading && <HowToRealProducts />}
        </>
      )}
    </>
  );
}

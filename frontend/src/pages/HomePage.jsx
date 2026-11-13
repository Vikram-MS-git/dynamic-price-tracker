import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { usePriceInsights } from '../hooks/usePriceInsights';
import { computeKpis } from '../lib/insights';
import { formatINR, timeAgo } from '../lib/format';
import DashboardStats from '../components/DashboardStats';
import DashboardCharts from '../components/DashboardCharts';
import ProductList from '../components/ProductList';
import HowToRealProducts from '../components/HowToRealProducts';
import FlashDropModal from '../components/FlashDropModal';
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
  const [filterTab, setFilterTab] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [flashModalOpen, setFlashModalOpen] = useState(false);

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

  const pcComponentsCount = useMemo(() => {
    return products.filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return cat.includes('pc component') || cat.includes('pc build') || name.includes('ryzen') || name.includes('rtx') || name.includes('motherboard');
    }).length;
  }, [products]);

  // Top deal across all tracked items
  const bestDeal = useMemo(() => {
    let top = null;
    products.forEach((p) => {
      const s = insights[p.id];
      if (s && s.pctChange != null && s.pctChange < 0) {
        if (!top || s.pctChange < top.pctChange) {
          top = { product: p, stats: s };
        }
      }
    });
    return top;
  }, [products, insights]);

  // Tell user when target reached
  useEffect(() => {
    products.forEach((p) => {
      const a = alerts[p.id];
      if (!a || p.latest_price == null || Number(p.latest_price) > a.target) return;
      const key = `dpt.notified.${p.id}.${a.target}`;
      try {
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
      } catch {
        /* ignore */
      }
      toast.success(`${p.name} is at or below your target of ₹${a.target.toLocaleString('en-IN')}.`, 'Price alert');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, alerts]);

  const handleScrapeAll = async () => {
    setScraping(true);
    try {
      const s = await api.scrapeAll();
      if (s.failed > 0) toast.error(`${s.failed} of ${s.total} could not be refreshed. Check backend logs.`, `Updated ${s.scraped} of ${s.total}`);
      else toast.success(`All ${s.scraped} product${s.scraped === 1 ? '' : 's'} refreshed.`, 'Prices updated');
      refreshData();
    } catch (err) {
      toast.error(err.message || 'Unable to refresh prices.');
    } finally {
      setScraping(false);
    }
  };

  const handleExportCsv = () => {
    if (!products.length) {
      toast.error('No products available to export.');
      return;
    }
    const headers = ['Product Name', 'Store', 'Category', 'Current Price (INR)', '14d Change %', 'Target Alert (INR)', 'Target Met', 'Store URL'];
    const rows = products.map((p) => {
      const s = insights[p.id];
      const target = alerts[p.id]?.target;
      const reached = target != null && p.latest_price != null && Number(p.latest_price) <= target;
      return [
        `"${(p.name || '').replace(/"/g, '""')}"`,
        p.platform || '',
        `"${p.category || 'Uncategorised'}"`,
        p.latest_price != null ? Number(p.latest_price) : 0,
        s?.pctChange != null ? `${s.pctChange.toFixed(1)}%` : '0%',
        target != null ? target : 'None',
        reached ? 'YES' : 'NO',
        `"${p.url || ''}"`,
      ];
    });

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PriceTracker_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Price tracking data exported as CSV report.', 'Report Downloaded');
  };

  const filterCounts = useMemo(() => {
    const drops = products.filter((p) => insights[p.id]?.pctChange != null && insights[p.id].pctChange < 0).length;
    const targets = products.filter((p) => alerts[p.id] && p.latest_price != null && Number(p.latest_price) <= alerts[p.id].target).length;
    const pc = products.filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return cat.includes('pc component') || cat.includes('pc build') || name.includes('ryzen') || name.includes('rtx') || name.includes('motherboard');
    }).length;
    const amazon = products.filter((p) => String(p.platform).toLowerCase() === 'amazon').length;
    const flipkart = products.filter((p) => String(p.platform).toLowerCase() === 'flipkart').length;
    return { all: products.length, drops, targets, pc, amazon, flipkart };
  }, [products, insights, alerts]);

  const visible = useMemo(() => {
    let list = products.filter((p) => {
      const matchesQ = !query || [p.name, p.category, p.platform].filter(Boolean).some((v) => String(v).toLowerCase().includes(query));
      if (!matchesQ) return false;

      const s = insights[p.id];
      const target = alerts[p.id]?.target;
      const reached = target != null && p.latest_price != null && Number(p.latest_price) <= target;
      const isPc = (p.category || '').toLowerCase().includes('pc component') || (p.name || '').toLowerCase().includes('ryzen') || (p.name || '').toLowerCase().includes('rtx') || (p.name || '').toLowerCase().includes('motherboard');

      switch (filterTab) {
        case 'drops':
          return s && s.pctChange != null && s.pctChange < 0;
        case 'targets':
          return reached;
        case 'pc':
          return isPc;
        case 'amazon':
          return String(p.platform).toLowerCase() === 'amazon';
        case 'flipkart':
          return String(p.platform).toLowerCase() === 'flipkart';
        default:
          return true;
      }
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
  }, [products, query, filterTab, sortBy, insights, alerts]);

  const hasFilters = !!query || filterTab !== 'all' || sortBy !== 'recent';
  const clearFilters = () => {
    setFilterTab('all');
    setSortBy('recent');
    const next = new URLSearchParams(params);
    next.delete('q');
    setParams(next, { replace: true });
  };

  const lastUpdated = products.reduce((m, p) => (p.last_scraped_at && (!m || p.last_scraped_at > m) ? p.last_scraped_at : m), null);

  return (
    <>
      {/* Top Header Command Bar */}
      <div className="page-head dashboard-head">
        <div>
          <div className="row gap-xs items-center mb-xs">
            <span className="badge badge-accent text-xs">
              <Icon name="chart" size={12} /> Real-Time Intelligence
            </span>
            <span className="badge badge-good text-xs">
              <span className="status-dot" style={{ background: 'var(--good)', width: 6, height: 6 }} /> Active Scrapers
            </span>
          </div>
          <h1>Dashboard & Price Intelligence</h1>
          <p className="muted">
            {loading
              ? 'Loading your tracked products…'
              : lastUpdated
              ? `Prices synchronized ${timeAgo(lastUpdated)} · Dual-store tracking across Amazon & Flipkart`
              : 'Real-time e-commerce tracking across Amazon India and Flipkart'}
          </p>
        </div>

        <div className="page-head-actions">
          <button
            type="button"
            className="btn btn-secondary"
            title="Simulate a real-time market discount or flash drop for tutor demo"
            onClick={() => setFlashModalOpen(true)}
            disabled={!products.length}
          >
            <Icon name="sparkle" size={15} /> ⚡ Simulate Flash Drop
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            title="Download CSV audit report with price trends and alert statuses"
            onClick={handleExportCsv}
            disabled={!products.length}
          >
            <Icon name="layers" size={15} /> 📥 Export CSV
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleScrapeAll}
            disabled={scraping || loading || !products.length}
          >
            <Icon name="refresh" size={16} className={scraping ? 'spin' : ''} />
            {scraping ? 'Refreshing…' : 'Refresh all prices'}
          </button>
        </div>
      </div>

      {error && !products.length ? (
        <ErrorState message={error} onRetry={() => load()} />
      ) : (
        <>
          {/* Key Metric KPI Cards (Top of Page) */}
          <DashboardStats kpis={kpis} loading={loading} insightsLoading={insightsLoading && !Object.keys(insights).length} />

          {/* AI Deal Spotlight: Highlights Top Discount */}
          {bestDeal && (
            <div className="card deal-spotlight-card">
              <div className="deal-spotlight-left">
                <div className="deal-spotlight-badge">
                  <Icon name="sparkle" size={13} />
                  <span>HOT MARKET DEAL</span>
                </div>
                <h3 className="deal-spotlight-title">
                  <Link to={`/products/${bestDeal.product.id}`}>{bestDeal.product.name}</Link>
                </h3>
                <p className="deal-spotlight-desc">
                  Price dropped by <strong className="text-good">{Math.abs(bestDeal.stats.pctChange).toFixed(1)}%</strong> to{' '}
                  <strong className="text-good">{formatINR(bestDeal.product.latest_price)}</strong> on {bestDeal.product.platform.toUpperCase()}!
                  {alerts[bestDeal.product.id] && Number(bestDeal.product.latest_price) <= alerts[bestDeal.product.id].target && (
                    <span className="deal-target-tag">🎯 Below your target threshold!</span>
                  )}
                </p>
              </div>
              <div className="deal-spotlight-right">
                <Link to={`/products/${bestDeal.product.id}`} className="btn btn-primary btn-sm">
                  <Icon name="chart" size={14} /> Price Analytics
                </Link>
                <a href={bestDeal.product.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                  View on {bestDeal.product.platform} <Icon name="external" size={13} />
                </a>
              </div>
            </div>
          )}

          {/* Visual Market Analytics Charts */}
          <DashboardCharts analytics={analytics} loading={loading} />

          {/* Compact PC Builder Command Bar */}
          <section className="card pc-builder-mini-banner" aria-label="PC Builder Feature Banner">
            <div className="pc-mini-left">
              <div className="row gap-xs items-center mb-xs">
                <span className="badge badge-accent text-xs">
                  <Icon name="cpu" size={12} /> PC Builder Engine
                </span>
                <span className="badge badge-neutral text-xs">Socket & DDR Validation</span>
                {pcComponentsCount > 0 && (
                  <span className="badge badge-good text-xs">
                    <Icon name="check" size={11} /> {pcComponentsCount} components tracked
                  </span>
                )}
              </div>
              <h2 className="pc-mini-title">Custom PC Builder & Power Telemetry</h2>
              <p className="pc-mini-desc">
                Select processors, GPUs, motherboards, and power supplies with live socket validation, peak wattage calculations, and dual-store pricing.
              </p>
            </div>
            <div className="pc-mini-right">
              <div className="pc-mini-presets">
                <Link to="/pc-builder" className="preset-pill">1080p Budget (~₹60k)</Link>
                <Link to="/pc-builder" className="preset-pill">1440p Creator (~₹95k)</Link>
                <Link to="/pc-builder" className="preset-pill">4K Flagship (~₹1.95L)</Link>
              </div>
              <Link to="/pc-builder" className="btn btn-primary btn-sm">
                <Icon name="cpu" size={14} /> Launch PC Builder
              </Link>
            </div>
          </section>

          {/* Main Tracked Products Section */}
          <section className="card table-card">
            <div className="card-head table-head">
              <div>
                <h2>Tracked products</h2>
                <p className="muted" aria-live="polite">
                  {loading ? ' ' : `Showing ${visible.length} of ${products.length}${query ? ` matching “${params.get('q')}”` : ''}`}
                </p>
              </div>

              <div className="toolbar" style={{ flexWrap: 'wrap', gap: '8px' }}>
                {/* View Mode Toggle */}
                <div className="segmented" role="group" aria-label="Display View">
                  <button
                    type="button"
                    aria-pressed={viewMode === 'table'}
                    className={viewMode === 'table' ? 'active' : ''}
                    onClick={() => setViewMode('table')}
                    title="Table View"
                  >
                    <Icon name="layers" size={13} /> Table
                  </button>
                  <button
                    type="button"
                    aria-pressed={viewMode === 'grid'}
                    className={viewMode === 'grid' ? 'active' : ''}
                    onClick={() => setViewMode('grid')}
                    title="Grid Cards View"
                  >
                    <Icon name="sparkle" size={13} /> Cards
                  </button>
                </div>

                {/* Sort selector */}
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

            {/* Smart Filter Pills */}
            <div className="filter-pill-bar">
              <button
                type="button"
                className={`filter-pill ${filterTab === 'all' ? 'active' : ''}`}
                onClick={() => setFilterTab('all')}
              >
                All Products ({filterCounts.all})
              </button>
              {filterCounts.drops > 0 && (
                <button
                  type="button"
                  className={`filter-pill pill-drop ${filterTab === 'drops' ? 'active' : ''}`}
                  onClick={() => setFilterTab('drops')}
                >
                  🔥 Price Drops ({filterCounts.drops})
                </button>
              )}
              {filterCounts.targets > 0 && (
                <button
                  type="button"
                  className={`filter-pill pill-target ${filterTab === 'targets' ? 'active' : ''}`}
                  onClick={() => setFilterTab('targets')}
                >
                  🎯 Target Reached ({filterCounts.targets})
                </button>
              )}
              {filterCounts.pc > 0 && (
                <button
                  type="button"
                  className={`filter-pill ${filterTab === 'pc' ? 'active' : ''}`}
                  onClick={() => setFilterTab('pc')}
                >
                  💻 PC Parts ({filterCounts.pc})
                </button>
              )}
              <button
                type="button"
                className={`filter-pill ${filterTab === 'amazon' ? 'active' : ''}`}
                onClick={() => setFilterTab('amazon')}
              >
                Amazon ({filterCounts.amazon})
              </button>
              <button
                type="button"
                className={`filter-pill ${filterTab === 'flipkart' ? 'active' : ''}`}
                onClick={() => setFilterTab('flipkart')}
              >
                Flipkart ({filterCounts.flipkart})
              </button>
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
              viewMode={viewMode}
            />
          </section>

          {!loading && <HowToRealProducts />}
        </>
      )}

      {/* Flash Drop Simulator Modal */}
      <FlashDropModal
        open={flashModalOpen}
        onClose={() => setFlashModalOpen(false)}
        products={products}
        onSimulated={() => {
          load({ silent: true });
          refreshData();
        }}
      />
    </>
  );
}

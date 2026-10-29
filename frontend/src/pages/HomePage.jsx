import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import AddProductForm from '../components/AddProductForm';
import ProductList from '../components/ProductList';
import DashboardStats from '../components/DashboardStats';
import HowToRealProducts from '../components/HowToRealProducts';
import DashboardCharts from '../components/DashboardCharts';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState('');
  const [groupsCount, setGroupsCount] = useState(0);
  const [search, setSearch] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [data, groups, dash] = await Promise.all([
        api.getProducts(),
        api.getGroups(),
        api.getDashboard().catch(() => null),
      ]);
      setProducts(data);
      setGroupsCount(groups.length);
      setAnalytics(dash);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleScrapeAll = async () => {
    setScraping(true);
    setScrapeStatus('');
    setError('');
    try {
      const summary = await api.scrapeAll();
      setScrapeStatus(
        `Updated ${summary.scraped} of ${summary.total} product(s).` +
          (summary.failed > 0 ? ` ${summary.failed} failed (check backend logs).` : '')
      );
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setScraping(false);
    }
  };

  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name?.toLowerCase().includes(q) ||
      p.platform?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <HowToRealProducts />
      <DashboardStats products={products} groupsCount={groupsCount} />
      <DashboardCharts analytics={analytics} loading={analyticsLoading} />
      <AddProductForm onAdded={load} />
      <section className="products-panel">
        <div className="card-header-row">
          <h2>Tracked products</h2>
          <button
            type="button"
            className="secondary"
            onClick={handleScrapeAll}
            disabled={scraping || loading}
          >
            {scraping ? 'Refreshing…' : 'Refresh all prices'}
          </button>
        </div>
        <label className="search-label">
          Search products
          <input
            type="search"
            placeholder="Name, platform, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        {scrapeStatus && <p className="success">{scrapeStatus}</p>}
        {error && <p className="error">{error}</p>}
        <ProductList products={filtered} loading={loading} onChanged={load} />
      </section>
    </>
  );
}

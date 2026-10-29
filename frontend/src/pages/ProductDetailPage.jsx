
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import PriceChart from '../components/PriceChart';
import ProductImage from '../components/ProductImage';

function getDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getRange(days) {
  const today = new Date();
  const start = new Date(today);

  if (days !== null) {
    start.setDate(start.getDate() - (days - 1));
  } else {
    return { from: '', to: getDateString(today) };
  }

  return {
    from: getDateString(start),
    to: getDateString(today),
  };
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const initialRange = getRange(7);

  const [product, setProduct] = useState(null);
  const [prices, setPrices] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [scraping, setScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState('');
  const [activeRange, setActiveRange] = useState('7');

  const loadPrices = async (rangeFrom = from, rangeTo = to) => {
    setLoading(true);
    setError('');

    try {
      const params = {};

      if (rangeFrom) {
        params.from = new Date(
          `${rangeFrom}T00:00:00`
        ).toISOString();
      }

      if (rangeTo) {
        params.to = new Date(
          `${rangeTo}T23:59:59.999`
        ).toISOString();
      }

      const data = await api.getProductPrices(id, params);
      setProduct(data.product);
      setPrices(data.prices || []);
    } catch (err) {
      setError(err.message || 'Unable to load price history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();
  }, [id]);

  const applyQuickRange = (days) => {
    const range = getRange(days);

    setFrom(range.from);
    setTo(range.to);
    setActiveRange(days === null ? 'all' : String(days));

    loadPrices(range.from, range.to);
  };

  const handleScrape = async () => {
    setScraping(true);
    setScrapeMsg('');
    setError('');

    try {
      const result = await api.scrapeProduct(id);

      if (result.success) {
        setScrapeMsg(
          `Saved ₹${Number(result.price).toLocaleString('en-IN')} at ${new Date(
            result.scrapedAt
          ).toLocaleString('en-IN')}`
        );
      } else {
        setScrapeMsg(`Scrape failed: ${result.error}`);
      }

      await loadPrices();
    } catch (err) {
      setError(err.message || 'Unable to refresh this product.');
    } finally {
      setScraping(false);
    }
  };

  if (loading && !product) return <p>Loading…</p>;
  if (error && !product) return <p className="error">{error}</p>;
  if (!product) return <p>Product not found.</p>;

  return (
    <>
      <Link to="/" className="back-link">
        ← Back to list
      </Link>

      <div className="card product-hero-card">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          platform={product.platform}
          size="xl"
        />

        <div className="product-hero-info">
          <h2>{product.name}</h2>

          <p>
            <span className={`badge badge-${product.platform}`}>
              {product.platform}
            </span>
            {product.category && (
              <span className="muted"> · {product.category}</span>
            )}
          </p>

          <a
            href={product.url}
            target="_blank"
            rel="noreferrer"
            className="btn-primary btn-sm"
          >
            View on store →
          </a>
        </div>
      </div>

      <div className="card">
        <div className="card-header-row">
          <h3>Price over time</h3>

          <button
            type="button"
            className="secondary"
            onClick={handleScrape}
            disabled={scraping}
          >
            {scraping ? 'Refreshing…' : 'Refresh this product'}
          </button>
        </div>

        <div className="quick-ranges">
          <button
            type="button"
            className={activeRange === '7' ? 'active' : ''}
            onClick={() => applyQuickRange(7)}
          >
            Last 7 days
          </button>

          <button
            type="button"
            className={activeRange === '30' ? 'active' : ''}
            onClick={() => applyQuickRange(30)}
          >
            Last 30 days
          </button>

          <button
            type="button"
            className={activeRange === 'all' ? 'active' : ''}
            onClick={() => applyQuickRange(null)}
          >
            All time
          </button>
        </div>

        <div className="filter-row">
          <label>
            From
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => {
                setFrom(e.target.value);
                setActiveRange('custom');
              }}
            />
          </label>

          <label>
            To
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => {
                setTo(e.target.value);
                setActiveRange('custom');
              }}
            />
          </label>

          <button
            type="button"
            onClick={() => loadPrices()}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Apply filter'}
          </button>
        </div>

        {error && <p className="error">{error}</p>}
        {scrapeMsg && <p className="success">{scrapeMsg}</p>}

        {loading ? (
          <p>Loading price history…</p>
        ) : (
          <PriceChart prices={prices} />
        )}
      </div>
    </>
  );
}


import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ProductImage from './ProductImage';

function formatWhen(iso) {
  if (!iso) return 'Never';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return date.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ProductList({ products, loading, onChanged }) {
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = (products || []).filter((product) => {
      const matchesSearch =
        !query ||
        [product.name, product.category, product.platform]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesPlatform =
        platform === 'all' ||
        String(product.platform || '').toLowerCase() === platform;

      return matchesSearch && matchesPlatform;
    });

    result.sort((a, b) => {
      const priceA =
        a.latest_price == null ? null : Number(a.latest_price);
      const priceB =
        b.latest_price == null ? null : Number(b.latest_price);

      switch (sortBy) {
        case 'price-low':
          if (priceA == null) return 1;
          if (priceB == null) return -1;
          return priceA - priceB;

        case 'price-high':
          if (priceA == null) return 1;
          if (priceB == null) return -1;
          return priceB - priceA;

        case 'name':
          return String(a.name || '').localeCompare(String(b.name || ''));

        default:
          return 0;
      }
    });

    return result;
  }, [products, search, platform, sortBy]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" and all its price history?`)) {
      return;
    }

    setDeletingId(id);

    try {
      await api.deleteProduct(id);
      onChanged?.();
    } catch (err) {
      window.alert(err.message || 'Unable to delete product.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="product-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="product-card skeleton" />
        ))}
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📊</span>
        <p>No products yet. Add one above to start tracking prices.</p>
      </div>
    );
  }

  return (
    <section className="product-list-section">
      <div className="product-toolbar">
        <div className="product-search">
          <label htmlFor="product-search">Search products</label>
          <input
            id="product-search"
            type="search"
            placeholder="Search by name or category..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="product-filter">
          <label htmlFor="platform-filter">Platform</label>
          <select
            id="platform-filter"
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
          >
            <option value="all">All platforms</option>
            <option value="amazon">Amazon</option>
            <option value="flipkart">Flipkart</option>
          </select>
        </div>

        <div className="product-sort">
          <label htmlFor="product-sort">Sort by</label>
          <select
            id="product-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="default">Default order</option>
            <option value="price-low">Price: Low to high</option>
            <option value="price-high">Price: High to low</option>
            <option value="name">Product name: A–Z</option>
          </select>
        </div>

        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            setSearch('');
            setPlatform('all');
            setSortBy('default');
          }}
        >
          Reset
        </button>
      </div>

      <p className="product-result-count" aria-live="polite">
        Showing <strong>{filteredProducts.length}</strong> of{' '}
        <strong>{products.length}</strong> products
      </p>

      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🔎</span>
          <p>No products match your search or selected platform.</p>
          <button
            type="button"
            className="btn-ghost primary"
            onClick={() => {
              setSearch('');
              setPlatform('all');
              setSortBy('default');
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((p) => (
            <article key={p.id} className="product-card">
              <ProductImage
                src={p.image_url}
                alt={p.name}
                platform={p.platform}
                size="lg"
              />

              <div className="product-card-body">
                <h3 className="product-title">{p.name}</h3>

                {p.category && (
                  <p className="product-category">{p.category}</p>
                )}

                <div className="meta">
                  <span
                    className={`badge badge-${String(
                      p.platform || ''
                    ).toLowerCase()}`}
                  >
                    {p.platform}
                  </span>

                  {p.latest_price != null && (
                    <span className="price-tag">
                      ₹{Number(p.latest_price).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <p className="muted product-updated">
                  Updated {formatWhen(p.last_scraped_at)}
                </p>

                {p.last_scrape_error && (
                  <p className="error scrape-hint" title={p.last_scrape_error}>
                    Scrape failed — refresh to retry
                  </p>
                )}

                <div className="product-card-actions">
                  {p.group_id && (
                    <Link
                      to={`/compare?group=${p.group_id}`}
                      className="btn-ghost"
                    >
                      Compare
                    </Link>
                  )}

                  <Link
                    to={`/products/${p.id}`}
                    className="btn-ghost primary"
                  >
                    Chart
                  </Link>

                  <button
                    type="button"
                    className="btn-ghost danger"
                    disabled={deletingId === p.id}
                    onClick={() => handleDelete(p.id, p.name)}
                  >
                    {deletingId === p.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

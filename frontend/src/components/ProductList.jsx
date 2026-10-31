import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useApp } from '../context/AppContext';
import { formatINR, formatPct, timeAgo } from '../lib/format';
import Icon from './Icon';
import Modal from './Modal';
import PlatformBadge from './PlatformBadge';
import ProductImage from './ProductImage';
import Sparkline from './Sparkline';
import { EmptyState, Skeleton } from './States';

function Change({ stats }) {
  if (!stats || stats.change == null) return <span className="muted">—</span>;
  const dir = stats.change < 0 ? 'down' : stats.change > 0 ? 'up' : 'flat';
  return (
    <span className={`change change-${dir}`}>
      {dir !== 'flat' && <Icon name={dir === 'down' ? 'arrowDown' : 'arrowUp'} size={13} strokeWidth={2.2} />}
      {formatPct(stats.pctChange)}
    </span>
  );
}

function sparkTone(stats) {
  if (!stats || stats.change == null || stats.change === 0) return 'neutral';
  return stats.change < 0 ? 'good' : 'bad';
}

export default function ProductList({ products, totalCount, loading, insights, insightsLoading, hasFilters, onClearFilters, onChanged }) {
  const toast = useToast();
  const { alerts, openTrack } = useApp();
  const [refreshingId, setRefreshingId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleRefresh = async (p) => {
    setRefreshingId(p.id);
    try {
      const r = await api.scrapeProduct(p.id);
      if (r.success) toast.success(`${p.name} is now ${formatINR(r.price)}.`, 'Price updated');
      else toast.error(r.error || 'The store did not return a price.', `Could not refresh ${p.name}`);
      onChanged?.();
    } catch (err) {
      toast.error(err.message || 'Unable to refresh this product.');
    } finally {
      setRefreshingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.deleteProduct(toDelete.id);
      toast.success(`${toDelete.name} and its price history were removed.`, 'Product deleted');
      setToDelete(null);
      onChanged?.();
    } catch (err) {
      toast.error(err.message || 'Unable to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  const actions = (p) => (
    <div className="row-actions">
      <Link to={`/products/${p.id}`} className="icon-btn" title="View price history" aria-label={`View price history for ${p.name}`}>
        <Icon name="chart" size={16} />
      </Link>
      {p.group_id && (
        <Link to={`/compare?group=${p.group_id}`} className="icon-btn" title="Compare stores" aria-label={`Compare stores for ${p.name}`}>
          <Icon name="compare" size={16} />
        </Link>
      )}
      <button type="button" className="icon-btn" title="Refresh price" aria-label={`Refresh price for ${p.name}`} disabled={refreshingId === p.id} onClick={() => handleRefresh(p)}>
        <Icon name="refresh" size={16} className={refreshingId === p.id ? 'spin' : ''} />
      </button>
      <a href={p.url} target="_blank" rel="noreferrer" className="icon-btn" title="Open on store" aria-label={`Open ${p.name} on the store`}>
        <Icon name="external" size={16} />
      </a>
      <button type="button" className="icon-btn danger" title="Delete product" aria-label={`Delete ${p.name}`} onClick={() => setToDelete(p)}>
        <Icon name="trash" size={16} />
      </button>
    </div>
  );

  const nameCell = (p) => (
    <div className="product-cell">
      <ProductImage src={p.image_url} alt={p.name} platform={p.platform} size="sm" />
      <div className="product-cell-text">
        <Link to={`/products/${p.id}`} className="product-name">{p.name}</Link>
        <span className="muted">
          {p.category || 'Uncategorised'}
          {alerts[p.id] && p.latest_price != null && Number(p.latest_price) <= alerts[p.id].target && (
            <span className="pill pill-good inline-pill">Target reached</span>
          )}
        </span>
        {p.last_scrape_error && (
          <span className="scrape-hint" title={p.last_scrape_error}>
            <Icon name="alert" size={13} /> Last refresh failed
          </span>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="table-skeleton" aria-busy="true" aria-label="Loading products">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton-row">
            <Skeleton style={{ width: 40, height: 40, borderRadius: 10 }} />
            <div style={{ flex: 1 }}>
              <Skeleton style={{ height: 14, width: '40%' }} />
              <Skeleton style={{ height: 11, width: '22%', marginTop: 8 }} />
            </div>
            <Skeleton style={{ height: 14, width: 80 }} />
          </div>
        ))}
      </div>
    );
  }

  if (!totalCount) {
    return (
      <EmptyState
        icon="package"
        title="No products tracked yet"
        action={
          <button type="button" className="btn btn-primary btn-sm" onClick={openTrack}>
            <Icon name="plus" size={15} strokeWidth={2.2} /> Track your first product
          </button>
        }
      >
        Add an Amazon.in or Flipkart link and prices will be recorded over time.
      </EmptyState>
    );
  }

  if (!products.length) {
    return (
      <EmptyState
        icon="search"
        title="No matching products"
        action={
          hasFilters && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClearFilters}>
              Clear search and filters
            </button>
          )
        }
      >
        Nothing matches your current search or store filter.
      </EmptyState>
    );
  }

  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Store</th>
              <th className="num">Price</th>
              <th className="num">Change</th>
              <th>Trend</th>
              <th>Updated</th>
              <th className="actions-col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const s = insights[p.id];
              return (
                <tr key={p.id}>
                  <td>{nameCell(p)}</td>
                  <td><PlatformBadge platform={p.platform} /></td>
                  <td className="num price">{p.latest_price != null ? formatINR(p.latest_price) : <span className="muted">Pending</span>}</td>
                  <td className="num">{insightsLoading && !s ? <Skeleton style={{ height: 14, width: 48, marginLeft: 'auto' }} /> : <Change stats={s} />}</td>
                  <td>{insightsLoading && !s ? <Skeleton style={{ height: 22, width: 90 }} /> : <Sparkline values={s?.series} tone={sparkTone(s)} />}</td>
                  <td className="muted nowrap">{timeAgo(p.last_scraped_at)}</td>
                  <td className="actions-col">{actions(p)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="card-list">
        {products.map((p) => {
          const s = insights[p.id];
          return (
            <li key={p.id} className="mcard">
              {nameCell(p)}
              <div className="mcard-stats">
                <div>
                  <span className="muted">Price</span>
                  <strong className="price">{p.latest_price != null ? formatINR(p.latest_price) : 'Pending'}</strong>
                </div>
                <div>
                  <span className="muted">Change</span>
                  <Change stats={s} />
                </div>
                <div>
                  <span className="muted">Store</span>
                  <PlatformBadge platform={p.platform} />
                </div>
              </div>
              <div className="mcard-foot">
                <Sparkline values={s?.series} tone={sparkTone(s)} width={120} />
                {actions(p)}
              </div>
            </li>
          );
        })}
      </ul>

      <Modal open={!!toDelete} onClose={() => !deleting && setToDelete(null)} title="Delete this product?" size="sm">
        <p className="muted">
          <strong>{toDelete?.name}</strong> and all of its recorded price history will be permanently removed. This cannot be undone.
        </p>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setToDelete(null)} disabled={deleting}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete product'}
          </button>
        </div>
      </Modal>
    </>
  );
}

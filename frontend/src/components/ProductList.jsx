import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useApp } from '../context/AppContext';
import { formatINR, formatPct, timeAgo } from '../lib/format';
import { getBuySignal } from '../lib/insights';
import Icon from './Icon';
import Modal from './Modal';
import PlatformBadge from './PlatformBadge';
import DataSourceBadge from './DataSourceBadge';
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

export default function ProductList({ products, totalCount, loading, insights, insightsLoading, hasFilters, onClearFilters, onChanged, viewMode = 'table' }) {
  const toast = useToast();
  const { alerts, openTrack } = useApp();
  const [refreshingId, setRefreshingId] = useState(null);
  const [simulatingId, setSimulatingId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleSimulate = async (p) => {
    setSimulatingId(p.id);
    try {
      const r = await api.simulatePrice(p.id);
      toast.success(
        `Updated price to ${formatINR(r.price)}${r.alertTriggered ? ' (TARGET ALERT TRIGGERED!)' : ''}.`,
        'Price Updated'
      );
      onChanged?.();
    } catch (err) {
      toast.error(err.message || 'Unable to update price.');
    } finally {
      setSimulatingId(null);
    }
  };

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
      <button type="button" className="icon-btn" title="Refresh live price (from store)" aria-label={`Refresh price for ${p.name}`} disabled={refreshingId === p.id} onClick={() => handleRefresh(p)}>
        <Icon name="refresh" size={16} className={refreshingId === p.id ? 'spin' : ''} />
      </button>
      <button type="button" className="icon-btn" title="Trigger real-time price update" aria-label={`Update price for ${p.name}`} disabled={simulatingId === p.id} onClick={() => handleSimulate(p)}>
        <Icon name="sparkle" size={15} className={simulatingId === p.id ? 'spin' : ''} />
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
      {viewMode === 'table' ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Store</th>
                <th className="num">Price</th>
                <th className="num">Change</th>
                <th>Trend</th>
                <th>Buy Signal</th>
                <th>Updated</th>
                <th className="actions-col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const s = insights[p.id];
                const signal = getBuySignal(p, s, alerts[p.id]);
                return (
                  <tr key={p.id}>
                    <td>{nameCell(p)}</td>
                    <td><PlatformBadge platform={p.platform} /></td>
                    <td className="num price">
                      {p.latest_price != null ? (
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                          <span>{formatINR(p.latest_price)}</span>
                          <DataSourceBadge isSimulated={p.latest_is_simulated} size="sm" />
                        </div>
                      ) : (
                        <span className="muted">Pending</span>
                      )}
                    </td>
                    <td className="num">{insightsLoading && !s ? <Skeleton style={{ height: 14, width: 48, marginLeft: 'auto' }} /> : <Change stats={s} />}</td>
                    <td>{insightsLoading && !s ? <Skeleton style={{ height: 22, width: 90 }} /> : <Sparkline values={s?.series} tone={sparkTone(s)} />}</td>
                    <td>
                      <span className={`pill ${signal.tone === 'good' ? 'pill-good' : signal.tone === 'bad' ? 'pill-bad' : 'pill'}`} title={signal.advice}>
                        <Icon name="sparkle" size={11} /> {signal.shortLabel}
                      </span>
                    </td>
                    <td className="muted nowrap">{timeAgo(p.last_scraped_at)}</td>
                    <td className="actions-col">{actions(p)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="product-grid-view">
          {products.map((p) => {
            const s = insights[p.id];
            const signal = getBuySignal(p, s, alerts[p.id]);
            const target = alerts[p.id]?.target;
            const reached = target != null && p.latest_price != null && Number(p.latest_price) <= target;

            return (
              <div key={p.id} className={`product-card ${reached ? 'card-target-reached' : ''}`}>
                <div className="product-card-top">
                  <PlatformBadge platform={p.platform} />
                  <span className={`pill ${signal.tone === 'good' ? 'pill-good' : signal.tone === 'bad' ? 'pill-bad' : 'pill'}`} title={signal.advice}>
                    <Icon name="sparkle" size={11} /> {signal.shortLabel}
                  </span>
                </div>

                <div className="product-card-img-wrap">
                  <Link to={`/products/${p.id}`}>
                    <ProductImage src={p.image_url} alt={p.name} platform={p.platform} size="xl" />
                  </Link>
                </div>

                <div className="product-card-body">
                  <span className="product-card-cat">{p.category || 'Product'}</span>
                  <Link to={`/products/${p.id}`} className="product-card-title" title={p.name}>
                    {p.name}
                  </Link>

                  <div className="product-card-price-row">
                    <div>
                      <span className="product-card-price">
                        {p.latest_price != null ? formatINR(p.latest_price) : 'Pending'}
                      </span>
                      <DataSourceBadge isSimulated={p.latest_is_simulated} size="sm" />
                    </div>
                    <Change stats={s} />
                  </div>

                  {target != null && (
                    <div className="product-card-target-row">
                      <span className="text-xs muted">Alert Target: ₹{Number(target).toLocaleString('en-IN')}</span>
                      {reached && <span className="badge badge-good text-xs">Target Met!</span>}
                    </div>
                  )}

                  <div className="product-card-sparkline">
                    <span className="text-xs muted">14-Day Movement</span>
                    <Sparkline values={s?.series} tone={sparkTone(s)} width={120} height={26} />
                  </div>
                </div>

                <div className="product-card-actions">
                  <Link to={`/products/${p.id}`} className="btn btn-secondary btn-sm" title="Price History & Analytics">
                    <Icon name="chart" size={14} /> Analytics
                  </Link>
                  {p.group_id && (
                    <Link to={`/compare?group=${p.group_id}`} className="btn btn-secondary btn-sm" title="Compare Stores">
                      <Icon name="compare" size={14} /> Compare
                    </Link>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    title="Simulate Market Price Drop"
                    disabled={simulatingId === p.id}
                    onClick={() => handleSimulate(p)}
                  >
                    <Icon name="sparkle" size={13} className={simulatingId === p.id ? 'spin' : ''} />
                    {simulatingId === p.id ? 'Dropping…' : 'Drop Test'}
                  </button>
                  <a href={p.url} target="_blank" rel="noreferrer" className="icon-btn" title="Open Store">
                    <Icon name="external" size={15} />
                  </a>
                  <button type="button" className="icon-btn danger" title="Delete" onClick={() => setToDelete(p)}>
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ul className="card-list">
        {products.map((p) => {
          const s = insights[p.id];
          return (
            <li key={p.id} className="mcard">
              {nameCell(p)}
              <div className="mcard-stats">
                <div>
                  <span className="muted">Price</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong className="price">{p.latest_price != null ? formatINR(p.latest_price) : 'Pending'}</strong>
                    {p.latest_price != null && (
                      <DataSourceBadge isSimulated={p.latest_is_simulated} size="sm" />
                    )}
                  </div>
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

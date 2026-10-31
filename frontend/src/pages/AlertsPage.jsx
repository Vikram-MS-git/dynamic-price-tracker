import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { formatINR } from '../lib/format';
import Icon from '../components/Icon';
import ProductImage from '../components/ProductImage';
import { EmptyState, ErrorState, Skeleton } from '../components/States';

function AlertRow({ product, alert, productId }) {
  const { setAlert, removeAlert } = useApp();
  const toast = useToast();
  const [value, setValue] = useState(String(alert.target));
  const latest = product?.latest_price != null ? Number(product.latest_price) : null;
  const reached = latest != null && latest <= alert.target;
  const dirty = Number(value) !== alert.target;

  const save = () => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error('Enter a target price greater than 0.');
      return;
    }
    setAlert(productId, n);
    toast.success(`Target updated to ${formatINR(n)}.`);
  };

  return (
    <li className="alert-row">
      <div className="product-cell">
        <ProductImage src={product?.image_url} alt={product?.name || 'Removed product'} platform={product?.platform} size="sm" />
        <div className="product-cell-text">
          {product ? <Link to={`/products/${productId}`} className="product-name">{product.name}</Link> : <span className="product-name">Product no longer tracked</span>}
          <span className="muted">{latest != null ? `Current ${formatINR(latest)}` : product ? 'No price yet' : 'This product was deleted'}</span>
        </div>
      </div>
      <span className={`pill ${!product ? '' : reached ? 'pill-good' : 'pill-accent'}`}>{!product ? 'Orphaned' : reached ? 'Target reached' : 'Watching'}</span>
      <div className="alert-edit">
        <label className="field-inline">
          <span>Target ₹</span>
          <input type="number" min="1" step="any" value={value} onChange={(e) => setValue(e.target.value)} aria-label="Target price in rupees" />
        </label>
        <button type="button" className="btn btn-secondary btn-sm" onClick={save} disabled={!dirty || !product}>Save</button>
        <button type="button" className="icon-btn danger" aria-label="Remove alert" title="Remove alert" onClick={() => { removeAlert(productId); toast.info('Alert removed.'); }}>
          <Icon name="trash" size={16} />
        </button>
      </div>
    </li>
  );
}

export default function AlertsPage() {
  const { alerts, dataVersion } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setProducts(await api.getProducts());
    } catch (err) {
      setError(err.message || 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, dataVersion]);

  const ids = Object.keys(alerts);
  const byId = Object.fromEntries(products.map((p) => [String(p.id), p]));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Price alerts</h1>
          <p className="muted">Set a target on any product and see when its price reaches it.</p>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <div className="card"><Skeleton style={{ height: 70, marginBottom: 12 }} /><Skeleton style={{ height: 70 }} /></div>
      ) : ids.length === 0 ? (
        <div className="card">
          <EmptyState icon="bell" title="No price alerts yet" action={<Link to="/" className="btn btn-primary btn-sm">Choose a product</Link>}>
            Open a product, enter a target price, and it will be listed here.
          </EmptyState>
        </div>
      ) : (
        <div className="card">
          <ul className="alert-list">
            {ids.map((pid) => (
              <AlertRow key={`${pid}-${alerts[pid].target}`} productId={pid} product={byId[pid]} alert={alerts[pid]} />
            ))}
          </ul>
          <p className="field-hint pad">Alerts are stored in this browser and checked whenever you open the app.</p>
        </div>
      )}
    </>
  );
}

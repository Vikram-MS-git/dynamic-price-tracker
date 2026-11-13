import { useCallback, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { formatINR } from '../lib/format';
import Icon from '../components/Icon';
import ProductImage from '../components/ProductImage';
import PlatformBadge from '../components/PlatformBadge';
import DataSourceBadge from '../components/DataSourceBadge';
import { EmptyState, ErrorState, Skeleton } from '../components/States';

function AlertRow({ alert, onUpdated }) {
  const toast = useToast();
  const [value, setValue] = useState(String(alert.target_price));
  const [saving, setSaving] = useState(false);
  const [dropping, setDropping] = useState(false);

  const latest = alert.latest_price != null ? Number(alert.latest_price) : null;
  const target = Number(alert.target_price);
  const reached = alert.is_triggered || (latest != null && latest <= target);
  const dirty = Number(value) !== target;
  const isPcPart = (alert.product_category || '').toLowerCase().includes('pc component');

  const save = async () => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error('Enter a target price greater than 0.');
      return;
    }
    setSaving(true);
    try {
      await api.setAlert(alert.product_id, n);
      toast.success(`Target updated to ${formatINR(n)}.`);
      onUpdated?.();
    } catch (err) {
      toast.error(err.message || 'Unable to update target.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await api.removeAlert(alert.product_id);
      toast.info('Alert removed.');
      onUpdated?.();
    } catch (err) {
      toast.error(err.message || 'Unable to remove alert.');
    }
  };

  const testPriceDrop = async () => {
    setDropping(true);
    try {
      const res = await api.triggerTestDrop(alert.product_id);
      toast.success(
        `Price updated to ${formatINR(res.price)}. Target of ${formatINR(target)} reached!`,
        'Target Alert Triggered!'
      );
      onUpdated?.();
    } catch (err) {
      toast.error(err.message || 'Unable to trigger test drop.');
    } finally {
      setDropping(false);
    }
  };

  return (
    <li className={`alert-card-item ${reached ? 'target-reached' : ''}`}>
      <div className="alert-product-cell">
        <ProductImage src={alert.product_image_url} alt={alert.product_name} platform={alert.product_platform} size="md" />
        <div className="alert-product-info">
          <div className="row gap-xs items-center mb-xs">
            <PlatformBadge platform={alert.product_platform} />
            {isPcPart && (
              <span className="badge badge-accent text-xs">
                <Icon name="cpu" size={11} /> PC Part
              </span>
            )}
            <DataSourceBadge isSimulated={alert.latest_is_simulated} size="sm" />
          </div>
          <Link to={`/products/${alert.product_id}`} className="alert-product-title">
            {alert.product_name}
          </Link>
          <div className="alert-current-price-row">
            <span className="text-xs muted">Current Store Price:</span>
            <strong className="text-sm">{latest != null ? formatINR(latest) : 'Pending scrape'}</strong>
            {latest != null && !reached && (
              <span className="text-xs muted">
                ({formatINR(latest - target)} above target)
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="alert-status-cell">
        <span className={`pill ${reached ? 'pill-good' : 'pill-accent'}`}>
          <Icon name={reached ? 'check' : 'bell'} size={12} />
          {reached ? 'Target Reached' : 'Watching'}
        </span>
      </div>

      <div className="alert-actions-cell">
        <div className="alert-input-box">
          <span className="input-currency">₹</span>
          <input
            type="number"
            min="1"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="Target price in rupees"
            className="alert-price-input"
          />
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={save}
          disabled={!dirty || saving}
          title="Save target price"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm trigger-btn"
          title="Simulate price drop below target to test notification"
          onClick={testPriceDrop}
          disabled={dropping}
        >
          <Icon name="sparkle" size={13} className={dropping ? 'spin' : ''} />
          {dropping ? 'Updating…' : 'Test Alert'}
        </button>
        <button
          type="button"
          className="icon-btn danger"
          aria-label="Remove alert"
          title="Remove alert"
          onClick={remove}
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
    </li>
  );
}

export default function AlertsPage() {
  const { dataVersion, refreshData } = useApp();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (err) {
      setError(err.message || 'Unable to load alerts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, dataVersion]);

  const triggeredCount = useMemo(() => alerts.filter((a) => a.is_triggered).length, [alerts]);
  const pcPartsCount = useMemo(
    () => alerts.filter((a) => (a.product_category || '').toLowerCase().includes('pc component')).length,
    [alerts]
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Price alerts & Thresholds</h1>
          <p className="muted">Set price targets and monitor automated real-time notifications.</p>
        </div>
      </div>

      {/* Summary KPI Bar */}
      {!loading && alerts.length > 0 && (
        <div className="alerts-kpi-bar">
          <div className="kpi-mini-card">
            <span className="kpi-mini-label">Active Monitored Alerts</span>
            <strong className="kpi-mini-val">{alerts.length}</strong>
          </div>
          <div className="kpi-mini-card">
            <span className="kpi-mini-label">Targets Reached</span>
            <strong className="kpi-mini-val text-good">{triggeredCount}</strong>
          </div>
          {pcPartsCount > 0 && (
            <div className="kpi-mini-card">
              <span className="kpi-mini-label">PC Build Components</span>
              <strong className="kpi-mini-val text-accent">{pcPartsCount}</strong>
            </div>
          )}
        </div>
      )}

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <div className="space-y-md">
          <Skeleton style={{ height: 80, borderRadius: 12 }} />
          <Skeleton style={{ height: 80, borderRadius: 12 }} />
        </div>
      ) : alerts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="bell"
            title="No price alerts set yet"
            action={<Link to="/dashboard" className="btn btn-primary btn-sm">Choose a product</Link>}
          >
            Open any product page, enter a target price, or track components from the PC Builder to monitor them here.
          </EmptyState>
        </div>
      ) : (
        <div className="alerts-list-wrapper">
          <ul className="alert-card-list">
            {alerts.map((a) => (
              <AlertRow
                key={a.id}
                alert={a}
                onUpdated={() => {
                  load();
                  refreshData();
                }}
              />
            ))}
          </ul>
          <p className="field-hint pad">
            Alert targets are persisted in PostgreSQL per user and evaluated automatically in real-time during product price updates.
          </p>
        </div>
      )}
    </>
  );
}

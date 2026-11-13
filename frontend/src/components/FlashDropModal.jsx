import { useState } from 'react';
import Modal from './Modal';
import Icon from './Icon';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { formatINR } from '../lib/format';

export default function FlashDropModal({ open, onClose, products = [], onSimulated }) {
  const toast = useToast();
  const [selectedId, setSelectedId] = useState(products[0]?.id || '');
  const [dropType, setDropType] = useState('10'); // '5', '10', '15', 'target'
  const [submitting, setSubmitting] = useState(false);

  // Sync selectedId if empty
  const activeProduct = products.find((p) => String(p.id) === String(selectedId)) || products[0];

  const handleApply = async () => {
    if (!activeProduct) {
      toast.error('Please select a product.');
      return;
    }

    setSubmitting(true);
    try {
      const forceDrop = dropType === 'target';
      const dropPercent = dropType === 'target' ? 10 : Number(dropType);
      const res = await api.simulatePrice(activeProduct.id, { forceDrop, dropPercent });

      toast.success(
        `Market price for "${activeProduct.name}" dropped to ${formatINR(res.price)}!${res.alertTriggered ? ' 🎯 TARGET ALERT TRIGGERED!' : ''}`,
        'Market Drop Applied'
      );
      onSimulated?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Unable to simulate market price drop.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={() => !submitting && onClose()} title="⚡ Real-Time Market Price Drop Simulator" size="md">
      <div className="flash-drop-modal">
        <p className="muted mb-md">
          Simulate an e-commerce flash sale or dynamic repricing event in real time. The selected product will record an immediate price drop in PostgreSQL, updating sparklines, charts, and triggering active target price alerts.
        </p>

        <div className="form-group mb-md">
          <label className="field-label block mb-xs">Select Target Product:</label>
          <div className="select" style={{ width: '100%' }}>
            <select
              value={selectedId || activeProduct?.id}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={submitting}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — Current: {p.latest_price != null ? formatINR(p.latest_price) : 'Pending'} ({p.platform.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group mb-lg">
          <label className="field-label block mb-xs">Choose Market Discount Scenario:</label>
          <div className="scenario-grid">
            <button
              type="button"
              className={`scenario-btn ${dropType === '5' ? 'active' : ''}`}
              onClick={() => setDropType('5')}
              disabled={submitting}
            >
              <span className="scenario-pct">-5%</span>
              <span className="scenario-label">Seasonal Sale</span>
            </button>
            <button
              type="button"
              className={`scenario-btn ${dropType === '10' ? 'active' : ''}`}
              onClick={() => setDropType('10')}
              disabled={submitting}
            >
              <span className="scenario-pct text-good">-10%</span>
              <span className="scenario-label">Festival Deal</span>
            </button>
            <button
              type="button"
              className={`scenario-btn ${dropType === '15' ? 'active' : ''}`}
              onClick={() => setDropType('15')}
              disabled={submitting}
            >
              <span className="scenario-pct text-good">-15%</span>
              <span className="scenario-label">Clearance Sale</span>
            </button>
            <button
              type="button"
              className={`scenario-btn ${dropType === 'target' ? 'active' : ''}`}
              onClick={() => setDropType('target')}
              disabled={submitting}
            >
              <span className="scenario-pct text-accent">🎯 ALERT</span>
              <span className="scenario-label">Drop Below Target</span>
            </button>
          </div>
        </div>

        {activeProduct && (
          <div className="card-mini-preview mb-md">
            <div className="row gap-sm items-center">
              <Icon name="sparkle" size={16} className="text-good" />
              <div>
                <strong>{activeProduct.name}</strong>
                <div className="text-xs muted">
                  Current: {activeProduct.latest_price != null ? formatINR(activeProduct.latest_price) : 'Pending'} · Platform: {activeProduct.platform}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="form-actions end">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleApply} disabled={submitting || !products.length}>
            <Icon name="sparkle" size={15} className={submitting ? 'spin' : ''} />
            {submitting ? 'Applying Drop…' : 'Apply Dynamic Market Drop'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

import { useState } from 'react';
import { api } from '../api';
import Icon from './Icon';

const PLATFORMS = [
  { id: 'amazon', label: 'Amazon' },
  { id: 'flipkart', label: 'Flipkart' },
];

function detectPlatform(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname === 'amazon.in' || hostname.endsWith('.amazon.in') || hostname === 'www.amazon.com' || hostname.endsWith('.amazon.com')) {
      return 'amazon';
    }
    if (hostname === 'flipkart.com' || hostname.endsWith('.flipkart.com')) return 'flipkart';
    return null;
  } catch {
    return null;
  }
}

const EMPTY = { name: '', url: '', platform: 'amazon', category: '', groupName: '' };

export default function AddProductForm({ onAdded, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const detectedPlatform = detectPlatform(form.url);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((cur) => ({
      ...cur,
      [name]: value,
      ...(name === 'url' && detectPlatform(value) ? { platform: detectPlatform(value) } : {}),
    }));
    if (name === 'url') setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const detected = detectPlatform(form.url);

    if (!detected) {
      setError('Enter a supported Amazon India (.amazon.in) or Flipkart (.flipkart.com) product URL.');
      return;
    }
    if (form.platform !== detected) {
      setError(`This URL belongs to ${detected === 'amazon' ? 'Amazon' : 'Flipkart'}. Select the matching store.`);
      return;
    }

    setLoading(true);
    try {
      await api.createProduct({
        ...form,
        name: form.name.trim(),
        url: form.url.trim(),
        category: form.category.trim(),
        groupName: form.groupName.trim() || form.name.trim(),
      });
      setForm(EMPTY);
      onAdded?.();
    } catch (err) {
      setError(err.message || 'Unable to add product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate={false}>
      <label className="field">
        <span className="field-label">Product URL</span>
        <input name="url" type="url" value={form.url} onChange={handleChange} placeholder="https://www.amazon.in/… or https://www.flipkart.com/…" required />
        {detectedPlatform && (
          <span className="field-hint ok">
            <Icon name="check" size={14} /> Detected {detectedPlatform === 'amazon' ? 'Amazon' : 'Flipkart'}
          </span>
        )}
      </label>

      <label className="field">
        <span className="field-label">Product name</span>
        <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. boAt Rockerz 450" required />
      </label>

      <div className="field">
        <span className="field-label">Store</span>
        <div className="segmented" role="radiogroup" aria-label="Store">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={form.platform === p.id}
              className={form.platform === p.id ? 'active' : ''}
              onClick={() => {
                setForm((c) => ({ ...c, platform: p.id }));
                setError('');
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-row">
        <label className="field">
          <span className="field-label">Group name</span>
          <input name="groupName" value={form.groupName} onChange={handleChange} placeholder="Same on Amazon + Flipkart" />
          <span className="field-hint">Use the same group to compare stores.</span>
        </label>
        <label className="field">
          <span className="field-label">Category</span>
          <input name="category" value={form.category} onChange={handleChange} placeholder="Electronics" />
        </label>
      </div>

      {error && (
        <p className="form-error" role="alert">
          <Icon name="alert" size={16} /> {error}
        </p>
      )}

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" /> Adding…
            </>
          ) : (
            'Start tracking'
          )}
        </button>
      </div>
    </form>
  );
}

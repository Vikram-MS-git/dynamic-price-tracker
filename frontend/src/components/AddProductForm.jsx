import { useState } from 'react';
import { api } from '../api';
import Icon from './Icon';

const PLATFORMS = [
  { id: 'amazon', label: 'Amazon' },
  { id: 'flipkart', label: 'Flipkart' },
];

// Mirrors the server's allowlist (backend/src/services/urlSafety.js). The server is the real gatekeeper.
const AMAZON_HOSTS = ['amazon.in', 'amazon.com'];
const AMAZON_SHORT = ['amzn.in', 'amzn.to', 'a.co'];
const FLIPKART_HOSTS = ['flipkart.com'];
const FLIPKART_SHORT = ['fkrt.it'];
const inDomain = (host, d) => host === d || host.endsWith(`.${d}`);

function detectPlatform(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return null;
    const hostname = u.hostname.toLowerCase().replace(/\.$/, '');
    if (AMAZON_HOSTS.some((d) => inDomain(hostname, d)) || AMAZON_SHORT.includes(hostname)) return 'amazon';
    if (FLIPKART_HOSTS.some((d) => inDomain(hostname, d)) || FLIPKART_SHORT.includes(hostname)) return 'flipkart';
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
      setError('Enter an https:// product link from Amazon (amazon.in / amazon.com) or Flipkart (flipkart.com).');
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

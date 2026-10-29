
import { useState } from 'react';
import { api } from '../api';

const PLATFORMS = [
  { id: 'amazon', label: 'Amazon', icon: '🛒' },
  { id: 'flipkart', label: 'Flipkart', icon: '🛍️' },
];

function detectPlatform(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (
      hostname === 'amazon.in' ||
      hostname.endsWith('.amazon.in') ||
      hostname === 'www.amazon.com' ||
      hostname.endsWith('.amazon.com')
    ) {
      return 'amazon';
    }

    if (
      hostname === 'flipkart.com' ||
      hostname.endsWith('.flipkart.com')
    ) {
      return 'flipkart';
    }

    return null;
  } catch {
    return null;
  }
}

export default function AddProductForm({ onAdded }) {
  const [form, setForm] = useState({
    name: '',
    url: '',
    platform: 'amazon',
    category: '',
    groupName: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const detectedPlatform = detectPlatform(form.url);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'url' && detectPlatform(value)
        ? { platform: detectPlatform(value) }
        : {}),
    }));

    if (name === 'url') {
      setError('');
    }
  };

  const setPlatform = (platform) => {
    setForm((current) => ({ ...current, platform }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const detected = detectPlatform(form.url);

    if (!detected) {
      setError(
        'Please enter a supported Amazon India (.amazon.in) or Flipkart (.flipkart.com) product URL.'
      );
      return;
    }

    if (form.platform !== detected) {
      setError(
        `This URL belongs to ${detected === 'amazon' ? 'Amazon' : 'Flipkart'}. Please select the correct platform.`
      );
      return;
    }

    setLoading(true);

    try {
      const body = {
        ...form,
        name: form.name.trim(),
        url: form.url.trim(),
        category: form.category.trim(),
        groupName: form.groupName.trim() || form.name.trim(),
      };

      await api.createProduct(body);

      setForm({
        name: '',
        url: '',
        platform: 'amazon',
        category: '',
        groupName: '',
      });

      onAdded?.();
    } catch (err) {
      setError(err.message || 'Unable to add product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="add-product-section">
      <div className="section-head">
        <span className="section-icon">✨</span>
        <div>
          <h2>Track a new product</h2>
          <p className="muted">
            Paste a store link — we fetch price and image when supported.
          </p>
        </div>
      </div>

      <form className="add-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="form-field span-2">
            <span>Product name</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. boAt Rockerz 450"
              required
            />
          </label>

          <label className="form-field span-2">
            <span>Product URL</span>
            <input
              name="url"
              type="url"
              value={form.url}
              onChange={handleChange}
              placeholder="https://www.amazon.in/... or https://www.flipkart.com/..."
              required
            />
          </label>

          <div className="form-field span-2">
            <span>Platform</span>

            <div className="platform-pills">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`platform-pill ${
                    form.platform === p.id ? 'active' : ''
                  }`}
                  data-platform={p.id}
                  onClick={() => setPlatform(p.id)}
                >
                  <span className="pill-icon">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>

            {detectedPlatform && (
              <p className="muted">
                Detected platform:{' '}
                <strong>
                  {detectedPlatform === 'amazon' ? 'Amazon' : 'Flipkart'}
                </strong>
              </p>
            )}
          </div>

          <label className="form-field">
            <span>Group name</span>
            <input
              name="groupName"
              value={form.groupName}
              onChange={handleChange}
              placeholder="Same for Amazon + Flipkart"
            />
          </label>

          <label className="form-field">
            <span>Category</span>
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Electronics"
            />
          </label>
        </div>

        {error && <p className="error">{error}</p>}

        <button
          type="submit"
          className="btn-primary btn-glow"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" /> Adding product…
            </>
          ) : (
            '+ Start tracking'
          )}
        </button>
      </form>
    </section>
  );
}

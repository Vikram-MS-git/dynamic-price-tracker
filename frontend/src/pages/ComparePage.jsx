import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import CompareChart from '../components/CompareChart';
import CompareInsights from '../components/CompareInsights';
import ProductImage from '../components/ProductImage';

function formatPrice(v) {
  if (v == null) return '—';
  return `₹${Number(v).toLocaleString('en-IN')}`;
}

function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState(searchParams.get('group') || '');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [compare, setCompare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.getGroups();
        setGroups(data);
        if (data.length && !groupId) {
          setGroupId(String(data[0].id));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadCompare = useCallback(async () => {
    if (!groupId) return;
    setLoadingCompare(true);
    setError('');
    try {
      const params = {};
      if (from) params.from = new Date(from).toISOString();
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        params.to = end.toISOString();
      }
      const data = await api.compareGroup(groupId, params);
      setCompare(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingCompare(false);
    }
  }, [groupId, from, to]);

  useEffect(() => {
    if (groupId) loadCompare();
  }, [groupId, loadCompare]);

  const setRange = (days) => {
    if (days == null) {
      setFrom('');
      setTo('');
    } else {
      setFrom(daysAgoISO(days));
      setTo(new Date().toISOString().slice(0, 10));
    }
  };

  const selectedGroup = groups.find((g) => String(g.id) === String(groupId));

  if (loading) return <p className="loading-pulse">Loading groups…</p>;

  return (
    <>
      <Link to="/" className="back-link">
        ← Back to list
      </Link>
      <div className="card">
        <h2>Cross-platform compare (RQ1)</h2>
        <p className="muted">
          Compare price fluctuations for the same product on Amazon vs Flipkart.
        </p>

        {groups.length === 0 ? (
          <p>
            No product groups yet. Add products with the same <strong>Group name</strong> on
            different platforms.
          </p>
        ) : (
          <>
            <div className="group-picker">
              {groups.map((g) => {
                const products = g.products ?? [];
                const platforms = products.map((p) => p.platform).join(' + ') || '—';
                const active = String(g.id) === String(groupId);
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={`group-card ${active ? 'active' : ''}`}
                    onClick={() => setGroupId(String(g.id))}
                  >
                    <strong>{g.name}</strong>
                    {g.category && <span className="muted"> · {g.category}</span>}
                    <div className="group-card-meta">{platforms}</div>
                  </button>
                );
              })}
            </div>

            <div className="filter-row">
              <label>
                From
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </label>
              <label>
                To
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </label>
              <div className="preset-btns">
                <button type="button" className="secondary" onClick={() => setRange(7)}>
                  7 days
                </button>
                <button type="button" className="secondary" onClick={() => setRange(14)}>
                  14 days
                </button>
                <button type="button" className="secondary" onClick={() => setRange(null)}>
                  All
                </button>
              </div>
              <button type="button" onClick={loadCompare} disabled={loadingCompare}>
                {loadingCompare ? 'Loading…' : 'Apply'}
              </button>
            </div>

            {error && <p className="error">{error}</p>}

            {loadingCompare && <p className="loading-pulse">Updating chart…</p>}

            {compare && !loadingCompare && (
              <>
                <CompareInsights stats={compare.stats} />

                {selectedGroup?.products?.length > 0 && (
                  <div className="live-prices-row">
                    {selectedGroup.products.map((p) => (
                      <a
                        key={p.id}
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="live-price-chip"
                      >
                        <ProductImage
                          src={p.image_url}
                          alt={p.name}
                          platform={p.platform}
                          size="md"
                        />
                        <span className={`badge badge-${p.platform}`}>{p.platform}</span>
                        {p.latest_price != null
                          ? formatPrice(p.latest_price)
                          : 'No price yet'}
                      </a>
                    ))}
                  </div>
                )}

                <div className="card inner-card">
                  <h3>{compare.group.name}</h3>
                  <CompareChart series={compare.series} />
                </div>

                {compare.stats?.length > 0 && (
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>Platform</th>
                        <th>Min</th>
                        <th>Max</th>
                        <th>Avg</th>
                        <th>Std dev</th>
                        <th>% change</th>
                        <th>Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compare.stats.map((row) => (
                        <tr key={row.platform}>
                          <td>
                            <span className="badge">{row.platform}</span>
                          </td>
                          <td>{formatPrice(row.min)}</td>
                          <td>{formatPrice(row.max)}</td>
                          <td>{formatPrice(row.avg)}</td>
                          <td>{row.stdDev != null ? row.stdDev : '—'}</td>
                          <td>
                            {row.pctChange != null
                              ? `${row.pctChange > 0 ? '+' : ''}${row.pctChange}%`
                              : '—'}
                          </td>
                          <td>{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}

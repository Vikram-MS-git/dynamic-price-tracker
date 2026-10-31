import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import { formatINR, formatPct } from '../lib/format';
import CompareChart from '../components/CompareChart';
import CompareInsights from '../components/CompareInsights';
import Icon from '../components/Icon';
import PlatformBadge from '../components/PlatformBadge';
import ProductImage from '../components/ProductImage';
import { EmptyState, ErrorState, Skeleton } from '../components/States';

function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const { openTrack, dataVersion } = useApp();
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState(searchParams.get('group') || '');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [compare, setCompare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [error, setError] = useState('');

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getGroups();
      setGroups(data);
      setGroupId((cur) => (cur || !data.length ? cur : String(data[0].id)));
    } catch (err) {
      setError(err.message || 'Unable to load groups.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups, dataVersion]);

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
      setCompare(await api.compareGroup(groupId, params));
    } catch (err) {
      setError(err.message || 'Unable to load comparison.');
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
  const rangeKey = !from && !to ? 'all' : from === daysAgoISO(7) ? '7' : from === daysAgoISO(14) ? '14' : 'custom';

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Compare stores</h1>
          <p className="muted">See how the same product’s price moves on Amazon and Flipkart.</p>
        </div>
      </div>

      {loading ? (
        <div className="card"><Skeleton style={{ height: 90, marginBottom: 14 }} /><Skeleton style={{ height: 280 }} /></div>
      ) : error && !groups.length ? (
        <ErrorState message={error} onRetry={loadGroups} />
      ) : groups.length === 0 ? (
        <div className="card">
          <EmptyState icon="compare" title="No product groups yet" action={<button type="button" className="btn btn-primary btn-sm" onClick={openTrack}><Icon name="plus" size={15} strokeWidth={2.2} /> Track a product</button>}>
            Track the same product on both stores using the same group name to compare them here.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="group-picker" role="listbox" aria-label="Product groups">
            {groups.map((g) => {
              const platforms = (g.products ?? []).map((p) => p.platform);
              const active = String(g.id) === String(groupId);
              return (
                <button key={g.id} type="button" role="option" aria-selected={active} className={`group-card ${active ? 'active' : ''}`} onClick={() => setGroupId(String(g.id))}>
                  <strong>{g.name}</strong>
                  <span className="muted">{g.category || 'Uncategorised'}</span>
                  <span className="group-card-stores">
                    {platforms.length ? platforms.map((p, i) => <PlatformBadge key={`${p}-${i}`} platform={p} />) : <span className="muted">No products</span>}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="card filter-card">
            <div className="range-row">
              <label className="field-inline"><span>From</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
              <label className="field-inline"><span>To</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
              <div className="segmented" role="group" aria-label="Quick range">
                <button type="button" aria-pressed={rangeKey === '7'} className={rangeKey === '7' ? 'active' : ''} onClick={() => setRange(7)}>7 days</button>
                <button type="button" aria-pressed={rangeKey === '14'} className={rangeKey === '14' ? 'active' : ''} onClick={() => setRange(14)}>14 days</button>
                <button type="button" aria-pressed={rangeKey === 'all'} className={rangeKey === 'all' ? 'active' : ''} onClick={() => setRange(null)}>All</button>
              </div>
            </div>
          </div>

          {error && <ErrorState message={error} onRetry={loadCompare} />}

          {loadingCompare && !compare ? (
            <div className="card"><Skeleton style={{ height: 320 }} /></div>
          ) : (
            compare && (
              <div className={`compare-body ${loadingCompare ? 'dim' : ''}`}>
                <CompareInsights stats={compare.stats} />

                {selectedGroup?.products?.length > 0 && (
                  <div className="live-prices">
                    {selectedGroup.products.map((p) => (
                      <Link key={p.id} to={`/products/${p.id}`} className="live-price">
                        <ProductImage src={p.image_url} alt={p.name} platform={p.platform} size="sm" />
                        <div>
                          <PlatformBadge platform={p.platform} />
                          <strong className="price">{p.latest_price != null ? formatINR(p.latest_price) : 'No price yet'}</strong>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <div className="card">
                  <div className="card-head"><div><h2>{compare.group.name}</h2><p className="muted">Price over time by store</p></div></div>
                  <CompareChart series={compare.series} />
                </div>

                {compare.stats?.length > 0 && (
                  <section className="card table-card">
                    <div className="card-head"><div><h2>Statistics</h2><p className="muted">For the selected period</p></div></div>
                    <div className="table-wrap always">
                      <table className="table">
                        <thead>
                          <tr><th>Store</th><th className="num">Min</th><th className="num">Max</th><th className="num">Avg</th><th className="num">Std dev</th><th className="num">% change</th><th className="num">Points</th></tr>
                        </thead>
                        <tbody>
                          {compare.stats.map((row) => (
                            <tr key={row.platform}>
                              <td><PlatformBadge platform={row.platform} /></td>
                              <td className="num">{formatINR(row.min)}</td>
                              <td className="num">{formatINR(row.max)}</td>
                              <td className="num">{formatINR(row.avg)}</td>
                              <td className="num">{row.stdDev != null ? row.stdDev : '—'}</td>
                              <td className="num">
                                {row.pctChange != null ? (
                                  <span className={`change change-${row.pctChange < 0 ? 'down' : row.pctChange > 0 ? 'up' : 'flat'}`}>{formatPct(row.pctChange)}</span>
                                ) : '—'}
                              </td>
                              <td className="num">{row.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </div>
            )
          )}
        </>
      )}
    </>
  );
}

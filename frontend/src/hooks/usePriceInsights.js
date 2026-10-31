import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { summarizePrices } from '../lib/insights';

// Loads price history for each tracked product (existing endpoint) and
// summarises it. Re-runs only when a product's latest reading changes.
export function usePriceInsights(products) {
  const [insights, setInsights] = useState({});
  const [loading, setLoading] = useState(false);

  const signature = useMemo(
    () => products.map((p) => `${p.id}:${p.last_scraped_at || ''}:${p.latest_price ?? ''}`).join('|'),
    [products]
  );

  useEffect(() => {
    let cancelled = false;
    if (!products.length) {
      setInsights({});
      return undefined;
    }
    setLoading(true);
    Promise.allSettled(products.map((p) => api.getProductPrices(p.id))).then((results) => {
      if (cancelled) return;
      const next = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') next[products[i].id] = summarizePrices(r.value.prices);
      });
      setInsights(next);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return { insights, loading };
}

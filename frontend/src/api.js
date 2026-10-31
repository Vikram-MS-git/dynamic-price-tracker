const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || data.details?.join?.(', ') || res.statusText;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  getProducts: () => request('/products'),
  createProduct: (body) =>
    request('/products', { method: 'POST', body: JSON.stringify(body) }),
  getProduct: (id) => request(`/products/${id}`),
  getProductPrices: (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products/${id}/prices${qs ? `?${qs}` : ''}`);
  },
  scrapeAll: () => request('/products/scrape-all', { method: 'POST' }),
  scrapeProduct: (id) => request(`/products/${id}/scrape`, { method: 'POST' }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  getGroups: () => request('/groups'),
  compareGroup: (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/groups/${id}/compare${qs ? `?${qs}` : ''}`);
  },
  getDashboard: () => request('/analytics/dashboard'),
  getHealth: () => request('/health'),
};

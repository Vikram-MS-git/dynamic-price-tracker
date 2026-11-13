const API_BASE = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'dpt.token';

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable: the session lasts until reload */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

// AuthContext registers this so an expired/invalid token logs the user out.
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(path, options = {}) {
  const { headers, auth = true, ...rest } = options;
  const token = tokenStore.get();
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && auth && token) onUnauthorized?.();
    // Prefer the specific reasons (e.g. which field is wrong) over a generic "Validation failed".
    const details = Array.isArray(data.details) ? data.details.filter(Boolean) : [];
    const msg = details.length ? details.join(' ') : data.error || res.statusText;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body), auth: false }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body), auth: false }),
  me: () => request('/auth/me'),
  updateMe: (body) => request('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),
  changePassword: (body) => request('/auth/password', { method: 'PUT', body: JSON.stringify(body) }),
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
  updateGroup: (id, body) => request(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteGroup: (id) => request(`/groups/${id}`, { method: 'DELETE' }),
  assignProductGroup: (groupId, productId) => request(`/groups/${groupId}/assign`, { method: 'POST', body: JSON.stringify({ productId }) }),
  compareGroup: (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/groups/${id}/compare${qs ? `?${qs}` : ''}`);
  },
  getDashboard: () => request('/analytics/dashboard'),
  getHealth: () => request('/health'),

  // Server-side Persistent Price Alerts
  getAlerts: () => request('/alerts'),
  setAlert: (productId, targetPrice) => request('/alerts', { method: 'POST', body: JSON.stringify({ productId, targetPrice }) }),
  removeAlert: (productId) => request(`/alerts/${productId}`, { method: 'DELETE' }),
  triggerTestDrop: (productId) => request(`/alerts/${productId}/trigger-test-drop`, { method: 'POST' }),

  // Academic Demo Engine
  seedDemoDataset: () => request('/demo/seed', { method: 'POST' }),
  resetDemoDataset: () => request('/demo/reset', { method: 'POST' }),
  simulatePrice: (productId, body = {}) => request(`/demo/simulate/${productId}`, { method: 'POST', body: JSON.stringify(body) }),
  simulateHistory: (productId, body = {}) => request(`/demo/simulate-history/${productId}`, { method: 'POST', body: JSON.stringify(body) }),

  // PC Builder & Recommendation
  getPcCatalog: () => request('/pc-builder/catalog'),
  checkPcCompatibility: (components) => request('/pc-builder/check-compatibility', { method: 'POST', body: JSON.stringify({ components }) }),
  getBuildRecommendations: (preferences) => request('/pc-builder/recommendations', { method: 'POST', body: JSON.stringify(preferences) }),
  getPcBuilds: () => request('/pc-builder/builds'),
  getPcBuild: (id) => request(`/pc-builder/builds/${id}`),
  savePcBuild: (body) => request('/pc-builder/builds', { method: 'POST', body: JSON.stringify(body) }),
  updatePcBuild: (id, body) => request(`/pc-builder/builds/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePcBuild: (id) => request(`/pc-builder/builds/${id}`, { method: 'DELETE' }),
  trackPcBuildInTracker: (body) => request('/pc-builder/track', { method: 'POST', body: JSON.stringify(body) }),
};

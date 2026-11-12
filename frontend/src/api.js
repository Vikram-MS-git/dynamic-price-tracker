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
    const msg = data.error || data.details?.join?.(', ') || res.statusText;
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
  compareGroup: (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/groups/${id}/compare${qs ? `?${qs}` : ''}`);
  },
  getDashboard: () => request('/analytics/dashboard'),
  getHealth: () => request('/health'),
};

import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import Icon from './Icon';
import ThemeToggle from './ThemeToggle';
import Modal from './Modal';
import AddProductForm from './AddProductForm';
import { useToast } from '../context/ToastContext';

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/compare', label: 'Compare', icon: 'compare' },
  { to: '/alerts', label: 'Price alerts', icon: 'bell', badge: true },
];

function useApiStatus() {
  const [status, setStatus] = useState('checking');
  useEffect(() => {
    let alive = true;
    const check = () =>
      api
        .getHealth()
        .then(() => alive && setStatus('online'))
        .catch(() => alive && setStatus('offline'));
    check();
    const t = setInterval(check, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  return status;
}

function GlobalSearch() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const value = location.pathname === '/' ? params.get('q') || '' : '';

  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const onChange = (e) => {
    const q = e.target.value;
    if (location.pathname !== '/') {
      navigate(q ? `/?q=${encodeURIComponent(q)}` : '/');
      return;
    }
    const next = new URLSearchParams(params);
    if (q) next.set('q', q);
    else next.delete('q');
    setParams(next, { replace: true });
  };

  return (
    <label className="search">
      <Icon name="search" size={16} />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={onChange}
        placeholder="Search products, stores, categories"
        aria-label="Search tracked products"
      />
      <kbd>/</kbd>
    </label>
  );
}

export default function AppShell({ children }) {
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();
  const { trackOpen, openTrack, closeTrack, notifyProductAdded, alerts } = useApp();
  const toast = useToast();
  const status = useApiStatus();
  const alertCount = Object.keys(alerts).length;

  useEffect(() => setDrawer(false), [location.pathname]);

  return (
    <div className={`shell ${drawer ? 'drawer-open' : ''}`}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar" aria-label="Primary">
        <div className="brand">
          <div className="brand-mark">
            <Icon name="chart" size={16} strokeWidth={2.2} />
          </div>
          <span className="brand-name">PriceTracker</span>
        </div>

        <nav className="nav">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon name={item.icon} />
              <span className="nav-label">{item.label}</span>
              {item.badge && alertCount > 0 && <span className="nav-badge">{alertCount}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className={`status status-${status}`} title="Backend API connection">
            <span className="status-dot" />
            <span className="nav-label">
              {status === 'online' ? 'API connected' : status === 'offline' ? 'API unreachable' : 'Checking API…'}
            </span>
          </div>
        </div>
      </aside>
      <div className="scrim" onClick={() => setDrawer(false)} aria-hidden="true" />

      <div className="main-col">
        <header className="topbar">
          <button type="button" className="icon-btn menu-btn" aria-label="Open navigation" onClick={() => setDrawer(true)}>
            <Icon name="menu" />
          </button>
          <GlobalSearch />
          <div className="topbar-actions">
            <ThemeToggle />
            <button type="button" className="btn btn-primary" onClick={openTrack}>
              <Icon name="plus" size={16} strokeWidth={2.2} />
              <span className="btn-label">Track New Product</span>
            </button>
          </div>
        </header>

        <main id="main" className="content">
          {children}
        </main>
      </div>

      <Modal
        open={trackOpen}
        onClose={closeTrack}
        title="Track a new product"
        description="Paste an Amazon.in or Flipkart product link. We fetch the price and image when the store allows it."
      >
        <AddProductForm
          onCancel={closeTrack}
          onAdded={() => {
            closeTrack();
            toast.success('Tracking started. The first price appears once the initial fetch completes.', 'Product added');
            notifyProductAdded();
          }}
        />
      </Modal>
    </div>
  );
}

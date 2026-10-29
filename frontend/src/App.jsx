import { NavLink, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import ComparePage from './pages/ComparePage';
import ThemeToggle from './components/ThemeToggle';

export default function App() {
  return (
    <div className="app">
      <header className="site-header">
        <div className="header-glow" aria-hidden />
        <div className="header-inner">
          <div className="brand">
            <div className="brand-mark">
              <span className="brand-icon">📈</span>
            </div>
            <div>
              <h1>
                Dynamic <span className="brand-accent">Price</span> Tracker
              </h1>
              <p className="brand-tagline">
                Smart price intelligence for Amazon & Flipkart India
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="nav-icon">🏠</span> Dashboard
          </NavLink>
          <NavLink to="/compare" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="nav-icon">⚖️</span> Compare
          </NavLink>
        </nav>
      </header>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import ThemeToggle from '../components/ThemeToggle';

const FEATURES = [
  { icon: 'cpu', title: 'Custom PC Builder', text: 'Build and configure full desktop rigs component-by-component with socket & DDR compatibility checks, wattage estimation, and dual-store deals.' },
  { icon: 'package', title: 'Track any product', text: 'Paste an Amazon.in or Flipkart link and we start recording its price.' },
  { icon: 'compare', title: 'Compare stores', text: 'Group the same item from both stores and see which one fluctuates more.' },
  { icon: 'chart', title: 'Price history', text: 'Charts and statistics (min, max, average, volatility) for every product.' },
  { icon: 'bell', title: 'Price alerts', text: 'Set a target price and get notified the moment it is reached.' },
  { icon: 'shield', title: 'Your own workspace', text: 'Each account has private products, groups and alerts, separate from everyone else.' },
];

const STEPS = [
  { n: 1, title: 'Create an account', text: 'Sign up with your email. It takes under a minute.' },
  { n: 2, title: 'Add products', text: 'Paste product links from Amazon and Flipkart.' },
  { n: 3, title: 'Watch the prices', text: 'Review trends, compare stores, and buy at the right time.' },
];

// Illustrative only: hand-drawn sample data, not real prices. SVG y grows downward,
// so increasing numbers draw a falling price.
const AMAZON = [36, 43, 40, 47, 44, 52, 49, 60, 58, 62];
const FLIPKART = [38, 41, 48, 46, 52, 50, 57, 55, 64, 66];
const toPoints = (arr) => arr.map((y, i) => `${(i / (arr.length - 1)) * 300},${y}`).join(' ');

function HeroChart() {
  return (
    <div className="hero-card card" aria-hidden="true">
      <div className="hero-card-head">
        <div>
          <h3>Wireless earbuds</h3>
          <p className="muted">Amazon vs Flipkart · last 14 days</p>
        </div>
        <span className="hero-pill">Illustrative example</span>
      </div>
      <svg viewBox="0 0 300 80" preserveAspectRatio="none" className="hero-svg">
        {[20, 40, 60].map((y) => (
          <line key={y} x1="0" x2="300" y1={y} y2={y} className="hero-grid" />
        ))}
        <polyline points={toPoints(AMAZON)} fill="none" stroke="var(--amazon)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <polyline points={toPoints(FLIPKART)} fill="none" stroke="var(--flipkart)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="hero-legend">
        <span><i style={{ background: 'var(--amazon)' }} /> Amazon</span>
        <span><i style={{ background: 'var(--flipkart)' }} /> Flipkart</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="landing">
      <a href="#features" className="skip-link">Skip to content</a>
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="brand">
            <div className="brand-mark"><Icon name="chart" size={16} strokeWidth={2.2} /></div>
            <span className="brand-name">PriceTracker</span>
          </Link>
          <nav className="landing-links" aria-label="Page sections">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
          </nav>
          <div className="landing-actions">
            <ThemeToggle />
            {user ? (
              <Link to="/dashboard" className="btn btn-primary">Go to dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">Log in</Link>
                <Link to="/register" className="btn btn-primary">Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="eyebrow">Amazon India · Flipkart · Custom PC Builder</span>
            <h1>Smart Price Tracking & Custom PC Builder.</h1>
            <p className="lead">
              Track product prices across Amazon and Flipkart, monitor automated price-drop alerts,
              and build custom PC configurations with real-time hardware compatibility & wattage checks.
            </p>
            <div className="landing-cta">
              {user ? (
                <>
                  <Link to="/dashboard" className="btn btn-primary btn-lg">Open your dashboard</Link>
                  <Link to="/pc-builder" className="btn btn-secondary btn-lg">Launch PC Builder</Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">Create free account</Link>
                  <Link to="/login" className="btn btn-secondary btn-lg">Log in</Link>
                </>
              )}
            </div>
          </div>
          <HeroChart />
        </section>

        <section id="features" className="landing-section">
          <div className="section-head">
            <h2>Everything you need to shop smarter</h2>
            <p className="muted">Simple tools for following prices without refreshing product pages.</p>
          </div>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <article key={f.title} className="feature card">
                <div className="feature-icon"><Icon name={f.icon} size={20} /></div>
                <h3>{f.title}</h3>
                <p className="muted">{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how" className="landing-section">
          <div className="section-head">
            <h2>How it works</h2>
          </div>
          <ol className="steps">
            {STEPS.map((s) => (
              <li key={s.n} className="step card">
                <span className="step-n">{s.n}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p className="muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {!user && (
          <section className="landing-band">
            <h2>Ready to start tracking?</h2>
            <p>Create your account and add your first product.</p>
            <Link to="/register" className="btn btn-primary btn-lg">Get started</Link>
          </section>
        )}
      </main>

      <footer className="landing-foot">
        <span>© {new Date().getFullYear()} Dynamic Price Tracker</span>
        <span className="muted">Academic project. Prices are read from public product pages where the store allows it.</span>
      </footer>
    </div>
  );
}

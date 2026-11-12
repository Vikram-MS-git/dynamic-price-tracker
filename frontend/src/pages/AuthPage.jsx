import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import ThemeToggle from '../components/ThemeToggle';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function PasswordField({ id, label, value, onChange, autoComplete, hint, invalid }) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          id={id}
          name={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          required
        />
        <button
          type="button"
          className="icon-btn input-affix"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
        >
          <Icon name={show ? 'eyeOff' : 'eye'} size={16} />
        </button>
      </div>
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const validate = () => {
    if (isRegister && form.name.trim().length < 2) return 'Enter your name (at least 2 characters).';
    if (!EMAIL_RE.test(form.email.trim())) return 'Enter a valid email address.';
    if (isRegister) {
      if (form.password.length < 8) return 'Password must be at least 8 characters.';
      if (form.password !== form.confirm) return 'Passwords do not match.';
    } else if (!form.password) {
      return 'Enter your password.';
    }
    return '';
  };

  const submit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (isRegister) await register(form.name.trim(), form.email.trim(), form.password);
      else await login(form.email.trim(), form.password);
      // GuestOnly redirects to the dashboard (or the page they were sent from) once the user is set.
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-aside" aria-hidden="true">
        <Link to="/" className="brand brand-on-accent" tabIndex={-1}>
          <div className="brand-mark"><Icon name="chart" size={16} strokeWidth={2.2} /></div>
          <span className="brand-name">PriceTracker</span>
        </Link>
        <div className="auth-aside-body">
          <h2>Your prices.<br />Your account.</h2>
          <p>Every account gets its own private workspace: your products, comparisons and alerts stay yours.</p>
          <ul>
            <li><Icon name="compare" size={16} /> Compare Amazon and Flipkart over time</li>
            <li><Icon name="bell" size={16} /> Set target prices and get notified</li>
            <li><Icon name="shield" size={16} /> Separate data for every user</li>
          </ul>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-top">
          <Link to="/" className="back-link"><Icon name="arrowLeft" size={16} /> Home</Link>
          <ThemeToggle />
        </div>

        <div className="auth-card">
          <div className="auth-head">
            <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
            <p className="muted">
              {isRegister ? 'Start tracking prices in under a minute.' : 'Log in to see your tracked products.'}
            </p>
          </div>

          <form className="form" onSubmit={submit} noValidate>
            {error && (
              <div className="form-error" role="alert">
                <Icon name="alert" size={16} />
                <span>{error}</span>
              </div>
            )}

            {isRegister && (
              <div className="field">
                <label className="field-label" htmlFor="name">Full name</label>
                <input id="name" name="name" type="text" value={form.name} onChange={set} autoComplete="name" autoFocus required />
              </div>
            )}

            <div className="field">
              <label className="field-label" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                value={form.email}
                onChange={set}
                autoComplete="email"
                autoFocus={!isRegister}
                placeholder="you@example.com"
                required
              />
            </div>

            <PasswordField
              id="password"
              label="Password"
              value={form.password}
              onChange={set}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              hint={isRegister ? 'At least 8 characters.' : null}
            />

            {isRegister && (
              <PasswordField
                id="confirm"
                label="Confirm password"
                value={form.confirm}
                onChange={set}
                autoComplete="new-password"
                invalid={!!form.confirm && form.confirm !== form.password}
              />
            )}

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? (isRegister ? 'Creating account…' : 'Logging in…') : isRegister ? 'Create account' : 'Log in'}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? (
              <>Already have an account? <Link to="/login" state={location.state}>Log in</Link></>
            ) : (
              <>New here? <Link to="/register" state={location.state}>Create an account</Link></>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}

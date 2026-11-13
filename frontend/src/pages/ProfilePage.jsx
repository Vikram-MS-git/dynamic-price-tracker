import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, tokenStore } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

function Banner({ error }) {
  if (!error) return null;
  return (
    <div className="form-error" role="alert">
      <Icon name="alert" size={16} />
      <span>{error}</span>
    </div>
  );
}

function DetailsForm() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, email: user.email });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dirty = form.name.trim() !== user.name || form.email.trim().toLowerCase() !== user.email;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const u = await updateProfile({ name: form.name.trim(), email: form.email.trim() });
      setForm({ name: u.name, email: u.email });
      toast.success('Your details were saved.', 'Profile updated');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card">
      <div className="card-head"><div><h2>Personal details</h2><p className="muted">Your name and the email you log in with.</p></div></div>
      <form className="form" onSubmit={submit}>
        <Banner error={error} />
        <div className="form-row">
          <div className="field">
            <label className="field-label" htmlFor="p-name">Full name</label>
            <input id="p-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" required />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="p-email">Email</label>
            <input id="p-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" required />
          </div>
        </div>
        <div className="form-actions start">
          <button type="submit" className="btn btn-primary" disabled={saving || !dirty}>
            {saving && <span className="spinner" />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </section>
  );
}

function PasswordForm() {
  const toast = useToast();
  const empty = { currentPassword: '', newPassword: '', confirm: '' };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 8) return setError('New password must be at least 8 characters.');
    if (form.newPassword !== form.confirm) return setError('New passwords do not match.');
    setSaving(true);
    setError('');
    try {
      const res = await api.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      // The server signs out every other session; this one gets a fresh token and stays logged in.
      if (res.token) tokenStore.set(res.token);
      setForm(empty);
      toast.success('Other devices were signed out. Use your new password next time you log in.', 'Password changed');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card">
      <div className="card-head"><div><h2>Change password</h2><p className="muted">Choose a password you do not use elsewhere.</p></div></div>
      <form className="form" onSubmit={submit}>
        <Banner error={error} />
        <div className="field">
          <label className="field-label" htmlFor="currentPassword">Current password</label>
          <input id="currentPassword" name="currentPassword" type="password" value={form.currentPassword} onChange={set} autoComplete="current-password" required />
        </div>
        <div className="form-row">
          <div className="field">
            <label className="field-label" htmlFor="newPassword">New password</label>
            <input id="newPassword" name="newPassword" type="password" value={form.newPassword} onChange={set} autoComplete="new-password" required />
            <span className="field-hint">At least 8 characters.</span>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="confirm">Confirm new password</label>
            <input id="confirm" name="confirm" type="password" value={form.confirm} onChange={set} autoComplete="new-password" required />
          </div>
        </div>
        <div className="form-actions start">
          <button type="submit" className="btn btn-primary" disabled={saving || !form.currentPassword || !form.newPassword}>
            {saving && <span className="spinner" />}
            {saving ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </section>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let alive = true;
    api.me().then(({ user: u }) => alive && setStats(u.stats)).catch(() => {});
    return () => { alive = false; };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const items = [
    { label: 'Products tracked', value: stats?.products },
    { label: 'Product groups', value: stats?.groups },
    { label: 'Price points', value: stats?.price_points },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Profile</h1>
          <p className="muted">Manage your account. Your products and alerts are visible only to you.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleLogout}>
          <Icon name="logout" size={16} /> Log out
        </button>
      </div>

      <div className="profile-grid">
        <aside className="card profile-summary">
          <Avatar name={user.name} size={72} />
          <h2>{user.name}</h2>
          <p className="muted">{user.email}</p>
          {user.created_at && <p className="muted">Member since {formatDate(user.created_at)}</p>}
          <dl className="profile-stats">
            {items.map((i) => (
              <div key={i.label}>
                <dt>{i.label}</dt>
                <dd>{i.value == null ? '–' : Number(i.value).toLocaleString('en-IN')}</dd>
              </div>
            ))}
          </dl>
        </aside>

        <div className="profile-forms">
          <DetailsForm />
          <PasswordForm />
        </div>
      </div>
    </>
  );
}

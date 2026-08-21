import { useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import GoogleSignInButton from './GoogleSignInButton';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function safeNext() {
    const next = searchParams.get('next') || '';
    return next.startsWith('/oauth/authorize?') ? next : '';
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Login failed');
    const next = safeNext();
    if (next) {
      window.location.assign(next);
      return;
    }
    navigate(data.role === 'admin' ? '/admin' : data.role === 'team' ? '/team' : '/portal');
  }

  return (
    <div className="portal-shell">
      <div className="portal-narrow">
        <div className="portal-card">
          <div className="portal-eyebrow">ASHES CLIENT PORTAL</div>
          <h1 className="portal-h1">Sign in</h1>
          <p className="portal-sub">{safeNext() ? 'Sign in to approve your Ashes AI connection.' : 'Access your project, documents and invoices.'}</p>
          {error && <div className="portal-error">{error}</div>}
          <form onSubmit={onSubmit}>
            <div className="portal-field">
              <label>Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="portal-field">
              <label>Password</label>
              <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button className="pill-btn solid" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          {!safeNext() && <GoogleSignInButton onError={setError} />}
          <p style={{ fontSize: '.68rem', marginTop: 20, color: '#8c8982' }}>
            Don't have an account? <Link className="portal-link" to="/signup">Create one</Link>
          </p>
          <p style={{ fontSize: '.68rem', marginTop: 8 }}>
            <Link className="portal-link" to="/">← Back to ashes.studio</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

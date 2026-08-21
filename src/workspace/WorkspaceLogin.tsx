import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

type Mode = 'login' | 'signup';

export default function WorkspaceLogin() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function safeNext() {
    const next = searchParams.get('next') || '';
    return next.startsWith('/oauth/authorize?') ? next : '';
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`/api/workspace?auth=${mode}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not sign in.');
      const next = safeNext();
      window.location.assign(next || '/workspace');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
      setLoading(false);
    }
  }

  return (
    <main className="portal-shell">
      <section className="portal-narrow">
        <div className="portal-card">
          <div className="portal-eyebrow">ASHES BRAIN</div>
          <h1 className="portal-h1">{mode === 'login' ? 'Sign in' : 'Create Brain account'}</h1>
          <p className="portal-sub">
            {safeNext()
              ? 'Sign in to approve this AI connection. Your Brain account is separate from the Ashes Stack client/team portal.'
              : 'One account for your shared AI memory. This does not sign you into the client, team, or admin portal.'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '18px 0' }}>
            <button type="button" className={mode === 'login' ? 'pill-btn solid' : 'pill-btn'} onClick={() => { setMode('login'); setError(''); }} style={{ justifyContent: 'center' }}>Sign in</button>
            <button type="button" className={mode === 'signup' ? 'pill-btn solid' : 'pill-btn'} onClick={() => { setMode('signup'); setError(''); }} style={{ justifyContent: 'center' }}>Create account</button>
          </div>

          {error && <div className="portal-error">{error}</div>}
          <form onSubmit={submit}>
            {mode === 'signup' && (
              <div className="portal-field">
                <label>Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
              </div>
            )}
            <div className="portal-field">
              <label>Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
            </div>
            <div className="portal-field">
              <label>Password</label>
              <input type="password" minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </div>
            <button className="pill-btn solid" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Working…' : mode === 'login' ? 'Sign in to Brain' : 'Create Brain account'}
            </button>
          </form>

          <p style={{ fontSize: '.68rem', marginTop: 18, color: '#8c8982', lineHeight: 1.6 }}>
            Client, team and admin accounts still use the existing <Link className="portal-link" to="/login">Ashes Stack portal login</Link>.
          </p>
          <p style={{ fontSize: '.68rem', marginTop: 8 }}>
            <Link className="portal-link" to="/workspace">← Back to Ashes Brain</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

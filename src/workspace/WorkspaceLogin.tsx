import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

declare global {
  interface Window { google?: any; }
}

type Mode = 'login' | 'signup';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export default function WorkspaceLogin() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>(location.pathname === '/signup' ? 'signup' : 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const googleRef = useRef<HTMLDivElement>(null);

  function safeNext() {
    const next = searchParams.get('next') || '';
    return next.startsWith('/oauth/authorize?') ? next : '';
  }

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const onCredential = async (response: any) => {
      setError('');
      setLoading(true);
      try {
        const res = await fetch('/api/account-google', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: response.credential }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Google sign-in failed.');
        window.location.assign(safeNext() || '/workspace');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Google sign-in failed.');
        setLoading(false);
      }
    };

    const init = () => {
      if (!window.google || !googleRef.current) return;
      googleRef.current.innerHTML = '';
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onCredential });
      window.google.accounts.id.renderButton(googleRef.current, {
        theme: 'filled_black', size: 'large', width: 320, shape: 'pill', text: mode === 'signup' ? 'signup_with' : 'signin_with',
      });
    };

    if (window.google) init();
    else {
      const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
      if (existing) existing.addEventListener('load', init, { once: true });
      else {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = init;
        document.head.appendChild(script);
      }
    }
  }, [mode]);

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
      window.location.assign(safeNext() || '/workspace');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
      setLoading(false);
    }
  }

  return (
    <main className="portal-shell">
      <section className="portal-narrow">
        <div className="portal-card">
          <div className="portal-eyebrow">ASHES ACCOUNT</div>
          <h1 className="portal-h1">{mode === 'login' ? 'Sign in to Ashes' : 'Create your Ashes account'}</h1>
          <p className="portal-sub">
            One normal account for Ashes Brain and current/future Ashes products. Client, team and admin access is kept separate.
          </p>

          {error && <div className="portal-error">{error}</div>}

          {GOOGLE_CLIENT_ID ? (
            <div style={{ margin: '20px 0 16px', display: 'flex', justifyContent: 'center', minHeight: 44 }} ref={googleRef} />
          ) : (
            <div className="portal-error">Google sign-in is not configured yet.</div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.12)' }} />
            <span style={{ fontSize: '.62rem', color: '#66625b', letterSpacing: '.08em' }}>OR USE EMAIL</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.12)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '18px 0' }}>
            <button type="button" className={mode === 'login' ? 'pill-btn solid' : 'pill-btn'} onClick={() => { setMode('login'); setError(''); }} style={{ justifyContent: 'center' }}>Sign in</button>
            <button type="button" className={mode === 'signup' ? 'pill-btn solid' : 'pill-btn'} onClick={() => { setMode('signup'); setError(''); }} style={{ justifyContent: 'center' }}>Create account</button>
          </div>

          <form onSubmit={submit}>
            {mode === 'signup' && (
              <div className="portal-field"><label>Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" /></div>
            )}
            <div className="portal-field"><label>Email</label><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></div>
            <div className="portal-field"><label>Password</label><input type="password" minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></div>
            <button className="pill-btn solid" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>{loading ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
          </form>

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,.1)' }}>
            <p style={{ fontSize: '.68rem', color: '#8c8982', lineHeight: 1.6 }}>Working with Ashes as a client, team member or administrator?</p>
            <Link className="portal-link" to="/portal/login">Open Client / Team / Admin Portal →</Link>
          </div>
          <p style={{ fontSize: '.68rem', marginTop: 12 }}><Link className="portal-link" to="/">← Back to Ashes</Link></p>
        </div>
      </section>
    </main>
  );
}

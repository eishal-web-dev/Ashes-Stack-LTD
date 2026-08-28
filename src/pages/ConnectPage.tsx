import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const CONNECT_CALLBACK = 'https://ashes-connect.vercel.app/auth/ashes/callback';

export default function ConnectPage() {
  useEffect(() => {
    const returnUrl = encodeURIComponent(CONNECT_CALLBACK);
    window.location.replace(`/api/account-google?sso=issue&return=${returnUrl}`);
  }, []);

  return (
    <main className="portal-shell">
      <section className="portal-narrow">
        <div className="portal-card" style={{ textAlign: 'center' }}>
          <div className="portal-eyebrow">ASHES CONNECT</div>
          <h1 className="portal-h1">Every customer conversation. One place.</h1>
          <p className="portal-sub">Opening with your Ashes account…</p>
          <div style={{ marginTop: 22 }}>
            <Link className="portal-link" to="/workspace">← Back to Ashes</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const CONNECT_URL = 'https://ashes-connect.vercel.app';

export default function ConnectPage() {
  const [message, setMessage] = useState('Opening Ashes Connect…');

  useEffect(() => {
    let cancelled = false;

    async function launch() {
      try {
        const response = await fetch('/api/connect-sso?action=issue', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.status === 401) {
          window.location.replace('/login?next=/connect');
          return;
        }

        const data = await response.json() as { ticket?: string; error?: string };
        if (!response.ok || !data.ticket) {
          throw new Error(data.error || 'Could not open Ashes Connect');
        }

        if (!cancelled) {
          window.location.replace(`${CONNECT_URL}/sso?ticket=${encodeURIComponent(data.ticket)}`);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : 'Could not open Ashes Connect');
        }
      }
    }

    launch();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="portal-shell">
      <section className="portal-narrow">
        <div className="portal-card" style={{ textAlign: 'center' }}>
          <div className="portal-eyebrow">ASHES CONNECT</div>
          <h1 className="portal-h1">Every customer conversation. One place.</h1>
          <p className="portal-sub">{message}</p>
          <div style={{ marginTop: 22 }}>
            <Link className="portal-link" to="/workspace">← Back to Ashes</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

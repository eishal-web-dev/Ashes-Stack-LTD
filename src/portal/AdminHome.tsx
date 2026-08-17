import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMe, logout, Me } from './api';

type ClientRow = { _id: string; name: string; email: string; company?: string; docCount: number };

export default function AdminHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Me | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe().then(async (u) => {
      if (!u) return navigate('/login');
      if (u.role !== 'admin') return navigate('/portal');
      setUser(u);
      const c = await fetch('/api/admin/clients').then((r) => r.json());
      setClients(c);
      setLoading(false);
    });
  }, [navigate]);

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  if (loading) return <div className="portal-shell"><div className="portal-container">Loading…</div></div>;

  return (
    <div className="portal-shell">
      <div className="portal-topbar">
        <div className="portal-brand">ASHES <span>· Admin</span></div>
        <div className="portal-nav-actions">
          <span className="portal-user">{user?.name}</span>
          <button className="pill-btn tiny" onClick={onLogout}>Log out</button>
        </div>
      </div>

      <div className="portal-container">
        <div className="portal-eyebrow">ADMIN PORTAL</div>
        <h1 className="portal-h1">Clients</h1>
        <p className="portal-sub">
          Click into a client to send an invoice, contract, welcome doc, monthly report, fulfillment doc,
          feedback request or access request in one click.
        </p>

        <div className="portal-card">
          {clients.length === 0 ? (
            <div className="portal-empty">No clients yet. Clients appear here once they sign up at /signup.</div>
          ) : (
            <table className="portal-table">
              <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Docs sent</th><th></th></tr></thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c._id}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.company}</td>
                    <td>{c.docCount}</td>
                    <td><Link className="pill-btn tiny solid" to={`/admin/client/${c._id}`}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

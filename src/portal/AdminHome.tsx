import { useEffect, useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMe, logout, Me } from './api';

type ClientRow = { _id: string; name: string; email: string; company?: string; docCount: number };

export default function AdminHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Me | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'client', company: 'Life Time Car Wash', source: 'other', dealValue: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  async function loadClients() {
    const c = await fetch('/api/admin/clients').then((r) => r.json());
    setClients(c);
  }

  useEffect(() => {
    getMe().then(async (u) => {
      if (!u) return navigate('/login');
      if (u.role !== 'admin') return navigate('/portal');
      setUser(u);
      await loadClients();
      setLoading(false);
    });
  }, [navigate]);

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCreating(true);
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) return setError(data.error || 'Could not create account.');
    setSuccess(`Account created for ${data.email} (${data.role}). Share these login details with them directly.`);
    setForm({ name: '', email: '', password: '', role: 'client', company: 'Life Time Car Wash', source: 'other', dealValue: '' });
    await loadClients();
  }

  if (loading) return <div className="portal-shell"><div className="portal-container">Loading…</div></div>;

  return (
    <div className="portal-shell">
      <div className="portal-topbar">
        <div className="portal-brand">ASHES <span>· Admin</span></div>
        <div className="portal-nav-actions">
          <Link className="pill-btn tiny solid" to="/admin/dashboard">Dashboard</Link>
          <Link className="pill-btn tiny" to="/admin/account">Account</Link>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showAdd ? 20 : 0 }}>
            <h2 className="portal-h2" style={{ margin: 0 }}>Add a client or team account</h2>
            <button className="pill-btn" onClick={() => setShowAdd((v) => !v)}>{showAdd ? 'Cancel' : '+ New account'}</button>
          </div>
          {showAdd && (
            <form onSubmit={onCreate} style={{ marginTop: 16 }}>
              {error && <div className="portal-error">{error}</div>}
              {success && <div className="portal-success">{success}</div>}
              <div className="portal-grid-2">
                <div className="portal-field">
                  <label>Full name</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="portal-field">
                  <label>Login email</label>
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="portal-field">
                  <label>Temporary password</label>
                  <input required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
                <div className="portal-field">
                  <label>Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="client">Client</option>
                    <option value="admin">Admin / team member</option>
                  </select>
                </div>
                <div className="portal-field" style={{ gridColumn: '1 / -1' }}>
                  <label>Company (for clients)</label>
                  <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                </div>
                <div className="portal-field">
                  <label>Lead source</label>
                  <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                    <option value="fiverr">Fiverr</option>
                    <option value="referral">Referral</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="portal-field">
                  <label>Estimated deal value (PKR)</label>
                  <input type="number" placeholder="e.g. 5000" value={form.dealValue} onChange={(e) => setForm({ ...form, dealValue: e.target.value })} />
                </div>
              </div>
              <button className="pill-btn solid" disabled={creating}>{creating ? 'Creating…' : 'Create account'}</button>
              <p style={{ fontSize: '.68rem', color: '#8c8982', marginTop: 12 }}>
                They can change this password themselves later from their portal's Account &amp; password section.
              </p>
            </form>
          )}
        </div>

        <div className="portal-card">
          <div className="portal-field" style={{ maxWidth: 320, marginBottom: clients.length ? 16 : 0 }}>
            <input
              placeholder="Search clients by name, email or company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {clients.length === 0 ? (
            <div className="portal-empty">No clients yet. Add one above, or they can sign up themselves at /signup.</div>
          ) : (
            <table className="portal-table">
              <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Docs sent</th><th></th></tr></thead>
              <tbody>
                {clients
                  .filter((c) => {
                    const q = search.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      c.name.toLowerCase().includes(q) ||
                      c.email.toLowerCase().includes(q) ||
                      (c.company || '').toLowerCase().includes(q)
                    );
                  })
                  .map((c) => (
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

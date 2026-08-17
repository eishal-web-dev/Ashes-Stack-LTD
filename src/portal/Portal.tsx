import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, logout, Me } from './api';
import AccountSettings from './AccountSettings';

const TYPE_LABELS: Record<string, string> = {
  welcome: 'Welcome Packet',
  contract: 'Service Agreement / Contract',
  invoice: 'Invoice',
  access_request: 'Access / Information Request',
  monthly_report: 'Monthly Progress Report',
  fulfillment: 'Fulfillment & Handover',
  feedback_request: 'Feedback Request',
};

type DocRow = { _id: string; title: string; type: string; status: string; createdAt: string };
type Profile = { name: string; email: string; company?: string; project?: string; googleEmail?: string; phone?: string; age?: number; gender?: string };

export default function Portal() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Me | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getMe().then(async (u) => {
      if (!u) return navigate('/login');
      if (u.role === 'admin') return navigate('/admin');
      setUser(u);
      const [p, d] = await Promise.all([
        fetch('/api/client/profile').then((r) => r.json()),
        fetch('/api/documents').then((r) => r.json()),
      ]);
      setProfile(p);
      setDocs(d);
      setLoading(false);
    });
  }, [navigate]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch('/api/client/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    setProfile(data);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  if (loading || !profile) return <div className="portal-shell"><div className="portal-container">Loading…</div></div>;

  return (
    <div className="portal-shell">
      <div className="portal-topbar">
        <div className="portal-brand">ASHES <span>· Client Portal</span></div>
        <div className="portal-nav-actions">
          <span className="portal-user">{user?.name}</span>
          <button className="pill-btn tiny" onClick={onLogout}>Log out</button>
        </div>
      </div>

      <div className="portal-container">
        <div className="portal-eyebrow">YOUR PROJECT</div>
        <h1 className="portal-h1">Welcome, {user?.name}</h1>
        <p className="portal-sub">{profile.company} — {profile.project}</p>

        <div className="portal-card">
          <h2 className="portal-h2">Your details</h2>
          <p className="portal-sub" style={{ marginTop: -2 }}>We use this to book Google Meet calls and keep your file up to date.</p>
          {saved && <div className="portal-success">Saved.</div>}
          <form onSubmit={saveProfile}>
            <div className="portal-grid-2">
              <div className="portal-field">
                <label>Gmail (for Google Meet invites)</label>
                <input type="email" placeholder="you@gmail.com" value={profile.googleEmail || ''} onChange={(e) => setProfile({ ...profile, googleEmail: e.target.value })} />
              </div>
              <div className="portal-field">
                <label>Phone</label>
                <input value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </div>
              <div className="portal-field">
                <label>Age</label>
                <input type="number" value={profile.age || ''} onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })} />
              </div>
              <div className="portal-field">
                <label>Gender</label>
                <select value={profile.gender || ''} onChange={(e) => setProfile({ ...profile, gender: e.target.value })}>
                  <option value="">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <button className="pill-btn solid" disabled={saving}>{saving ? 'Saving…' : 'Save details'}</button>
          </form>
        </div>

        <AccountSettings profile={{ name: profile.name, email: (profile as any).email }} onUpdated={(p) => setProfile({ ...profile, ...p })} />

        <div className="portal-card">
          <h2 className="portal-h2">Documents from ASHES</h2>
          {docs.length === 0 ? (
            <div className="portal-empty">No documents yet — your admin will send your welcome packet, contract and invoices here.</div>
          ) : (
            <table className="portal-table">
              <thead><tr><th>Document</th><th>Type</th><th>Sent</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d._id}>
                    <td>{d.title}</td>
                    <td>{TYPE_LABELS[d.type] || d.type}</td>
                    <td>{new Date(d.createdAt).toLocaleDateString('en-GB')}</td>
                    <td><span className={`portal-badge ${d.status}`}>{d.status}</span></td>
                    <td><a className="pill-btn tiny" href={`/api/documents/${d._id}/download`} target="_blank" rel="noreferrer">Download</a></td>
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

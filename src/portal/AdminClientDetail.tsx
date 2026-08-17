import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getMe, logout, Me } from './api';
import { DOC_CONFIGS, DocField } from './docConfigs';

type ClientInfo = { _id: string; name: string; email: string; company?: string; googleEmail?: string; age?: number; gender?: string };
type DocRow = { _id: string; title: string; status: string; createdAt: string };

function buildInitialValues(fields: DocField[], client: ClientInfo): Record<string, string> {
  const values: Record<string, string> = {};
  for (const f of fields) {
    if (f.key === 'googleEmail') {
      values[f.key] = client.googleEmail || '';
    } else {
      values[f.key] = f.default || '';
    }
  }
  return values;
}

export default function AdminClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<Me | null>(null);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    getMe().then(async (u) => {
      if (!u) return navigate('/login');
      if (u.role !== 'admin') return navigate('/portal');
      setUser(u);
      const [clients, d] = await Promise.all([
        fetch('/api/admin/clients').then((r) => r.json()),
        fetch(`/api/documents?clientId=${id}`).then((r) => r.json()),
      ]);
      setClient(clients.find((c: ClientInfo) => c._id === id) || null);
      setDocs(d);
      setLoading(false);
    });
  }, [id, navigate]);

  async function refreshDocs() {
    const d = await fetch(`/api/documents?clientId=${id}`).then((r) => r.json());
    setDocs(d);
  }

  function pickDoc(type: string) {
    const config = DOC_CONFIGS.find((c) => c.type === type);
    if (!config || !client) return;
    setSelectedType(type);
    setValues(buildInitialValues(config.fields, client));
    setMenuOpen(false);
    setMessage('');
  }

  async function onSend() {
    if (!selectedType) return;
    const config = DOC_CONFIGS.find((c) => c.type === selectedType);
    if (!config) return;

    const meta: Record<string, unknown> = {};
    for (const f of config.fields) {
      const raw = values[f.key] ?? '';
      if (f.type === 'list') {
        meta[f.key] = raw.split('\n').map((s) => s.trim()).filter(Boolean);
      } else if (f.type === 'number') {
        meta[f.key] = raw ? Number(raw) : undefined;
      } else {
        meta[f.key] = raw || undefined;
      }
    }

    setSending(true);
    setMessage('');
    const res = await fetch('/api/admin/send-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: id, type: selectedType, meta }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setMessage(`Error: ${data.error}`);
    } else {
      setMessage(`${data.title} sent to ${client?.name}'s portal.`);
      setSelectedType(null);
      refreshDocs();
    }
    setTimeout(() => setMessage(''), 4000);
  }

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  if (loading || !client) return <div className="portal-shell"><div className="portal-container">Loading…</div></div>;

  const activeConfig = DOC_CONFIGS.find((c) => c.type === selectedType) || null;

  return (
    <div className="portal-shell">
      <div className="portal-topbar">
        <div className="portal-brand">ASHES <span>· Admin</span></div>
        <div className="portal-nav-actions">
          <Link className="pill-btn tiny" to="/admin">← All clients</Link>
          <span className="portal-user">{user?.name}</span>
          <button className="pill-btn tiny" onClick={onLogout}>Log out</button>
        </div>
      </div>

      <div className="portal-container">
        <div className="portal-eyebrow">CLIENT FILE</div>
        <h1 className="portal-h1">{client.name}</h1>
        <p className="portal-sub">
          {client.email} · {client.company}
          {client.googleEmail ? ` · Meet: ${client.googleEmail}` : ''}
          {client.age ? ` · Age ${client.age}` : ''}
          {client.gender ? ` · ${client.gender}` : ''}
        </p>

        {message && <div className={message.startsWith('Error') ? 'portal-error' : 'portal-success'}>{message}</div>}

        <div className="portal-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
            <button
              className="pill-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Choose a document to send"
              style={{ fontSize: '1rem', padding: '11px 16px' }}
            >
              ☰
            </button>
            <div>
              <h2 className="portal-h2" style={{ margin: 0 }}>Docs</h2>
              <p className="portal-sub" style={{ margin: '2px 0 0' }}>
                Click the menu, pick a document, edit its content, then send.
              </p>
            </div>

            {menuOpen && (
              <div
                style={{
                  position: 'absolute', top: 50, left: 0, zIndex: 20,
                  background: '#0c0c0e', border: '1px solid rgba(214,209,198,.18)',
                  borderRadius: 12, padding: 8, minWidth: 260,
                  boxShadow: '0 20px 60px rgba(0,0,0,.5)',
                }}
              >
                {DOC_CONFIGS.map((c) => (
                  <button
                    key={c.type}
                    onClick={() => pickDoc(c.type)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      background: 'transparent', border: 'none', color: '#e7e5df',
                      padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                      font: '400 .78rem "Courier New", monospace',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,98,199,.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontWeight: 700 }}>{c.label}</div>
                    <div style={{ color: '#8c8982', fontSize: '.68rem', marginTop: 2 }}>{c.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeConfig && (
            <div style={{ marginTop: 24, borderTop: '1px solid rgba(214,209,198,.14)', paddingTop: 24 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#eceae4' }}>{activeConfig.label}</h3>
              <p className="portal-sub" style={{ marginTop: -2 }}>Edit the details below, then send — it lands straight in {client.name.split(' ')[0]}'s portal as a PDF.</p>

              {activeConfig.fields.map((f) => (
                <div className="portal-field" key={f.key}>
                  <label>{f.label}</label>
                  {f.type === 'textarea' || f.type === 'list' ? (
                    <textarea
                      rows={f.type === 'list' ? 4 : 3}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: 10,
                        background: '#0a0a0b', border: '1px solid rgba(214,209,198,.2)',
                        color: '#eceae4', font: '400 .8rem "Courier New", monospace', resize: 'vertical',
                      }}
                      value={values[f.key] || ''}
                      placeholder={f.placeholder}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    />
                  ) : (
                    <input
                      type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                      value={values[f.key] || ''}
                      placeholder={f.placeholder}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="pill-btn solid" disabled={sending} onClick={onSend}>
                  {sending ? 'Sending…' : `Send ${activeConfig.label}`}
                </button>
                <button className="pill-btn" onClick={() => setSelectedType(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        <div className="portal-card">
          <h2 className="portal-h2">Documents sent to this client</h2>
          {docs.length === 0 ? (
            <div className="portal-empty">Nothing sent yet.</div>
          ) : (
            <table className="portal-table">
              <thead><tr><th>Document</th><th>Sent</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d._id}>
                    <td>{d.title}</td>
                    <td>{new Date(d.createdAt).toLocaleDateString('en-GB')}</td>
                    <td><span className={`portal-badge ${d.status}`}>{d.status}</span></td>
                    <td><a className="pill-btn tiny" href={`/api/documents/${d._id}/download`} target="_blank" rel="noreferrer">View</a></td>
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

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getMe, logout, Me } from './api';
import { DOC_TYPES, FieldDef } from './docConfig';

type ClientInfo = { _id: string; name: string; email: string; company?: string; googleEmail?: string; age?: number; gender?: string };
type DocRow = { _id: string; title: string; status: string; createdAt: string };

function buildMeta(fields: FieldDef[], values: Record<string, string>): Record<string, unknown> {
  const meta: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values[f.key];
    if (v === undefined || v === '') continue;
    if (f.type === 'lines') {
      meta[f.key] = v.split('\n').map((l) => l.trim()).filter(Boolean);
    } else if (f.type === 'number') {
      meta[f.key] = Number(v);
    } else {
      meta[f.key] = v;
    }
  }
  return meta;
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
  const [activeType, setActiveType] = useState<string | null>(null);
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

  function openDocType(type: string) {
    const config = DOC_TYPES.find((d) => d.type === type);
    const initial: Record<string, string> = {};
    if (config) {
      for (const f of config.fields) {
        if (f.key === 'googleEmail' && client?.googleEmail) initial[f.key] = client.googleEmail;
        else initial[f.key] = '';
      }
    }
    setValues(initial);
    setActiveType(type);
    setMenuOpen(false);
    setMessage('');
  }

  async function onSend() {
    if (!activeType) return;
    const config = DOC_TYPES.find((d) => d.type === activeType);
    if (!config) return;
    setSending(true);
    setMessage('');
    const meta = buildMeta(config.fields, values);
    const res = await fetch('/api/admin/send-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: id, type: activeType, meta }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setMessage(`Error: ${data.error}`);
    } else {
      setMessage(`${data.title} sent to ${client?.name}'s portal.`);
      setActiveType(null);
      refreshDocs();
    }
  }

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  if (loading || !client) return <div className="portal-shell"><div className="portal-container">Loading…</div></div>;

  const activeConfig = DOC_TYPES.find((d) => d.type === activeType);

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

        <div className="portal-card" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              className="pill-btn"
              aria-label="Choose a document to send"
              onClick={() => setMenuOpen((v) => !v)}
              style={{ fontSize: '1rem', padding: '10px 14px' }}
            >
              ☰
            </button>
            <div>
              <h2 className="portal-h2" style={{ margin: 0 }}>Docs</h2>
              <p className="portal-sub" style={{ margin: 0 }}>Pick a document, edit its content, then send it to {client.name.split(' ')[0]}'s portal.</p>
            </div>
          </div>

          {menuOpen && (
            <div
              style={{
                position: 'absolute', top: 74, left: 32, zIndex: 20,
                background: '#0c0c0e', border: '1px solid rgba(214,209,198,.18)',
                borderRadius: 12, minWidth: 260, boxShadow: '0 20px 50px rgba(0,0,0,.5)',
                overflow: 'hidden',
              }}
            >
              {DOC_TYPES.map((d) => (
                <button
                  key={d.type}
                  onClick={() => openDocType(d.type)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '14px 18px',
                    background: activeType === d.type ? 'rgba(255,98,199,.08)' : 'transparent',
                    border: 'none', borderBottom: '1px solid rgba(214,209,198,.08)',
                    color: '#eceae4', cursor: 'pointer', font: '400 .75rem "Courier New", monospace',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{d.label}</div>
                  <div style={{ color: '#8c8982', fontSize: '.68rem', marginTop: 3 }}>{d.description}</div>
                </button>
              ))}
            </div>
          )}

          {activeConfig && (
            <div style={{ marginTop: 22, borderTop: '1px solid rgba(214,209,198,.14)', paddingTop: 22 }}>
              <h3 style={{ margin: '0 0 4px', font: '700 .8rem/1 "Courier New", monospace', color: '#ff62c7' }}>
                {activeConfig.label}
              </h3>
              <p className="portal-sub" style={{ marginTop: 4 }}>Edit the details below, then send.</p>
              <div className="portal-grid-2">
                {activeConfig.fields.map((f) => (
                  <div className="portal-field" key={f.key} style={f.type === 'lines' ? { gridColumn: '1 / -1' } : undefined}>
                    <label>{f.label}</label>
                    {(f.type === 'lines' || f.type === 'paragraph') ? (
                      <textarea
                        rows={4}
                        value={values[f.key] ?? ''}
                        onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                        placeholder={f.type === 'lines' ? 'One item per line' : f.placeholder}
                        style={{
                          width: '100%', padding: '12px 14px', borderRadius: 10,
                          background: '#0a0a0b', border: '1px solid rgba(214,209,198,.2)', color: '#eceae4',
                          font: '400 .8rem "Courier New", monospace', resize: 'vertical',
                        }}
                      />
                    ) : (
                      <input
                        type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                        placeholder={f.placeholder}
                        value={values[f.key] ?? ''}
                        onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="pill-btn solid" disabled={sending} onClick={onSend}>
                  {sending ? 'Sending…' : `Send ${activeConfig.label}`}
                </button>
                <button className="pill-btn" onClick={() => setActiveType(null)}>Cancel</button>
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

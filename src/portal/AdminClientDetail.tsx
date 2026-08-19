import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getMe, Me } from './api';
import { DOC_TYPES, FieldDef } from './docConfig';
import BrandLoader from './BrandLoader';
import AdminLayout from './AdminLayout';

type ClientInfo = { _id: string; name: string; email: string; company?: string; googleEmail?: string; age?: number; gender?: string; stage?: string; source?: string; dealValue?: number };
type DocRow = {
  _id: string; title: string; type: string; status: string; createdAt: string;
  meta?: { dueDate?: string; [k: string]: unknown };
  paymentStatus?: 'unpaid' | 'paid';
  signedAt?: string;
  signedByName?: string;
};
type ActivityRow = { _id: string; action: string; meta?: Record<string, unknown>; actor?: { name: string; role: string }; createdAt: string };

const ACTION_LABELS: Record<string, string> = {
  account_created: 'Account created',
  profile_updated: 'Profile updated',
  document_sent: 'Document sent',
  document_downloaded: 'Document downloaded',
  document_deleted: 'Document deleted',
  document_signed: 'Contract signed',
  payment_marked_paid: 'Invoice marked paid',
  payment_marked_unpaid: 'Invoice marked unpaid',
  review_submitted: 'Left a review',
};

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
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  const [uploadMode, setUploadMode] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!id) return;
    getMe().then(async (u) => {
      if (!u) return navigate('/login');
      if (u.role === 'team') return navigate('/team');
      if (u.role !== 'admin') return navigate('/portal');
      setUser(u);
      const [clients, d, a] = await Promise.all([
        fetch('/api/admin/clients').then((r) => r.json()),
        fetch(`/api/documents?clientId=${id}`).then((r) => r.json()),
        fetch(`/api/admin/activity?clientId=${id}`).then((r) => r.json()),
      ]);
      setClient(clients.find((c: ClientInfo) => c._id === id) || null);
      setDocs(d);
      setActivity(a);
      setLoading(false);
    });
  }, [id, navigate]);

  async function refreshDocs() {
    const [d, a] = await Promise.all([
      fetch(`/api/documents?clientId=${id}`).then((r) => r.json()),
      fetch(`/api/admin/activity?clientId=${id}`).then((r) => r.json()),
    ]);
    setDocs(d);
    setActivity(a);
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
    setUploadMode(false);
    setMenuOpen(false);
    setMessage('');
  }

  function openUpload() {
    setActiveType(null);
    setUploadMode(true);
    setUploadTitle('');
    setUploadFile(null);
    setMenuOpen(false);
    setMessage('');
  }

  async function onUploadSend() {
    if (!uploadFile || !uploadTitle.trim()) {
      setMessage('Error: Add a title and choose a file first.');
      return;
    }
    const MAX_BYTES = 4.3 * 1024 * 1024;
    if (uploadFile.size > MAX_BYTES) {
      setMessage('Error: That file is too large (limit ~4MB). For videos or large files, share a Google Drive/WeTransfer link instead — ask me about adding proper cloud file storage for bigger files.');
      return;
    }
    setUploading(true);
    setMessage('');
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      const res = await fetch('/api/admin/upload-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: id,
          title: uploadTitle.trim(),
          fileName: uploadFile.name,
          mimeType: uploadFile.type || 'application/octet-stream',
          fileBase64: base64,
        }),
      });
      const data = await res.json();
      setUploading(false);
      if (!res.ok) {
        setMessage(`Error: ${data.error}`);
      } else {
        setMessage(`"${uploadTitle}" sent to ${client?.name}'s portal${data.emailSent ? ' and emailed to them.' : '.'}`);
        setUploadMode(false);
        refreshDocs();
      }
    };
    reader.readAsDataURL(uploadFile);
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
      setMessage(`${data.title} sent to ${client?.name}'s portal${data.emailSent ? ' and emailed to them.' : '.'}`);
      setActiveType(null);
      refreshDocs();
    }
  }

  async function deleteDoc(docId: string, title: string) {
    if (!confirm(`Delete "${title}"? The client will no longer be able to see or download it.`)) return;
    const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(`Error: ${data.error || 'Could not delete document.'}`);
      return;
    }
    setMessage(`"${title}" deleted.`);
    refreshDocs();
  }

  async function deleteAllDocs() {
    if (!docs.length) return;
    if (!confirm(`Delete ALL ${docs.length} document(s) sent to ${client?.name}? This cannot be undone.`)) return;
    const res = await fetch(`/api/documents?clientId=${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(`Error: ${data.error || 'Could not delete documents.'}`);
      return;
    }
    const data = await res.json();
    setMessage(`Deleted ${data.deletedCount} document(s). Starting fresh.`);
    refreshDocs();
  }

  async function togglePayment(docId: string, currentlyPaid: boolean) {
    const res = await fetch(`/api/documents/${docId}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paid: !currentlyPaid }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(`Error: ${data.error || 'Could not update payment status.'}`);
      return;
    }
    refreshDocs();
  }

  async function updatePipeline(fields: Partial<Pick<ClientInfo, 'stage' | 'source' | 'dealValue'>>) {
    const res = await fetch('/api/admin/update-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: id, ...fields }),
    });
    if (res.ok) {
      setClient((c) => (c ? { ...c, ...fields } : c));
    }
  }

  if (loading || !client) return <AdminLayout user={user}><BrandLoader /></AdminLayout>;

  const activeConfig = DOC_TYPES.find((d) => d.type === activeType);

  return (
    <AdminLayout user={user}>
      <div className="portal-page-head">
        <Link to="/admin" className="pill-btn tiny" style={{ marginBottom: 16, display: 'inline-flex' }}>← All clients</Link>
        <div className="portal-eyebrow">CLIENT FILE</div>
        <h1 className="portal-h1">{client.name}</h1>
        <p className="portal-sub">
          {client.email} · {client.company}
          {client.googleEmail ? ` · Meet: ${client.googleEmail}` : ''}
          {client.age ? ` · Age ${client.age}` : ''}
          {client.gender ? ` · ${client.gender}` : ''}
        </p>
      </div>

        {message && <div className={message.startsWith('Error') ? 'portal-error' : 'portal-success'}>{message}</div>}

        <div className="portal-card">
          <h2 className="portal-h2">Pipeline</h2>
          <p className="portal-sub" style={{ marginTop: -2 }}>Move this client through the funnel — powers the business dashboard.</p>
          <div className="portal-grid-2">
            <div className="portal-field">
              <label>Stage</label>
              <select value={client.stage || 'lead'} onChange={(e) => updatePipeline({ stage: e.target.value })}>
                <option value="lead">Lead</option>
                <option value="contacted">Contacted</option>
                <option value="demo">Demo</option>
                <option value="proposal">Proposal</option>
                <option value="won">Won</option>
                <option value="in_progress">In Progress</option>
                <option value="delivered">Delivered</option>
                <option value="paid">Paid</option>
                <option value="review">Review</option>
                <option value="repeat_client">Repeat Client</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div className="portal-field">
              <label>Source</label>
              <select value={client.source || 'other'} onChange={(e) => updatePipeline({ source: e.target.value })}>
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
              <input
                type="number"
                defaultValue={client.dealValue || ''}
                onBlur={(e) => updatePipeline({ dealValue: Number(e.target.value) || 0 })}
                placeholder="e.g. 5000"
              />
            </div>
          </div>
        </div>

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
              <button
                onClick={openUpload}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '14px 18px',
                  background: uploadMode ? 'rgba(255,98,199,.08)' : 'transparent',
                  border: 'none', borderBottom: '1px solid rgba(214,209,198,.18)',
                  color: '#d8ff62', cursor: 'pointer', font: '700 .75rem "Courier New", monospace',
                }}
              >
                <div>↑ Upload a file (PDF / image)</div>
                <div style={{ color: '#8c8982', fontSize: '.68rem', marginTop: 3, fontWeight: 400 }}>
                  Send an existing file as-is instead of a generated template.
                </div>
              </button>
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

          {uploadMode && (
            <div style={{ marginTop: 22, borderTop: '1px solid rgba(214,209,198,.14)', paddingTop: 22 }}>
              <h3 style={{ margin: '0 0 4px', font: '700 .8rem/1 "Courier New", monospace', color: '#d8ff62' }}>
                Upload a file
              </h3>
              <p className="portal-sub" style={{ marginTop: 4 }}>
                Send a PDF or image straight through as-is — up to about 4MB. For video or larger files, share a
                Google Drive / WeTransfer link with the client instead, or ask about adding proper cloud file storage.
              </p>
              <div className="portal-field">
                <label>Title (shown in his portal)</label>
                <input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="e.g. Final logo files" />
              </div>
              <div className="portal-field">
                <label>File</label>
                <input type="file" accept=".pdf,image/*" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                {uploadFile && (
                  <p style={{ fontSize: '.68rem', color: '#8c8982', marginTop: 6 }}>
                    {uploadFile.name} — {(uploadFile.size / (1024 * 1024)).toFixed(2)}MB
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="pill-btn solid" disabled={uploading} onClick={onUploadSend}>
                  {uploading ? 'Sending…' : 'Send file'}
                </button>
                <button className="pill-btn" onClick={() => setUploadMode(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        <div className="portal-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 className="portal-h2" style={{ margin: 0 }}>Documents sent to this client</h2>
            {docs.length > 0 && (
              <button
                className="pill-btn tiny"
                style={{ color: '#ff8fa3', borderColor: 'rgba(255,73,108,.4)' }}
                onClick={deleteAllDocs}
              >
                Delete all ({docs.length})
              </button>
            )}
          </div>
          {docs.length === 0 ? (
            <div className="portal-empty">Nothing sent yet.</div>
          ) : (
            <table className="portal-table">
              <thead><tr><th>Document</th><th>Sent</th><th>Status</th><th>Extra</th><th></th></tr></thead>
              <tbody>
                {docs.map((d) => {
                  const isOverdue = d.type === 'invoice' && d.paymentStatus !== 'paid' && d.meta?.dueDate && new Date(d.meta.dueDate as string) < new Date();
                  return (
                    <tr key={d._id}>
                      <td>{d.title}</td>
                      <td>{new Date(d.createdAt).toLocaleDateString('en-GB')}</td>
                      <td><span className={`portal-badge ${d.status}`}>{d.status}</span></td>
                      <td>
                        {d.type === 'invoice' && (
                          <button
                            className="pill-btn tiny"
                            style={d.paymentStatus === 'paid'
                              ? { color: '#d8ff62', borderColor: 'rgba(216,255,98,.4)' }
                              : { color: isOverdue ? '#ff8fa3' : '#8c8982', borderColor: isOverdue ? 'rgba(255,73,108,.4)' : undefined }}
                            onClick={() => togglePayment(d._id, d.paymentStatus === 'paid')}
                          >
                            {d.paymentStatus === 'paid' ? '✓ Paid' : isOverdue ? 'Overdue — mark paid' : 'Unpaid — mark paid'}
                          </button>
                        )}
                        {d.type === 'contract' && (
                          d.signedAt ? (
                            <span style={{ color: '#d8ff62', fontSize: '.68rem' }}>✓ Signed by {d.signedByName} · {new Date(d.signedAt).toLocaleDateString('en-GB')}</span>
                          ) : (
                            <span style={{ color: '#8c8982', fontSize: '.68rem' }}>Not signed yet</span>
                          )
                        )}
                      </td>
                      <td style={{ display: 'flex', gap: 8 }}>
                        <a className="pill-btn tiny" href={`/api/documents/${d._id}/download`} target="_blank" rel="noreferrer">View</a>
                        <button className="pill-btn tiny" style={{ color: '#ff8fa3', borderColor: 'rgba(255,73,108,.4)' }} onClick={() => deleteDoc(d._id, d.title)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="portal-card">
          <h2 className="portal-h2">Activity</h2>
          <p className="portal-sub" style={{ marginTop: -2 }}>What's happened on this client's account, most recent first.</p>
          {activity.length === 0 ? (
            <div className="portal-empty">No activity yet.</div>
          ) : (
            <div>
              {activity.map((a) => (
                <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(214,209,198,.08)', fontSize: '.75rem' }}>
                  <div>
                    <span style={{ color: '#eceae4' }}>{ACTION_LABELS[a.action] || a.action}</span>
                    {typeof a.meta?.title === 'string' && <span style={{ color: '#8c8982' }}> — {a.meta.title as string}</span>}
                    {a.actor && <span style={{ color: '#8c8982' }}> · by {a.actor.name}</span>}
                  </div>
                  <div style={{ color: '#66625b' }}>{new Date(a.createdAt).toLocaleString('en-GB')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
    </AdminLayout>
  );
}

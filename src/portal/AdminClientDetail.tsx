import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getMe, logout, Me } from './api';

const DOC_TYPES = [
  { type: 'welcome', label: 'Welcome Doc' },
  { type: 'contract', label: 'Contract' },
  { type: 'access_request', label: 'Access Request' },
  { type: 'monthly_report', label: 'Monthly Report' },
  { type: 'fulfillment', label: 'Fulfillment Doc' },
  { type: 'feedback_request', label: 'Feedback Request' },
];

type ClientInfo = { _id: string; name: string; email: string; company?: string; googleEmail?: string; age?: number; gender?: string };
type DocRow = { _id: string; title: string; status: string; createdAt: string };

export default function AdminClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<Me | null>(null);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState('');
  const [message, setMessage] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoice, setInvoice] = useState({ invoiceNumber: '0001', amount: 5000, project: 'Landing Page Service Agreement', dueDate: '' });

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

  async function sendDoc(type: string, meta: Record<string, unknown> = {}) {
    setSending(type);
    setMessage('');
    const res = await fetch('/api/admin/send-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: id, type, meta }),
    });
    const data = await res.json();
    setSending('');
    if (!res.ok) {
      setMessage(`Error: ${data.error}`);
    } else {
      setMessage(`${data.title} sent to ${client?.name}'s portal.`);
      setShowInvoice(false);
      refreshDocs();
    }
    setTimeout(() => setMessage(''), 4000);
  }

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  if (loading || !client) return <div className="portal-shell"><div className="portal-container">Loading…</div></div>;

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
          <h2 className="portal-h2">Send a document — one click</h2>
          <p className="portal-sub" style={{ marginTop: -2 }}>
            Generates a branded PDF instantly and puts it straight in {client.name.split(' ')[0]}'s Client Portal for download.
          </p>
          <div className="portal-btn-grid">
            {DOC_TYPES.map((d) => (
              <button
                key={d.type}
                className="pill-btn"
                disabled={sending === d.type}
                onClick={() => sendDoc(d.type, d.type === 'welcome' ? { googleEmail: client.googleEmail } : {})}
              >
                {sending === d.type ? 'Sending…' : `Send ${d.label}`}
              </button>
            ))}
            <button className="pill-btn solid" onClick={() => setShowInvoice((v) => !v)}>
              {showInvoice ? 'Cancel invoice' : 'Send Invoice'}
            </button>
          </div>

          {showInvoice && (
            <div style={{ marginTop: 22, borderTop: '1px solid rgba(214,209,198,.14)', paddingTop: 22 }}>
              <div className="portal-grid-2">
                <div className="portal-field">
                  <label>Invoice #</label>
                  <input value={invoice.invoiceNumber} onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })} />
                </div>
                <div className="portal-field">
                  <label>Amount (PKR)</label>
                  <input type="number" value={invoice.amount} onChange={(e) => setInvoice({ ...invoice, amount: Number(e.target.value) })} />
                </div>
                <div className="portal-field">
                  <label>Project / description</label>
                  <input value={invoice.project} onChange={(e) => setInvoice({ ...invoice, project: e.target.value })} />
                </div>
                <div className="portal-field">
                  <label>Due date</label>
                  <input type="date" value={invoice.dueDate} onChange={(e) => setInvoice({ ...invoice, dueDate: e.target.value })} />
                </div>
              </div>
              <button
                className="pill-btn solid"
                disabled={sending === 'invoice'}
                onClick={() => sendDoc('invoice', {
                  invoiceNumber: invoice.invoiceNumber,
                  amount: Number(invoice.amount),
                  project: invoice.project,
                  dueDate: invoice.dueDate || undefined,
                })}
              >
                {sending === 'invoice' ? 'Sending…' : 'Confirm & Send Invoice'}
              </button>
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

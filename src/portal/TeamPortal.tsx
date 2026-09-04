import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, logout, Me } from './api';
import NotificationBell from './NotificationBell';
import { BlobLoaderCentered } from '../components/BlobLoader';

type TaskRow = {
  _id: string; title: string; description?: string; status: 'todo' | 'in_progress' | 'done';
  dueDate?: string; createdAt: string; relatedClient?: { name: string; company?: string };
};
type DocRow = { _id: string; title: string; type: string; status: string; createdAt: string };

const DOC_TYPE_LABELS: Record<string, string> = {
  offer_letter: 'Offer Letter',
  custom_file: 'File from ASHES',
};

const STATUS_LABELS: Record<string, string> = { todo: 'To do', in_progress: 'In progress', done: 'Done' };
const STATUS_ORDER: ('todo' | 'in_progress' | 'done')[] = ['todo', 'in_progress', 'done'];

export default function TeamPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Me | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadTasks() {
    const t = await fetch('/api/tasks').then((r) => r.json());
    setTasks(t);
  }

  async function loadDocs() {
    const d = await fetch('/api/documents').then((r) => r.json());
    setDocs(Array.isArray(d) ? d : []);
  }

  useEffect(() => {
    getMe().then(async (u) => {
      if (!u) return navigate('/login');
      if (u.role === 'admin') return navigate('/admin');
      if (u.role === 'client') return navigate('/portal');
      setUser(u);
      await Promise.all([loadTasks(), loadDocs()]);
      setLoading(false);
    });
  }, [navigate]);

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  async function setStatus(id: string, status: string) {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-status', id, status }),
    });
    loadTasks();
  }

  if (loading) return <div className="portal-shell"><BlobLoaderCentered /></div>;

  return (
    <div className="portal-shell">
      <div className="portal-topbar">
        <div className="portal-brand"><img src="/ashes-logo-transparent.webp" alt="ASHES" /><span>· Team</span></div>
        <div className="portal-nav-actions">
          <NotificationBell />
          <span className="portal-user">{user?.name}</span>
          <button className="pill-btn tiny" onClick={onLogout}>Log out</button>
        </div>
      </div>

      <div className="portal-container">
        <div className="portal-eyebrow">YOUR TASKS</div>
        <h1 className="portal-h1">Welcome, {user?.name}</h1>
        <p className="portal-sub">Here's what's assigned to you — update the status as you go.</p>

        <div className="portal-card">
          <h2 className="portal-h2">Documents from ASHES</h2>
          {docs.length === 0 ? (
            <div className="portal-empty">Nothing here yet — offer letters and other files from ASHES will show up here.</div>
          ) : (
            <table className="portal-table">
              <thead><tr><th>Document</th><th>Type</th><th>Sent</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d._id}>
                    <td>{d.title}</td>
                    <td>{DOC_TYPE_LABELS[d.type] || d.type}</td>
                    <td>{new Date(d.createdAt).toLocaleDateString('en-GB')}</td>
                    <td><span className={`portal-badge ${d.status}`}>{d.status}</span></td>
                    <td><a className="pill-btn tiny" href={`/api/documents/${d._id}/download`} target="_blank" rel="noreferrer">Download</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="portal-btn-grid" style={{ marginBottom: 20 }}>
          {STATUS_ORDER.map((s) => {
            const count = tasks.filter((t) => t.status === s).length;
            return (
              <div className="portal-card" key={s} style={{ margin: 0, padding: 18 }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s === 'done' ? '#d8ff62' : s === 'in_progress' ? '#66ebf2' : '#eceae4' }}>{count}</div>
                <div style={{ fontSize: '.66rem', color: '#8c8982', marginTop: 4 }}>{STATUS_LABELS[s]}</div>
              </div>
            );
          })}
        </div>

        {STATUS_ORDER.map((statusKey) => {
          const group = tasks.filter((t) => t.status === statusKey);
          if (group.length === 0 && statusKey !== 'todo') return null;
          return (
            <div className="portal-card" key={statusKey}>
              <h2 className="portal-h2">{STATUS_LABELS[statusKey]} ({group.length})</h2>
              {group.length === 0 ? (
                <div className="portal-empty">Nothing here.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                  {group.map((t) => (
                    <div key={t._id} style={{
                      padding: 16, border: '1px solid rgba(214,209,198,.14)',
                      borderLeft: `3px solid ${statusKey === 'done' ? '#d8ff62' : statusKey === 'in_progress' ? '#66ebf2' : '#8c8982'}`,
                      borderRadius: 12, background: 'rgba(255,255,255,.02)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#eceae4' }}>{t.title}</div>
                          {t.description && <div style={{ fontSize: '.72rem', color: '#8c8982', marginTop: 6 }}>{t.description}</div>}
                          {t.relatedClient && <div style={{ fontSize: '.66rem', color: '#66625b', marginTop: 6 }}>Client: {t.relatedClient.name}{t.relatedClient.company ? ` · ${t.relatedClient.company}` : ''}</div>}
                          {t.dueDate && <div style={{ fontSize: '.66rem', color: '#ffb766', marginTop: 4 }}>Due {new Date(t.dueDate).toLocaleDateString('en-GB')}</div>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        {STATUS_ORDER.filter((s) => s !== statusKey).map((s) => (
                          <button key={s} className="pill-btn tiny" onClick={() => setStatus(t._id, s)}>
                            Move to {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

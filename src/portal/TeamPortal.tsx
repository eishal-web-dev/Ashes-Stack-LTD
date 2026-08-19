import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, logout, Me } from './api';
import NotificationBell from './NotificationBell';
import { BlobLoaderCentered } from '../components/BlobLoader';

type TaskRow = {
  _id: string; title: string; description?: string; status: 'todo' | 'in_progress' | 'done';
  dueDate?: string; createdAt: string; relatedClient?: { name: string; company?: string };
};

const STATUS_LABELS: Record<string, string> = { todo: 'To do', in_progress: 'In progress', done: 'Done' };
const STATUS_ORDER: ('todo' | 'in_progress' | 'done')[] = ['todo', 'in_progress', 'done'];

export default function TeamPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Me | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadTasks() {
    const t = await fetch('/api/tasks').then((r) => r.json());
    setTasks(t);
  }

  useEffect(() => {
    getMe().then(async (u) => {
      if (!u) return navigate('/login');
      if (u.role === 'admin') return navigate('/admin');
      if (u.role === 'client') return navigate('/portal');
      setUser(u);
      await loadTasks();
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
                    <div key={t._id} style={{ padding: 16, border: '1px solid rgba(214,209,198,.14)', borderRadius: 12, background: 'rgba(255,255,255,.02)' }}>
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

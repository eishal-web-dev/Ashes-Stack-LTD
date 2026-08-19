import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, Me } from './api';
import AdminLayout from './AdminLayout';
import BrandLoader from './BrandLoader';

type TeamMember = { _id: string; name: string; email: string; taskCounts: { todo: number; in_progress: number; done: number } };
type TaskRow = { _id: string; title: string; status: string; assignedTo: { _id: string; name: string }; createdAt: string };
type ClientRow = { _id: string; name: string; company?: string };

export default function AdminTeam() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Me | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', relatedClient: '', dueDate: '' });
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    const [t, tk, c] = await Promise.all([
      fetch('/api/admin/team-list').then((r) => r.json()),
      fetch('/api/tasks').then((r) => r.json()),
      fetch('/api/admin/clients').then((r) => r.json()),
    ]);
    setTeam(t);
    setTasks(tk);
    setClients(c);
  }

  useEffect(() => {
    getMe().then(async (u) => {
      if (!u) return navigate('/login');
      if (u.role === 'team') return navigate('/team');
      if (u.role !== 'admin') return navigate('/portal');
      setUser(u);
      await loadAll();
      setLoading(false);
    });
  }, [navigate]);

  async function assignTask(e: FormEvent) {
    e.preventDefault();
    if (!form.title || !form.assignedTo) return;
    setSaving(true);
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...form }),
    });
    setSaving(false);
    setForm({ title: '', description: '', assignedTo: '', relatedClient: '', dueDate: '' });
    setShowAssign(false);
    loadAll();
  }

  async function deleteTask(id: string) {
    if (!confirm('Delete this task?')) return;
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    loadAll();
  }

  if (loading) return <AdminLayout user={user}><BrandLoader /></AdminLayout>;

  return (
    <AdminLayout user={user}>
      <div className="portal-page-head">
        <div className="portal-eyebrow">TEAM</div>
        <h1 className="portal-h1">Team members</h1>
        <p className="portal-sub">
          Team accounts see only their own assigned tasks — no clients, no revenue, no finance data.
          Create one from Clients → "+ New account" → role "Admin / team member" is full access;
          for a restricted teammate, use role "Team member" there instead.
        </p>
      </div>

      <div className="portal-card">
        {team.length === 0 ? (
          <div className="portal-empty">No team members yet. Add one from the Clients page → "+ New account" → role "Team member".</div>
        ) : (
          <table className="portal-table">
            <thead><tr><th>Name</th><th>Email</th><th>To do</th><th>In progress</th><th>Done</th><th></th></tr></thead>
            <tbody>
              {team.map((t) => (
                <tr key={t._id}>
                  <td>{t.name}</td>
                  <td>{t.email}</td>
                  <td>{t.taskCounts.todo}</td>
                  <td>{t.taskCounts.in_progress}</td>
                  <td>{t.taskCounts.done}</td>
                  <td><button className="pill-btn tiny solid" onClick={() => { setForm({ ...form, assignedTo: t._id }); setShowAssign(true); }}>Assign task</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="portal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showAssign ? 20 : 0 }}>
          <h2 className="portal-h2" style={{ margin: 0 }}>Assign a task</h2>
          <button className="pill-btn" onClick={() => setShowAssign((v) => !v)}>{showAssign ? 'Cancel' : '+ New task'}</button>
        </div>
        {showAssign && (
          <form onSubmit={assignTask} style={{ marginTop: 16 }}>
            <div className="portal-grid-2">
              <div className="portal-field">
                <label>Assign to</label>
                <select required value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                  <option value="">Select a team member…</option>
                  {team.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              <div className="portal-field">
                <label>Task title</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Edit Life Time Car Wash video" />
              </div>
              <div className="portal-field" style={{ gridColumn: '1 / -1' }}>
                <label>Description (optional)</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="portal-field">
                <label>Related client (optional)</label>
                <select value={form.relatedClient} onChange={(e) => setForm({ ...form, relatedClient: e.target.value })}>
                  <option value="">None</option>
                  {clients.map((c) => <option key={c._id} value={c._id}>{c.name}{c.company ? ` · ${c.company}` : ''}</option>)}
                </select>
              </div>
              <div className="portal-field">
                <label>Due date (optional)</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
            <button className="pill-btn solid" disabled={saving}>{saving ? 'Assigning…' : 'Assign task'}</button>
          </form>
        )}
      </div>

      <div className="portal-card">
        <h2 className="portal-h2">All tasks</h2>
        {tasks.length === 0 ? (
          <div className="portal-empty">No tasks assigned yet.</div>
        ) : (
          <table className="portal-table">
            <thead><tr><th>Task</th><th>Assigned to</th><th>Status</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t._id}>
                  <td>{t.title}</td>
                  <td>{t.assignedTo?.name}</td>
                  <td><span className={`portal-badge ${t.status === 'done' ? 'downloaded' : 'sent'}`}>{t.status.replace('_', ' ')}</span></td>
                  <td>{new Date(t.createdAt).toLocaleDateString('en-GB')}</td>
                  <td><button className="pill-btn tiny" style={{ color: '#ff8fa3', borderColor: 'rgba(255,73,108,.4)' }} onClick={() => deleteTask(t._id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

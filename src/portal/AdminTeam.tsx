import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, Me } from './api';
import AdminLayout from './AdminLayout';
import { BlobLoaderCentered } from '../components/BlobLoader';

type TeamMember = { _id: string; name: string; email: string; taskCounts: { todo: number; in_progress: number; done: number } };
type TaskRow = { _id: string; title: string; status: string; assignedTo: { _id: string; name: string }; createdAt: string };
type ClientRow = { _id: string; name: string; company?: string };
type AccountRow = { _id: string; name: string; email: string; role: string };

async function fetchArray<T>(url: string, label: string): Promise<T[]> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || `${label} request failed (${res.status})`);
    if (!Array.isArray(data)) throw new Error(`${label} returned an invalid response`);
    return data as T[];
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`${label} took too long to respond`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function AdminTeam() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Me | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [roleMessage, setRoleMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', relatedClient: '', dueDate: '' });
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    const requests = await Promise.allSettled([
      fetchArray<TeamMember>('/api/admin/team-list', 'Team members'),
      fetchArray<TaskRow>('/api/tasks', 'Tasks'),
      fetchArray<ClientRow>('/api/admin/clients', 'Clients'),
      fetchArray<AccountRow>('/api/admin/all-accounts', 'Accounts'),
    ]);

    const [teamResult, tasksResult, clientsResult, accountsResult] = requests;
    if (teamResult.status === 'fulfilled') setTeam(teamResult.value);
    if (tasksResult.status === 'fulfilled') setTasks(tasksResult.value);
    if (clientsResult.status === 'fulfilled') setClients(clientsResult.value);
    if (accountsResult.status === 'fulfilled') setAccounts(accountsResult.value);

    const failures = requests
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map((result) => result.reason instanceof Error ? result.reason.message : 'A request failed');

    setLoadError(failures.length ? `Some team data could not load: ${failures.join(' · ')}` : '');
  }

  async function changeRole(userId: string, role: string) {
    setRoleMessage('');
    const res = await fetch('/api/admin/update-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setRoleMessage(`Error: ${data.error}`);
    } else {
      setRoleMessage(`${data.name} is now ${role}.`);
      loadAll();
    }
    setTimeout(() => setRoleMessage(''), 4000);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const u = await getMe();
        if (!u) return navigate('/login');
        if (u.role === 'team') return navigate('/team');
        if (u.role !== 'admin') return navigate('/portal');
        if (!active) return;
        setUser(u);
        await loadAll();
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : 'The Team page could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
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

  if (loading) return <AdminLayout user={user}><BlobLoaderCentered /></AdminLayout>;

  return (
    <AdminLayout user={user}>
      <div className="portal-page-head">
        <div className="portal-eyebrow">TEAM</div>
        <h1 className="portal-h1">Team members</h1>
        <p className="portal-sub">
          Team accounts see only their own assigned tasks — no clients, no revenue, no finance data.
          Create one from Clients → "+ New account" → role "Team member (only sees their own tasks)".
        </p>
      </div>

      {loadError && (
        <div className="portal-error admin-team-load-error">
          <span>{loadError}</span>
          <button className="pill-btn tiny" type="button" onClick={loadAll}>Retry</button>
        </div>
      )}
      {roleMessage && <div className={roleMessage.startsWith('Error') ? 'portal-error' : 'portal-success'}>{roleMessage}</div>}

      <div className="portal-card">
        <h2 className="portal-h2">All accounts</h2>
        <p className="portal-sub" style={{ marginTop: -2 }}>Every account, whatever its role — change someone's access level here.</p>
        <div className="portal-table-wrap">
          <table className="portal-table admin-team-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a._id}>
                  <td>{a.name}</td>
                  <td>{a.email}</td>
                  <td><span className="portal-badge sent" style={{ textTransform: 'capitalize' }}>{a.role}</span></td>
                  <td>
                    <select
                      value={a.role}
                      onChange={(e) => changeRole(a._id, e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: 8, background: '#0a0a0b', border: '1px solid rgba(214,209,198,.2)', color: '#eceae4', fontSize: '.7rem' }}
                    >
                      <option value="client">Client</option>
                      <option value="team">Team member</option>
                      <option value="admin">Admin (full access)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="portal-card">
        {team.length === 0 ? (
          <div className="portal-empty">No team members yet. Add one from the Clients page → "+ New account" → role "Team member".</div>
        ) : (
          <div className="portal-table-wrap">
            <table className="portal-table admin-team-table">
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
          </div>
        )}
      </div>

      <div className="portal-card">
        <div className="admin-team-toolbar" style={{ marginBottom: showAssign ? 20 : 0 }}>
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
          <div className="portal-table-wrap">
            <table className="portal-table admin-team-table">
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
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

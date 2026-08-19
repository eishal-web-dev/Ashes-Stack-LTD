import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, Me } from './api';
import AdminLayout from './AdminLayout';

type LedgerEntry = { _id: string; category: string; amount: number; note?: string; date: string; paid: boolean };
type DashboardSlice = {
  totalRevenue: number; totalExpenses: number; totalMarketing: number; paidPayables: number;
  totalCashOut: number; netProfit: number; accountsPayable: number; cashOnHand: number;
  monthlyEarnings: { key: string; label: string; amount: number }[];
};

function pkr(n: number) { return `PKR ${Math.round(n).toLocaleString()}`; }

export default function AdminFinance() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Me | null>(null);
  const [data, setData] = useState<DashboardSlice | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [cashOnHand, setCashOnHand] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: 'expense', amount: '', note: '', date: new Date().toISOString().slice(0, 10), paid: true });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'expense' | 'marketing' | 'payable'>('all');

  async function loadAll() {
    const [d, l, s] = await Promise.all([
      fetch('/api/admin/dashboard').then((r) => r.json()),
      fetch('/api/admin/ledger-list').then((r) => r.json()),
      fetch('/api/admin/get-settings').then((r) => r.json()),
    ]);
    setData(d);
    setLedger(l);
    setCashOnHand(String(s.cashOnHand ?? 0));
  }

  useEffect(() => {
    getMe().then(async (u) => {
      if (!u) return navigate('/login');
      if (u.role !== 'admin') return navigate('/portal');
      setUser(u);
      await loadAll();
      setLoading(false);
    });
  }, [navigate]);

  async function saveCashOnHand() {
    await fetch('/api/admin/update-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cashOnHand: Number(cashOnHand) || 0 }),
    });
    loadAll();
  }

  async function addEntry(e: FormEvent) {
    e.preventDefault();
    if (!form.amount) return;
    setSaving(true);
    await fetch('/api/admin/ledger-add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: Number(form.amount), paid: form.category === 'payable' ? form.paid : true }),
    });
    setSaving(false);
    setForm({ category: 'expense', amount: '', note: '', date: new Date().toISOString().slice(0, 10), paid: true });
    loadAll();
  }

  async function deleteEntry(id: string) {
    if (!confirm('Delete this entry?')) return;
    await fetch(`/api/admin/ledger-delete?id=${id}`, { method: 'DELETE' });
    loadAll();
  }

  async function togglePaid(id: string, paid: boolean) {
    await fetch('/api/admin/ledger-toggle-paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, paid: !paid }),
    });
    loadAll();
  }

  if (loading || !data) return <AdminLayout user={user}><div>Loading…</div></AdminLayout>;

  const filtered = filter === 'all' ? ledger : ledger.filter((e) => e.category === filter);
  const isProfit = data.netProfit >= 0;

  return (
    <AdminLayout user={user}>
      <div className="portal-page-head">
        <div className="portal-eyebrow">FINANCE</div>
        <h1 className="portal-h1">Money in, money out</h1>
        <p className="portal-sub">Everything here is real — revenue from paid invoices, and whatever you log below.</p>
      </div>

      {/* The one number that matters, up top, plain and simple */}
      <div className="portal-card" style={{ borderColor: isProfit ? 'rgba(216,255,98,.35)' : 'rgba(255,73,108,.35)' }}>
        <h2 className="portal-h2" style={{ margin: 0 }}>All-time net {isProfit ? 'profit' : 'loss'}</h2>
        <div style={{ fontSize: '2.4rem', fontWeight: 800, color: isProfit ? '#d8ff62' : '#ff8fa3', margin: '10px 0' }}>
          {isProfit ? '' : '−'}{pkr(Math.abs(data.netProfit))}
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: '.78rem', color: '#8c8982', marginTop: 8 }}>
          <span>Revenue in: <b style={{ color: '#d8ff62' }}>{pkr(data.totalRevenue)}</b></span>
          <span>Expenses: <b style={{ color: '#ff8fa3' }}>−{pkr(data.totalExpenses)}</b></span>
          <span>Marketing: <b style={{ color: '#ff8fa3' }}>−{pkr(data.totalMarketing)}</b></span>
          <span>Bills paid: <b style={{ color: '#ff8fa3' }}>−{pkr(data.paidPayables)}</b></span>
        </div>
        {data.accountsPayable > 0 && (
          <p style={{ fontSize: '.72rem', color: '#ffb766', marginTop: 12, marginBottom: 0 }}>
            + {pkr(data.accountsPayable)} in unpaid bills still owed (not counted above until marked paid)
          </p>
        )}
      </div>

      <div className="portal-grid-2" style={{ marginBottom: 20 }}>
        <div className="portal-card" style={{ margin: 0 }}>
          <div style={{ fontSize: '.6rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8c8982', marginBottom: 8 }}>Cash on hand</div>
          <input
            type="number" value={cashOnHand} onChange={(e) => setCashOnHand(e.target.value)} onBlur={saveCashOnHand}
            placeholder="e.g. 50000"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#0a0a0b', border: '1px solid rgba(214,209,198,.2)', color: '#eceae4', font: '700 1.1rem "Courier New", monospace' }}
          />
          <div style={{ fontSize: '.64rem', color: '#66625b', marginTop: 8 }}>Update this whenever your actual bank/cash balance changes — powers Runway on the dashboard.</div>
        </div>
        <div className="portal-card" style={{ margin: 0 }}>
          <div style={{ fontSize: '.6rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8c8982', marginBottom: 8 }}>Unpaid bills owed</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: data.accountsPayable > 0 ? '#ffb766' : '#eceae4' }}>{pkr(data.accountsPayable)}</div>
          <div style={{ fontSize: '.64rem', color: '#66625b', marginTop: 8 }}>Mark a bill "paid" below once you actually pay it — it'll count against profit then, not before.</div>
        </div>
      </div>

      <div className="portal-card">
        <h2 className="portal-h2">Log something</h2>
        <p className="portal-sub" style={{ marginTop: -2 }}>
          A subscription payment (like an AI tool), ad spend, a domain renewal, or any other bill — log it here the moment it happens so your numbers stay real.
        </p>
        <form onSubmit={addEntry}>
          <div className="portal-grid-2">
            <div className="portal-field">
              <label>What kind of cost is this?</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="expense">Operating expense (tools, subscriptions, hosting, domain...)</option>
                <option value="marketing">Marketing / ad spend</option>
                <option value="payable">Bill I owe (may not be paid yet)</option>
              </select>
            </div>
            <div className="portal-field">
              <label>Amount (PKR)</label>
              <input type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 5700" />
            </div>
            <div className="portal-field">
              <label>What was it?</label>
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Claude subscription" />
            </div>
            <div className="portal-field">
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            {form.category === 'payable' && (
              <div className="portal-field" style={{ gridColumn: '1 / -1' }}>
                <label>Already paid this?</label>
                <select value={form.paid ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, paid: e.target.value === 'yes' })}>
                  <option value="no">Not yet — still owed</option>
                  <option value="yes">Yes, already paid</option>
                </select>
              </div>
            )}
          </div>
          <button className="pill-btn solid" disabled={saving}>{saving ? 'Adding…' : 'Add'}</button>
        </form>
      </div>

      <div className="portal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="portal-h2" style={{ margin: 0 }}>All entries</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'expense', 'marketing', 'payable'] as const).map((f) => (
              <button key={f} className="pill-btn tiny" style={filter === f ? { background: '#ff62c7', color: '#0a0a0b', borderColor: '#ff62c7' } : undefined} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="portal-empty">Nothing logged yet — add your first entry above.</div>
        ) : (
          <table className="portal-table">
            <thead><tr><th>Type</th><th>What</th><th>Date</th><th>Amount</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e._id}>
                  <td style={{ textTransform: 'capitalize' }}>{e.category}</td>
                  <td>{e.note || '—'}</td>
                  <td>{new Date(e.date).toLocaleDateString('en-GB')}</td>
                  <td>{pkr(e.amount)}</td>
                  <td>
                    {e.category === 'payable' ? (
                      <button className="pill-btn tiny" onClick={() => togglePaid(e._id, e.paid)}>
                        {e.paid ? '✓ Paid' : 'Unpaid — mark paid'}
                      </button>
                    ) : '—'}
                  </td>
                  <td>
                    <button className="pill-btn tiny" style={{ color: '#ff8fa3', borderColor: 'rgba(255,73,108,.4)' }} onClick={() => deleteEntry(e._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

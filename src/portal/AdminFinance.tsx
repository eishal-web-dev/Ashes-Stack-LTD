import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, Me } from './api';
import BrandLoader from './BrandLoader';
import AdminLayout from './AdminLayout';

type LedgerEntry = { _id: string; category: string; amount: number; note?: string; date: string; paid: boolean };
type DashboardSlice = {
  totalRevenue: number; totalExpenses: number; totalMarketing: number;
  totalCashOut: number; netProfit: number; accountsPayable: number; cashOnHand: number;
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
      if (u.role === 'team') return navigate('/team');
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
      body: JSON.stringify(form),
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

  if (loading || !data) return <AdminLayout user={user}><BrandLoader /></AdminLayout>;

  const moneyIn = data.totalRevenue;
  const moneyOut = data.totalCashOut;
  const isProfit = data.netProfit >= 0;
  const paidEntries = ledger.filter((e) => e.paid);
  const unpaidEntries = ledger.filter((e) => !e.paid);

  return (
    <AdminLayout user={user}>
      <div className="portal-page-head">
        <div className="portal-eyebrow">FINANCE</div>
        <h1 className="portal-h1">Money in, money out</h1>
        <p className="portal-sub">
          Simple rule: revenue comes from paid invoices automatically. Below, log anything you spend —
          it only counts against your profit once you mark it <b>Paid</b>. Still owe it? Leave it unpaid; it'll
          show under "Owed" instead, and you flip it to paid the moment you actually pay it.
        </p>
      </div>

      {/* Two plain numbers, side by side, then the answer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="portal-card" style={{ margin: 0, borderColor: 'rgba(216,255,98,.3)' }}>
          <div style={{ fontSize: '.62rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8c8982' }}>Money in</div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#d8ff62', marginTop: 6 }}>{pkr(moneyIn)}</div>
          <div style={{ fontSize: '.66rem', color: '#66625b', marginTop: 4 }}>From paid invoices</div>
        </div>
        <div className="portal-card" style={{ margin: 0, borderColor: 'rgba(255,73,108,.3)' }}>
          <div style={{ fontSize: '.62rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8c8982' }}>Money out</div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ff8fa3', marginTop: 6 }}>{pkr(moneyOut)}</div>
          <div style={{ fontSize: '.66rem', color: '#66625b', marginTop: 4 }}>Everything marked Paid below</div>
        </div>
      </div>

      <div className="portal-card" style={{ borderColor: isProfit ? 'rgba(216,255,98,.35)' : 'rgba(255,73,108,.35)', textAlign: 'center' }}>
        <div style={{ fontSize: '.64rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8c8982' }}>
          Money in − money out = your real {isProfit ? 'profit' : 'loss'}
        </div>
        <div style={{ fontSize: '2.6rem', fontWeight: 800, color: isProfit ? '#d8ff62' : '#ff8fa3', margin: '10px 0 0' }}>
          {isProfit ? '' : '−'}{pkr(Math.abs(data.netProfit))}
        </div>
        {data.accountsPayable > 0 && (
          <p style={{ fontSize: '.72rem', color: '#ffb766', marginTop: 12, marginBottom: 0 }}>
            Plus {pkr(data.accountsPayable)} still owed (not counted until you mark it Paid)
          </p>
        )}
      </div>

      <div className="portal-card">
        <div style={{ fontSize: '.6rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8c8982', marginBottom: 8 }}>Cash on hand</div>
        <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#eceae4' }}>{pkr(data.cashOnHand)}</div>
        <div style={{ fontSize: '.66rem', color: '#66625b', marginTop: 6 }}>
          Updates itself automatically — your starting balance below, plus everything earned, minus everything paid out.
        </div>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(214,209,198,.1)' }}>
          <label style={{ display: 'block', fontSize: '.6rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#a19e97', marginBottom: 8 }}>
            Starting balance (set once — your actual bank balance the day you started tracking here)
          </label>
          <input
            type="number" value={cashOnHand} onChange={(e) => setCashOnHand(e.target.value)} onBlur={saveCashOnHand}
            placeholder="e.g. 50000"
            style={{ width: 220, padding: '10px 12px', borderRadius: 8, background: '#0a0a0b', border: '1px solid rgba(214,209,198,.2)', color: '#eceae4', font: '700 .95rem "Courier New", monospace' }}
          />
        </div>
      </div>

      <div className="portal-card">
        <h2 className="portal-h2">Log a cost</h2>
        <form onSubmit={addEntry}>
          <div className="portal-grid-2">
            <div className="portal-field">
              <label>What was it for?</label>
              <input required value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Claude subscription, domain renewal" />
            </div>
            <div className="portal-field">
              <label>Amount (PKR)</label>
              <input type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 5700" />
            </div>
            <div className="portal-field">
              <label>Type</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="expense">General expense (tools, hosting, domain, subscriptions)</option>
                <option value="marketing">Marketing / ad spend</option>
              </select>
            </div>
            <div className="portal-field">
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, margin: '4px 0 18px' }}>
            <button type="button" onClick={() => setForm({ ...form, paid: true })}
              className="pill-btn" style={form.paid ? { background: '#d8ff62', color: '#0a0a0b', borderColor: '#d8ff62' } : undefined}>
              ✓ Already paid
            </button>
            <button type="button" onClick={() => setForm({ ...form, paid: false })}
              className="pill-btn" style={!form.paid ? { background: '#ffb766', color: '#0a0a0b', borderColor: '#ffb766' } : undefined}>
              Still owed
            </button>
          </div>
          <button className="pill-btn solid" disabled={saving}>{saving ? 'Adding…' : 'Add'}</button>
        </form>
      </div>

      <div className="portal-card">
        <h2 className="portal-h2">Paid — counts against your profit</h2>
        {paidEntries.length === 0 ? (
          <div className="portal-empty">Nothing logged yet.</div>
        ) : (
          <table className="portal-table">
            <thead><tr><th>What</th><th>Type</th><th>Date</th><th>Amount</th><th></th></tr></thead>
            <tbody>
              {paidEntries.map((e) => (
                <tr key={e._id}>
                  <td>{e.note || '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{e.category}</td>
                  <td>{new Date(e.date).toLocaleDateString('en-GB')}</td>
                  <td>{pkr(e.amount)}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="pill-btn tiny" onClick={() => togglePaid(e._id, e.paid)}>Mark unpaid</button>
                    <button className="pill-btn tiny" style={{ color: '#ff8fa3', borderColor: 'rgba(255,73,108,.4)' }} onClick={() => deleteEntry(e._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {unpaidEntries.length > 0 && (
        <div className="portal-card" style={{ borderColor: 'rgba(255,183,102,.3)' }}>
          <h2 className="portal-h2" style={{ color: '#ffb766' }}>Still owed — not counted yet</h2>
          <table className="portal-table">
            <thead><tr><th>What</th><th>Type</th><th>Date</th><th>Amount</th><th></th></tr></thead>
            <tbody>
              {unpaidEntries.map((e) => (
                <tr key={e._id}>
                  <td>{e.note || '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{e.category}</td>
                  <td>{new Date(e.date).toLocaleDateString('en-GB')}</td>
                  <td>{pkr(e.amount)}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="pill-btn tiny solid" onClick={() => togglePaid(e._id, e.paid)}>✓ Mark paid</button>
                    <button className="pill-btn tiny" style={{ color: '#ff8fa3', borderColor: 'rgba(255,73,108,.4)' }} onClick={() => deleteEntry(e._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

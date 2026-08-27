import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, Me } from './api';
import { BlobLoaderCentered } from '../components/BlobLoader';
import AdminLayout from './AdminLayout';

type LedgerEntry = { _id: string; category: string; amount: number; note?: string; date: string; paid: boolean };
type DashboardSlice = {
  totalRevenue: number; totalExpenses: number; totalMarketing: number;
  totalCashOut: number; netProfit: number; accountsPayable: number; cashOnHand: number;
  manualIncome: number; pendingIncome: number;
  monthlyEarnings: { key: string; label: string; amount: number }[];
};

function pkr(n: number) { return `PKR ${Math.round(n).toLocaleString()}`; }


type FinanceMonth = { key: string; label: string; income: number; out: number; net: number };

function monthlyFinance(data: DashboardSlice, ledger: LedgerEntry[]): FinanceMonth[] {
  const invoiceIncome = new Map(data.monthlyEarnings.map((month) => [month.key, month.amount]));
  const months: FinanceMonth[] = [];
  const now = new Date();

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
    const entries = ledger.filter((entry) => entry.paid && entry.date.slice(0, 7) === key);
    const directIncome = entries
      .filter((entry) => entry.category === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);
    const out = entries
      .filter((entry) => entry.category !== 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);
    const income = (invoiceIncome.get(key) || 0) + directIncome;

    months.push({
      key,
      label: date.toLocaleString('en-GB', { month: 'short' }),
      income,
      out,
      net: income - out,
    });
  }

  return months;
}

function FinancialCharts({ months, expenses, marketing }: {
  months: FinanceMonth[];
  expenses: number;
  marketing: number;
}) {
  const maxValue = Math.max(1, ...months.flatMap((month) => [month.income, month.out]));
  const plotTop = 18;
  const plotHeight = 150;
  const baseline = plotTop + plotHeight;
  const barWidth = 18;
  const groupWidth = 100;
  const hasTrendData = months.some((month) => month.income > 0 || month.out > 0);
  const spendTotal = expenses + marketing;
  const categories = [
    { label: 'Operations', value: expenses, color: '#66ebf2' },
    { label: 'Marketing', value: marketing, color: '#ffb766' },
  ];
  const strongestMonth = months.reduce((best, month) => month.net > best.net ? month : best, months[0]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 310px), 1fr))', gap: 16, marginBottom: 20 }}>
      <div className="portal-card" style={{ margin: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap' }}>
          <div>
            <div className="portal-eyebrow">6-MONTH VIEW</div>
            <h2 className="portal-h2" style={{ margin: '6px 0 4px' }}>Cash flow trend</h2>
            <div style={{ color: '#77736c', fontSize: '.68rem' }}>Received income compared with money actually paid out.</div>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: '.66rem', color: '#9b978f' }}>
            <span><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#d8ff62', marginRight: 6 }} />Money in</span>
            <span><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#ff496c', marginRight: 6 }} />Money out</span>
          </div>
        </div>
        {hasTrendData ? (
          <>
            <svg viewBox="0 0 620 215" role="img" aria-label="Money in and money out for the last six months" style={{ display: 'block', width: '100%', minHeight: 210 }}>
              {[0, .5, 1].map((ratio) => {
                const y = plotTop + plotHeight * ratio;
                return <line key={ratio} x1="12" y1={y} x2="608" y2={y} stroke="rgba(214,209,198,.10)" strokeWidth="1" />;
              })}
              {months.map((month, index) => {
                const x = 38 + index * groupWidth;
                const incomeHeight = (month.income / maxValue) * plotHeight;
                const outHeight = (month.out / maxValue) * plotHeight;
                return (
                  <g key={month.key}>
                    <rect x={x} y={baseline - incomeHeight} width={barWidth} height={incomeHeight} rx="5" fill="#d8ff62" />
                    <rect x={x + 23} y={baseline - outHeight} width={barWidth} height={outHeight} rx="5" fill="#ff496c" />
                    <text x={x + 20} y="195" textAnchor="middle" fill="#8c8982" fontSize="11" fontWeight="700">{month.label}</text>
                  </g>
                );
              })}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, borderTop: '1px solid rgba(214,209,198,.1)', paddingTop: 14, flexWrap: 'wrap' }}>
              <span style={{ color: '#77736c', fontSize: '.68rem' }}>Best net month</span>
              <strong style={{ color: strongestMonth.net >= 0 ? '#d8ff62' : '#ff8fa3', fontSize: '.75rem' }}>
                {strongestMonth.label}: {strongestMonth.net >= 0 ? '+' : '−'}{pkr(Math.abs(strongestMonth.net))}
              </strong>
            </div>
          </>
        ) : (
          <div className="portal-empty" style={{ minHeight: 210, display: 'grid', placeItems: 'center' }}>
            Add income or costs to start your monthly graph.
          </div>
        )}
      </div>

      <div className="portal-card" style={{ margin: 0 }}>
        <div className="portal-eyebrow">SPENDING MIX</div>
        <h2 className="portal-h2" style={{ margin: '6px 0 4px' }}>Where money went</h2>
        <div style={{ color: '#77736c', fontSize: '.68rem', marginBottom: 26 }}>Only settled costs are included.</div>
        {spendTotal > 0 ? (
          <>
            <div style={{
              width: 132,
              height: 132,
              borderRadius: '50%',
              margin: '0 auto 26px',
              background: 'conic-gradient(#66ebf2 0 ' + ((expenses / spendTotal) * 100) + '%, #ffb766 0 100%)',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 0 38px rgba(102,235,242,.08)',
            }}>
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#111113', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '.56rem', color: '#77736c', textTransform: 'uppercase', letterSpacing: '.08em' }}>Total</div>
                  <strong style={{ color: '#eceae4', fontSize: '.72rem' }}>{pkr(spendTotal)}</strong>
                </div>
              </div>
            </div>
            {categories.map((category) => {
              const percent = spendTotal ? Math.round((category.value / spendTotal) * 100) : 0;
              return (
                <div key={category.label} style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '.68rem', marginBottom: 7 }}>
                    <span style={{ color: '#a19e97' }}>{category.label}</span>
                    <strong style={{ color: category.color }}>{percent}%</strong>
                  </div>
                  <div style={{ height: 7, borderRadius: 99, background: 'rgba(214,209,198,.08)', overflow: 'hidden' }}>
                    <div style={{ width: percent + '%', height: '100%', borderRadius: 99, background: category.color }} />
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="portal-empty" style={{ minHeight: 210, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
            Mark costs as paid to see the breakdown.
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminFinance() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Me | null>(null);
  const [data, setData] = useState<DashboardSlice | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [cashOnHand, setCashOnHand] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: 'expense', amount: '', note: '', date: new Date().toISOString().slice(0, 10), paid: true });
  const [incomeForm, setIncomeForm] = useState({ category: 'income', amount: '', note: '', date: new Date().toISOString().slice(0, 10), paid: true });
  const [savingIncome, setSavingIncome] = useState(false);
  const [saving, setSaving] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'income' | 'cost' | 'pending'>('all');
  const [transactionQuery, setTransactionQuery] = useState('');

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

  async function addIncome(e: FormEvent) {
    e.preventDefault();
    if (!incomeForm.amount) return;
    setSavingIncome(true);
    await fetch('/api/admin/ledger-add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incomeForm),
    });
    setSavingIncome(false);
    setIncomeForm({ category: 'income', amount: '', note: '', date: new Date().toISOString().slice(0, 10), paid: true });
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

  if (loading || !data) return <AdminLayout user={user}><BlobLoaderCentered /></AdminLayout>;

  const moneyIn = data.totalRevenue;
  const moneyOut = data.totalCashOut;
  const isProfit = data.netProfit >= 0;
  const paidEntries = ledger.filter((e) => e.paid);
  const financeMonths = monthlyFinance(data, ledger);
  const currentMonth = financeMonths[financeMonths.length - 1];
  const filteredEntries = [...ledger]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter((entry) => {
      if (transactionFilter === 'income' && entry.category !== 'income') return false;
      if (transactionFilter === 'cost' && entry.category === 'income') return false;
      if (transactionFilter === 'pending' && entry.paid) return false;
      return (entry.note || entry.category).toLowerCase().includes(transactionQuery.toLowerCase());
    });

  return (
    <AdminLayout user={user}>
      <div className="portal-page-head">
        <div className="portal-eyebrow">FINANCE</div>
        <h1 className="portal-h1">Money in, money out</h1>
        <p className="portal-sub">
          A clear view of what came in, what went out, what is still pending, and where your cash is going.
        </p>
      </div>

      {/* Two plain numbers, side by side, then the answer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="portal-card" style={{ margin: 0, borderColor: 'rgba(216,255,98,.3)' }}>
          <div style={{ fontSize: '.62rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8c8982' }}>Money in</div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#d8ff62', marginTop: 6 }}>{pkr(moneyIn)}</div>
          <div style={{ fontSize: '.66rem', color: '#66625b', marginTop: 4 }}>
            From paid invoices{data.manualIncome > 0 ? ` + ${pkr(data.manualIncome)} logged directly` : ''}
          </div>
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

      <FinancialCharts
        months={financeMonths}
        expenses={data.totalExpenses}
        marketing={data.totalMarketing}
      />

      <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 22px 14px' }}>
          <div className="portal-eyebrow">THIS MONTH</div>
          <h2 className="portal-h2" style={{ margin: '6px 0 0' }}>At a glance</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', borderTop: '1px solid rgba(214,209,198,.1)' }}>
          {[
            { label: 'Received', value: currentMonth.income, color: '#d8ff62', hint: 'Income recorded this month' },
            { label: 'Spent', value: currentMonth.out, color: '#ff8fa3', hint: 'Paid costs this month' },
            { label: 'Net movement', value: currentMonth.net, color: currentMonth.net >= 0 ? '#66ebf2' : '#ff8fa3', hint: 'Received minus spent' },
            { label: 'Still pending', value: data.accountsPayable + data.pendingIncome, color: '#ffb766', hint: 'Money awaiting settlement' },
          ].map((item, index) => (
            <div key={item.label} style={{ padding: '20px 22px', borderRight: index < 3 ? '1px solid rgba(214,209,198,.1)' : undefined }}>
              <div style={{ fontSize: '.58rem', color: '#77736c', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>{item.label}</div>
              <div style={{ color: item.color, fontSize: '1.25rem', fontWeight: 800, marginTop: 8 }}>
                {item.label === 'Net movement' && item.value < 0 ? '−' : ''}{pkr(Math.abs(item.value))}
              </div>
              <div style={{ color: '#66625b', fontSize: '.62rem', marginTop: 5 }}>{item.hint}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="portal-card" style={{ borderColor: 'rgba(216,255,98,.3)' }}>
        <h2 className="portal-h2" style={{ color: '#d8ff62' }}>Log money in</h2>
        <p className="portal-sub" style={{ marginTop: -2 }}>
          For income that isn't a client invoice — cash payment, a side gig, anything else coming in.
          Invoices from clients already count automatically, don't re-log those here.
        </p>
        <form onSubmit={addIncome}>
          <div className="portal-grid-2">
            <div className="portal-field">
              <label>What was it for?</label>
              <input required value={incomeForm.note} onChange={(e) => setIncomeForm({ ...incomeForm, note: e.target.value })} placeholder="e.g. Cash payment, referral bonus" />
            </div>
            <div className="portal-field">
              <label>Amount (PKR)</label>
              <input type="number" required value={incomeForm.amount} onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })} placeholder="e.g. 2000" />
            </div>
            <div className="portal-field">
              <label>Date</label>
              <input type="date" value={incomeForm.date} onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, margin: '4px 0 18px' }}>
            <button type="button" onClick={() => setIncomeForm({ ...incomeForm, paid: true })}
              className="pill-btn" style={incomeForm.paid ? { background: '#d8ff62', color: '#0a0a0b', borderColor: '#d8ff62' } : undefined}>
              ✓ Already received
            </button>
            <button type="button" onClick={() => setIncomeForm({ ...incomeForm, paid: false })}
              className="pill-btn" style={!incomeForm.paid ? { background: '#ffb766', color: '#0a0a0b', borderColor: '#ffb766' } : undefined}>
              Expected, not yet received
            </button>
          </div>
          <button className="pill-btn solid" style={{ background: '#d8ff62', color: '#0a0a0b', borderColor: '#d8ff62' }} disabled={savingIncome}>
            {savingIncome ? 'Adding…' : 'Add'}
          </button>
        </form>
        {data.pendingIncome > 0 && (
          <p style={{ fontSize: '.72rem', color: '#ffb766', marginTop: 14, marginBottom: 0 }}>
            {pkr(data.pendingIncome)} expected but not yet received — not counted in Money In until you mark it received.
          </p>
        )}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <div className="portal-eyebrow">LEDGER</div>
            <h2 className="portal-h2" style={{ margin: '6px 0 4px' }}>Transactions</h2>
            <div style={{ color: '#77736c', fontSize: '.68rem' }}>{ledger.length} total entries · newest first</div>
          </div>
          <input
            aria-label="Search transactions"
            value={transactionQuery}
            onChange={(e) => setTransactionQuery(e.target.value)}
            placeholder="Search transactions…"
            style={{ minWidth: 220, padding: '10px 12px', borderRadius: 9, background: '#0a0a0b', border: '1px solid rgba(214,209,198,.16)', color: '#eceae4' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {([
            ['all', 'All'],
            ['income', 'Money in'],
            ['cost', 'Money out'],
            ['pending', 'Pending'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="pill-btn tiny"
              onClick={() => setTransactionFilter(value)}
              style={transactionFilter === value ? { background: '#eceae4', color: '#0a0a0b', borderColor: '#eceae4' } : undefined}
            >
              {label}
            </button>
          ))}
        </div>

        {filteredEntries.length === 0 ? (
          <div className="portal-empty">No transactions match this view.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="portal-table">
              <thead><tr><th>Transaction</th><th>Status</th><th>Date</th><th>Amount</th><th></th></tr></thead>
              <tbody>
                {filteredEntries.map((entry) => {
                  const isIncome = entry.category === 'income';
                  return (
                    <tr key={entry._id}>
                      <td>
                        <div style={{ color: '#eceae4', fontWeight: 700 }}>{entry.note || 'Untitled transaction'}</div>
                        <div style={{ color: '#66625b', fontSize: '.61rem', textTransform: 'capitalize', marginTop: 3 }}>{entry.category}</div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          padding: '4px 8px',
                          borderRadius: 99,
                          fontSize: '.58rem',
                          fontWeight: 800,
                          color: entry.paid ? (isIncome ? '#d8ff62' : '#66ebf2') : '#ffb766',
                          background: entry.paid ? (isIncome ? 'rgba(216,255,98,.08)' : 'rgba(102,235,242,.08)') : 'rgba(255,183,102,.08)',
                          border: '1px solid currentColor',
                        }}>
                          {entry.paid ? (isIncome ? 'RECEIVED' : 'PAID') : 'PENDING'}
                        </span>
                      </td>
                      <td>{new Date(entry.date).toLocaleDateString('en-GB')}</td>
                      <td style={{ color: isIncome ? '#d8ff62' : '#ff8fa3', fontWeight: 800 }}>
                        {isIncome ? '+' : '−'}{pkr(entry.amount)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button className="pill-btn tiny" onClick={() => togglePaid(entry._id, entry.paid)}>
                            {entry.paid ? (isIncome ? 'Mark pending' : 'Mark unpaid') : (isIncome ? 'Mark received' : 'Mark paid')}
                          </button>
                          <button className="pill-btn tiny" style={{ color: '#ff8fa3', borderColor: 'rgba(255,73,108,.4)' }} onClick={() => deleteEntry(entry._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

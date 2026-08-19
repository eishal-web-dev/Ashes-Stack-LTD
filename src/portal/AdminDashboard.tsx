import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, Me } from './api';
import BrandLoader from './BrandLoader';
import AdminLayout from './AdminLayout';

type DashboardData = {
  totalRevenue: number; outstandingPayments: number; outstandingInvoiceCount: number; avgProjectValue: number;
  grossMarginPct: number | null; netProfit: number; netMarginPct: number | null;
  costPerProject: number | null; profitPerProject: number | null;
  monthlyEarnings: { key: string; label: string; amount: number }[];
  revenueByService: Record<string, number>;
  accountsReceivable: number; accountsPayable: number;
  cashOnHand: number; burnRate: number; runwayMonths: number | null; cashFlow: number;
  totalExpenses: number; totalMarketing: number;
  arpu: number; revenuePerLead: number; revenuePerPayingClient: number; ltv: number;
  cac: number | null; ltvCacRatio: number | null;
  repeatPurchaseRate: number | null; retentionRate: number | null; churnRate: number | null;
  clientConcentrationRisk: number | null;
  stageCounts: Record<string, number>; pipelineValue: number; weightedPipelineValue: number;
  sourceCounts: Record<string, number>; totalClients: number; payingClientCount: number;
  conversionRate: number; repeatClients: number; winRate: number | null; lossRate: number | null;
  avgDaysToClose: number | null; avgLeadResponseHours: number | null;
  staleClients: number;
};

type LedgerEntry = { _id: string; category: string; amount: number; note?: string; date: string; paid: boolean };

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead', contacted: 'Contacted', demo: 'Demo', proposal: 'Proposal',
  won: 'Won', in_progress: 'In Progress', delivered: 'Delivered', paid: 'Paid',
  review: 'Review', repeat_client: 'Repeat Client', lost: 'Lost',
};
const PIPELINE_ORDER = ['lead', 'contacted', 'demo', 'proposal', 'won', 'in_progress', 'delivered', 'paid', 'review', 'repeat_client'];
const SOURCE_LABELS: Record<string, string> = { whatsapp: 'WhatsApp', linkedin: 'LinkedIn', instagram: 'Instagram', fiverr: 'Fiverr', referral: 'Referral', other: 'Other' };

function pkr(n: number) { return `PKR ${Math.round(n).toLocaleString()}`; }
function pct(n: number | null) { return n === null ? '—' : `${n}%`; }

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Me | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [cashOnHand, setCashOnHand] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFinance, setShowFinance] = useState(false);
  const [ledgerForm, setLedgerForm] = useState({ category: 'expense', amount: '', note: '', date: new Date().toISOString().slice(0, 10), paid: true });
  const [savingLedger, setSavingLedger] = useState(false);

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

  async function addLedgerEntry(e: FormEvent) {
    e.preventDefault();
    if (!ledgerForm.amount) return;
    setSavingLedger(true);
    await fetch('/api/admin/ledger-add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ledgerForm, amount: Number(ledgerForm.amount) }),
    });
    setSavingLedger(false);
    setLedgerForm({ category: 'expense', amount: '', note: '', date: new Date().toISOString().slice(0, 10), paid: true });
    loadAll();
  }

  async function deleteLedgerEntry(id: string) {
    if (!confirm('Delete this entry?')) return;
    await fetch(`/api/admin/ledger-delete?id=${id}`, { method: 'DELETE' });
    loadAll();
  }

  async function togglePayablePaid(id: string, paid: boolean) {
    await fetch('/api/admin/ledger-toggle-paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, paid: !paid }),
    });
    loadAll();
  }

  if (loading || !data) return <AdminLayout user={user}><BrandLoader /></AdminLayout>;

  const maxMonthly = Math.max(1, ...data.monthlyEarnings.map((m) => m.amount));
  const maxStage = Math.max(1, ...PIPELINE_ORDER.map((s) => data.stageCounts[s] || 0));
  const totalSourceClients = Object.values(data.sourceCounts).reduce((a, b) => a + b, 0) || 1;
  const serviceEntries = Object.entries(data.revenueByService).sort((a, b) => b[1] - a[1]);
  const maxService = Math.max(1, ...serviceEntries.map(([, v]) => v));

  return (
    <AdminLayout user={user}>
      <div className="portal-page-head">
        <div className="portal-eyebrow">BUSINESS DASHBOARD</div>
        <h1 className="portal-h1">Command center</h1>
        <p className="portal-sub">
          Every number is computed from real data — invoices, client stages, and what you log below.
          Two things are deliberately absent: <b>MRR/ARR</b> (your invoices are one-off projects, not recurring
          billing — doesn't apply until you run retainers) and <b>Utilization / billable hours</b> (needs real
          time-tracking, which doesn't exist yet). Everything else here is real.
        </p>
      </div>

      {(data.staleClients > 0 || data.outstandingInvoiceCount > 0) && (
          <div className="portal-card" style={{ borderColor: 'rgba(255,98,199,.35)' }}>
            <h2 className="portal-h2" style={{ color: '#ff62c7' }}>Needs attention today</h2>
            <div className="portal-btn-grid">
              {data.outstandingInvoiceCount > 0 && (
                <div className="portal-card" style={{ margin: 0, padding: 16 }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ff8fa3' }}>{data.outstandingInvoiceCount}</div>
                  <div style={{ fontSize: '.7rem', color: '#8c8982' }}>invoice(s) unpaid — {pkr(data.outstandingPayments)} total</div>
                </div>
              )}
              {data.staleClients > 0 && (
                <div className="portal-card" style={{ margin: 0, padding: 16 }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffb766' }}>{data.staleClients}</div>
                  <div style={{ fontSize: '.7rem', color: '#8c8982' }}>client(s) stuck in the same stage 7+ days</div>
                </div>
              )}
              {data.accountsPayable > 0 && (
                <div className="portal-card" style={{ margin: 0, padding: 16 }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffb766' }}>{pkr(data.accountsPayable)}</div>
                  <div style={{ fontSize: '.7rem', color: '#8c8982' }}>unpaid bills (accounts payable)</div>
                </div>
              )}
            </div>
          </div>
        )}

        <SectionLabel>Revenue &amp; Profitability</SectionLabel>
        <div className="portal-btn-grid" style={{ marginBottom: 20 }}>
          <KpiCard label="Gross Revenue" value={pkr(data.totalRevenue)} sub="From paid invoices" />
          <KpiCard label="Net Profit" value={pkr(data.netProfit)} sub="Revenue − expenses − marketing" />
          <KpiCard label="Gross Margin %" value={pct(data.grossMarginPct)} sub={data.grossMarginPct === null ? 'Log project cost on invoices to enable' : 'Profit before overhead'} />
          <KpiCard label="Net Margin %" value={pct(data.netMarginPct)} sub="Final profit as % of revenue" />
          <KpiCard label="Avg Project Value (AOV)" value={pkr(data.avgProjectValue)} sub="Across all invoices sent" />
          <KpiCard label="Cost per Project" value={data.costPerProject === null ? '—' : pkr(data.costPerProject)} sub={data.costPerProject === null ? 'No costs logged yet' : 'Avg, where cost was logged'} />
          <KpiCard label="Profit per Project" value={data.profitPerProject === null ? '—' : pkr(data.profitPerProject)} sub="Avg, where cost was logged" />
          <KpiCard label="Accounts Receivable" value={pkr(data.accountsReceivable)} sub="Money clients owe you" />
          <KpiCard label="Accounts Payable" value={pkr(data.accountsPayable)} sub="Money you owe others" />
        </div>

        <SectionLabel>Cash &amp; Runway</SectionLabel>
        <div className="portal-btn-grid" style={{ marginBottom: 20 }}>
          <KpiCard label="Cash Flow" value={pkr(data.cashFlow)} sub="Revenue − cash out, all-time" />
          <KpiCard label="Burn Rate" value={pkr(data.burnRate)} sub="Avg monthly cash out, last 3mo" />
          <KpiCard label="Runway" value={data.runwayMonths === null ? '—' : `${data.runwayMonths} mo`} sub="Cash on hand ÷ burn rate" />
          <KpiCard label="Cash on Hand" value={pkr(data.cashOnHand)} sub="Auto-updates — see Finance page" />
        </div>

        <SectionLabel>Customer Economics</SectionLabel>
        <div className="portal-btn-grid" style={{ marginBottom: 20 }}>
          <KpiCard label="CAC" value={data.cac === null ? '—' : pkr(data.cac)} sub={data.cac === null ? 'Log marketing spend to enable' : 'Marketing spend ÷ all clients'} />
          <KpiCard label="LTV (to date)" value={pkr(data.ltv)} sub="Revenue per paying client — not a projection" />
          <KpiCard label="LTV : CAC" value={data.ltvCacRatio === null ? '—' : `${data.ltvCacRatio}:1`} sub="Above 3:1 is generally healthy" />
          <KpiCard label="ARPU" value={pkr(data.arpu)} sub="Total revenue ÷ all clients" />
          <KpiCard label="Revenue per Lead" value={pkr(data.revenuePerLead)} sub="Same population as ARPU currently" />
          <KpiCard label="Revenue per Paying Client" value={pkr(data.revenuePerPayingClient)} sub="Only clients who've paid" />
          <KpiCard label="Repeat Purchase Rate" value={pct(data.repeatPurchaseRate)} sub="Paying clients with 2+ invoices" />
          <KpiCard label="Retention Rate" value={pct(data.retentionRate)} sub="Clients not marked Lost" />
          <KpiCard label="Churn Rate" value={pct(data.churnRate)} sub="Clients marked Lost" />
          <KpiCard label="Client Concentration Risk" value={pct(data.clientConcentrationRisk)} sub="Biggest client's share of revenue" />
        </div>

        <SectionLabel>Pipeline &amp; Sales</SectionLabel>
        <div className="portal-btn-grid" style={{ marginBottom: 20 }}>
          <KpiCard label="Pipeline Value" value={pkr(data.pipelineValue)} sub="Open deals, by deal value" />
          <KpiCard label="Weighted Pipeline" value={pkr(data.weightedPipelineValue)} sub="Value × stage win probability" />
          <KpiCard label="Conversion Rate" value={`${data.conversionRate}%`} sub="Reached Won or later" />
          <KpiCard label="Win Rate" value={pct(data.winRate)} sub="Of decided deals (won vs lost)" />
          <KpiCard label="Loss Rate" value={pct(data.lossRate)} sub="Of decided deals" />
          <KpiCard label="Sales Cycle Length" value={data.avgDaysToClose === null ? '—' : `${data.avgDaysToClose}d`} sub="Signup → first paid invoice" />
          <KpiCard label="Lead Response Time" value={data.avgLeadResponseHours === null ? '—' : `${data.avgLeadResponseHours}h`} sub="Signup → first stage change" />
          <KpiCard label="Repeat Clients" value={String(data.repeatClients)} sub="Marked Repeat Client stage" />
          <KpiCard label="Total Clients" value={String(data.totalClients)} sub={`${data.payingClientCount} have paid at least once`} />
        </div>

        <div className="portal-card">
          <h2 className="portal-h2">Monthly earnings</h2>
          <p className="portal-sub" style={{ marginTop: -2 }}>Paid invoices, last 6 months.</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 140, marginTop: 20 }}>
            {data.monthlyEarnings.map((m) => (
              <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: '.62rem', color: '#8c8982' }}>{m.amount > 0 ? pkr(m.amount) : ''}</div>
                <div style={{
                  width: '100%', maxWidth: 46,
                  height: `${Math.max(4, (m.amount / maxMonthly) * 100)}px`,
                  background: m.amount > 0 ? 'linear-gradient(180deg, #ff62c7, #ad77ff)' : 'rgba(255,255,255,.06)',
                  borderRadius: '6px 6px 2px 2px',
                }} />
                <div style={{ fontSize: '.68rem', color: '#8c8982', fontWeight: 700 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {serviceEntries.length > 0 && (
          <div className="portal-card">
            <h2 className="portal-h2">Profitability by service</h2>
            <p className="portal-sub" style={{ marginTop: -2 }}>Revenue by the "Service category" tag on your invoices.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {serviceEntries.map(([service, amount]) => (
                <div key={service} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 140, fontSize: '.7rem', color: '#d8d5ce' }}>{service}</div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,.05)', borderRadius: 6, overflow: 'hidden', height: 18 }}>
                    <div style={{ width: `${(amount / maxService) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #d8ff62, #66ebf2)' }} />
                  </div>
                  <div style={{ width: 90, fontSize: '.7rem', color: '#eceae4', fontWeight: 700, textAlign: 'right' }}>{pkr(amount)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="portal-card">
          <h2 className="portal-h2">Sales pipeline</h2>
          <p className="portal-sub" style={{ marginTop: -2 }}>Real client counts per stage — update from a client's file.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {PIPELINE_ORDER.map((stage) => {
              const count = data.stageCounts[stage] || 0;
              return (
                <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 110, fontSize: '.68rem', color: '#d8d5ce', textAlign: 'right' }}>{STAGE_LABELS[stage]}</div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,.05)', borderRadius: 6, overflow: 'hidden', height: 20 }}>
                    <div style={{
                      width: `${(count / maxStage) * 100}%`, minWidth: count > 0 ? '4px' : 0, height: '100%',
                      background: stage === 'repeat_client' ? '#d8ff62' : 'linear-gradient(90deg, #ff62c7, #ad77ff)',
                    }} />
                  </div>
                  <div style={{ width: 24, fontSize: '.72rem', fontWeight: 700, color: '#eceae4' }}>{count}</div>
                </div>
              );
            })}
            {data.stageCounts.lost > 0 && (
              <div style={{ fontSize: '.68rem', color: '#66625b', marginTop: 4 }}>+ {data.stageCounts.lost} marked Lost (not shown above)</div>
            )}
          </div>
        </div>

        <div className="portal-card">
          <h2 className="portal-h2">Client source</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {Object.entries(data.sourceCounts).sort((a, b) => b[1] - a[1]).map(([src, count]) => (
              <div key={src} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 90, fontSize: '.7rem', color: '#d8d5ce' }}>{SOURCE_LABELS[src] || src}</div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,.05)', borderRadius: 6, overflow: 'hidden', height: 16 }}>
                  <div style={{ width: `${(count / totalSourceClients) * 100}%`, height: '100%', background: '#66ebf2' }} />
                </div>
                <div style={{ width: 30, fontSize: '.7rem', color: '#8c8982' }}>{Math.round((count / totalSourceClients) * 100)}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="portal-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showFinance ? 20 : 0 }}>
            <div>
              <h2 className="portal-h2" style={{ margin: 0 }}>Finance — expenses, marketing spend &amp; bills</h2>
              <p className="portal-sub" style={{ margin: '4px 0 0' }}>This is what powers Burn Rate, Runway, CAC, Net Profit and Accounts Payable above.</p>
            </div>
            <button className="pill-btn" onClick={() => setShowFinance((v) => !v)}>{showFinance ? 'Hide' : 'Manage'}</button>
          </div>

          {showFinance && (
            <>
              <div className="portal-grid-2" style={{ marginBottom: 10 }}>
                <div className="portal-field">
                  <label>Starting balance (set once — see Finance page for the auto-updating figure)</label>
                  <input type="number" value={cashOnHand} onChange={(e) => setCashOnHand(e.target.value)} onBlur={saveCashOnHand} placeholder="e.g. 50000" />
                </div>
              </div>

              <form onSubmit={addLedgerEntry} style={{ marginTop: 10, marginBottom: 20, paddingTop: 20, borderTop: '1px solid rgba(214,209,198,.14)' }}>
                <div className="portal-grid-2">
                  <div className="portal-field">
                    <label>Type</label>
                    <select value={ledgerForm.category} onChange={(e) => setLedgerForm({ ...ledgerForm, category: e.target.value })}>
                      <option value="expense">General expense (tools, hosting, subscriptions)</option>
                      <option value="marketing">Marketing / ad spend</option>
                    </select>
                  </div>
                  <div className="portal-field">
                    <label>Amount (PKR)</label>
                    <input type="number" required value={ledgerForm.amount} onChange={(e) => setLedgerForm({ ...ledgerForm, amount: e.target.value })} />
                  </div>
                  <div className="portal-field">
                    <label>What was it?</label>
                    <input value={ledgerForm.note} onChange={(e) => setLedgerForm({ ...ledgerForm, note: e.target.value })} placeholder="e.g. Vercel hosting" />
                  </div>
                  <div className="portal-field">
                    <label>Date</label>
                    <input type="date" value={ledgerForm.date} onChange={(e) => setLedgerForm({ ...ledgerForm, date: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, margin: '4px 0 18px' }}>
                  <button type="button" onClick={() => setLedgerForm({ ...ledgerForm, paid: true })}
                    className="pill-btn" style={ledgerForm.paid ? { background: '#d8ff62', color: '#0a0a0b', borderColor: '#d8ff62' } : undefined}>
                    ✓ Already paid
                  </button>
                  <button type="button" onClick={() => setLedgerForm({ ...ledgerForm, paid: false })}
                    className="pill-btn" style={!ledgerForm.paid ? { background: '#ffb766', color: '#0a0a0b', borderColor: '#ffb766' } : undefined}>
                    Still owed
                  </button>
                </div>
                <button className="pill-btn solid" disabled={savingLedger}>{savingLedger ? 'Adding…' : 'Add entry'}</button>
              </form>

              <p style={{ fontSize: '.68rem', color: '#8c8982', marginBottom: 16 }}>
                For the simpler, dedicated view of this, see <a href="/admin/finance" style={{ color: '#ff62c7' }}>Finance</a> in the sidebar.
              </p>

              {ledger.length === 0 ? (
                <div className="portal-empty">No entries logged yet.</div>
              ) : (
                <table className="portal-table">
                  <thead><tr><th>Type</th><th>Note</th><th>Date</th><th>Amount</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {ledger.map((e) => (
                      <tr key={e._id}>
                        <td style={{ textTransform: 'capitalize' }}>{e.category}</td>
                        <td>{e.note || '—'}</td>
                        <td>{new Date(e.date).toLocaleDateString('en-GB')}</td>
                        <td>{pkr(e.amount)}</td>
                        <td>
                          <button className="pill-btn tiny" style={e.paid ? { background: '#d8ff62', color: '#0a0a0b', borderColor: '#d8ff62' } : { color: '#ffb766', borderColor: 'rgba(255,183,102,.4)' }} onClick={() => togglePayablePaid(e._id, e.paid)}>
                            {e.paid ? '✓ Paid' : 'Owed — mark paid'}
                          </button>
                        </td>
                        <td>
                          <button className="pill-btn tiny" style={{ color: '#ff8fa3', borderColor: 'rgba(255,73,108,.4)' }} onClick={() => deleteLedgerEntry(e._id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
    </AdminLayout>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#66625b', margin: '28px 0 12px' }}>{children}</div>;
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="portal-card" style={{ margin: 0 }}>
      <div style={{ fontSize: '.6rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8c8982', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#eceae4' }}>{value}</div>
      <div style={{ fontSize: '.64rem', color: '#66625b', marginTop: 6 }}>{sub}</div>
    </div>
  );
}

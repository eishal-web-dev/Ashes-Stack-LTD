import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMe, logout, Me } from './api';

type DashboardData = {
  totalRevenue: number;
  outstandingPayments: number;
  outstandingInvoiceCount: number;
  avgProjectValue: number;
  monthlyEarnings: { key: string; label: string; amount: number }[];
  stageCounts: Record<string, number>;
  pipelineValue: number;
  sourceCounts: Record<string, number>;
  totalClients: number;
  conversionRate: number;
  repeatClients: number;
  avgDaysToClose: number | null;
  staleClients: number;
};

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead', contacted: 'Contacted', demo: 'Demo', proposal: 'Proposal',
  won: 'Won', in_progress: 'In Progress', delivered: 'Delivered', paid: 'Paid',
  review: 'Review', repeat_client: 'Repeat Client', lost: 'Lost',
};
const PIPELINE_ORDER = ['lead', 'contacted', 'demo', 'proposal', 'won', 'in_progress', 'delivered', 'paid', 'review', 'repeat_client'];
const SOURCE_LABELS: Record<string, string> = { whatsapp: 'WhatsApp', linkedin: 'LinkedIn', instagram: 'Instagram', fiverr: 'Fiverr', referral: 'Referral', other: 'Other' };

function pkr(n: number) {
  return `PKR ${n.toLocaleString()}`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Me | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe().then(async (u) => {
      if (!u) return navigate('/login');
      if (u.role !== 'admin') return navigate('/portal');
      setUser(u);
      const d = await fetch('/api/admin/dashboard').then((r) => r.json());
      setData(d);
      setLoading(false);
    });
  }, [navigate]);

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  if (loading || !data) return <div className="portal-shell"><div className="portal-container">Loading…</div></div>;

  const maxMonthly = Math.max(1, ...data.monthlyEarnings.map((m) => m.amount));
  const maxStage = Math.max(1, ...PIPELINE_ORDER.map((s) => data.stageCounts[s] || 0));
  const totalSourceClients = Object.values(data.sourceCounts).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="portal-shell">
      <div className="portal-topbar">
        <div className="portal-brand">ASHES <span>· Admin</span></div>
        <div className="portal-nav-actions">
          <Link className="pill-btn tiny" to="/admin">Clients</Link>
          <Link className="pill-btn tiny" to="/admin/account">Account</Link>
          <span className="portal-user">{user?.name}</span>
          <button className="pill-btn tiny" onClick={onLogout}>Log out</button>
        </div>
      </div>

      <div className="portal-container">
        <div className="portal-eyebrow">BUSINESS DASHBOARD</div>
        <h1 className="portal-h1">Command center</h1>
        <p className="portal-sub">
          Every number below is computed from real data in your database — invoices, client stages, and sources you've entered.
          Nothing here is estimated or made up.
        </p>

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
                  <div style={{ fontSize: '.7rem', color: '#8c8982' }}>client(s) stuck in the same stage 7+ days — follow up</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="portal-btn-grid" style={{ marginBottom: 20 }}>
          <KpiCard label="Total Revenue" value={pkr(data.totalRevenue)} sub="From paid invoices" />
          <KpiCard label="Outstanding" value={pkr(data.outstandingPayments)} sub={`${data.outstandingInvoiceCount} unpaid invoice(s)`} />
          <KpiCard label="Avg Project Value" value={pkr(data.avgProjectValue)} sub="Across all invoices sent" />
          <KpiCard label="Pipeline Value" value={pkr(data.pipelineValue)} sub="Open deals, by deal value set per client" />
          <KpiCard label="Conversion Rate" value={`${data.conversionRate}%`} sub="Clients reaching Won or later" />
          <KpiCard label="Repeat Clients" value={String(data.repeatClients)} sub="Marked as Repeat Client stage" />
          <KpiCard label="Avg Days to Close" value={data.avgDaysToClose === null ? '—' : String(data.avgDaysToClose)} sub="Signup → first paid invoice" />
          <KpiCard label="Total Clients" value={String(data.totalClients)} sub="All client accounts" />
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

        <div className="portal-card">
          <h2 className="portal-h2">Sales pipeline</h2>
          <p className="portal-sub" style={{ marginTop: -2 }}>Real client counts per stage — update a client's stage from their file.</p>
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
          <p className="portal-sub" style={{ marginTop: -2 }}>Where your clients actually came from.</p>
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
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="portal-card" style={{ margin: 0 }}>
      <div style={{ fontSize: '.6rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8c8982', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#eceae4' }}>{value}</div>
      <div style={{ fontSize: '.64rem', color: '#66625b', marginTop: 6 }}>{sub}</div>
    </div>
  );
}

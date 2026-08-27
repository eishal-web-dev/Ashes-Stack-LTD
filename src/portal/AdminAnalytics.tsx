import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, Me } from './api';
import AdminLayout from './AdminLayout';
import { BlobLoaderCentered } from '../components/BlobLoader';

type Row = { label: string; count: number };
type Daily = { date: string; label: string; pageViews: number; signups: number; mcpCalls: number; shareViews: number };
type Recent = { event: string; path?: string; source?: string; country?: string; device?: string; createdAt: string; meta?: Record<string, unknown> };
type AnalyticsData = {
  rangeDays: number;
  trackingStartedAt: string | null;
  summary: {
    visits: number; pageViews: number; linkClicks: number; brainSignups: number; brainLogins: number;
    aiConnections: number; connectedBrainUsers: number; mcpCalls: number; shareViews: number; shareCreated: number;
    totalBrainUsers: number; activeBrainUsers: number; sharedBrains: number; signupConversionRate: number | null;
  };
  daily: Daily[];
  topPages: Row[];
  topSources: Row[];
  topCountries: Row[];
  topDevices: Row[];
  topLinks: Row[];
  topTools: Row[];
  topAiClients: Row[];
  recentEvents: Recent[];
  monetization: { adsenseConfigured: boolean };
};

function num(value: number) { return value.toLocaleString(); }
function pct(value: number | null) { return value === null ? '—' : `${value}%`; }

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  const cool = ['Visits', 'Page views', 'AI approvals', 'MCP actions', 'Total Brain users'].includes(label);
  const color = cool ? '#55d9ff' : '#d8ff62';
  return <div className="portal-card" style={{
    margin: 0,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    borderColor: cool ? 'rgba(85,217,255,.18)' : 'rgba(216,255,98,.16)',
    background: 'linear-gradient(145deg,rgba(255,255,255,.035),rgba(255,255,255,.008))',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.035)',
  }}>
    <div style={{ position: 'absolute', width: 90, height: 90, borderRadius: '50%', right: -40, top: -42, background: color, opacity: .08, filter: 'blur(22px)' }} />
    <div style={{ color: '#8c8982', fontSize: '.6rem', letterSpacing: '.11em', textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
    <div style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-.05em', marginTop: 8, color: '#f5f3ed' }}>{value}</div>
    <div style={{ color: '#6f6c66', fontSize: '.64rem', marginTop: 6, lineHeight: 1.5 }}>{sub}</div>
    <div style={{ width: 28, height: 2, borderRadius: 99, background: color, marginTop: 16, boxShadow: '0 0 14px ' + color }} />
  </div>;
}

function Ranking({ title, rows, empty = 'No data yet.' }: { title: string; rows: Row[]; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return <div className="portal-card" style={{ margin: 0, background: 'linear-gradient(145deg,rgba(255,255,255,.028),rgba(255,255,255,.006))', borderColor: 'rgba(214,209,198,.11)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.025)' }}>
    <h2 className="portal-h2">{title}</h2>
    {rows.length === 0 ? <p className="portal-sub">{empty}</p> : <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
      {rows.map((row) => <div key={`${title}-${row.label}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '.72rem' }}><span style={{ color: '#d9d6cf', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.label}</span><b>{num(row.count)}</b></div>
        <div style={{ height: 5, background: 'rgba(255,255,255,.05)', borderRadius: 999, marginTop: 7, overflow: 'hidden' }}><div style={{ width: `${Math.max(3, (row.count / max) * 100)}%`, height: '100%', background: 'linear-gradient(90deg,#ad77ff,#55d9ff)', borderRadius: 999 }} /></div>
      </div>)}
    </div>}
  </div>;
}

function ActivityChart({ daily }: { daily: Daily[] }) {
  const width = 760;
  const height = 245;
  const pad = { top: 24, right: 18, bottom: 42, left: 18 };
  const chartWidth = width - pad.left - pad.right;
  const chartHeight = height - pad.top - pad.bottom;
  const peak = Math.max(1, ...daily.flatMap((day) => [day.pageViews, day.mcpCalls]));
  const x = (index: number) => pad.left + (index / Math.max(1, daily.length - 1)) * chartWidth;
  const y = (value: number) => pad.top + chartHeight - (value / peak) * chartHeight;
  const pagePoints = daily.map((day, index) => x(index) + ',' + y(day.pageViews)).join(' ');
  const mcpPoints = daily.map((day, index) => x(index) + ',' + y(day.mcpCalls)).join(' ');
  const labelStep = daily.length > 45 ? 10 : daily.length > 14 ? 5 : 1;
  const hasData = daily.some((day) => day.pageViews || day.mcpCalls || day.signups || day.shareViews);

  if (!hasData) {
    return <div className="portal-empty" style={{ minHeight: 220, display: 'grid', placeItems: 'center' }}>Activity will appear here as people use Ashes.</div>;
  }

  return <div style={{ overflowX: 'auto' }}>
    <svg viewBox={'0 0 ' + width + ' ' + height} role="img" aria-label="Daily page views and AI activity trend" style={{ display: 'block', width: '100%', minWidth: 620 }}>
      <defs>
        <linearGradient id="analyticsArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ad77ff" stopOpacity=".28" />
          <stop offset="100%" stopColor="#ad77ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, .5, 1].map((ratio) => {
        const lineY = pad.top + chartHeight * ratio;
        return <line key={ratio} x1={pad.left} y1={lineY} x2={width - pad.right} y2={lineY} stroke="rgba(214,209,198,.10)" />;
      })}
      <polygon points={pad.left + ',' + (pad.top + chartHeight) + ' ' + pagePoints + ' ' + (width - pad.right) + ',' + (pad.top + chartHeight)} fill="url(#analyticsArea)" />
      <polyline points={pagePoints} fill="none" stroke="#ad77ff" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={mcpPoints} fill="none" stroke="#55d9ff" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {daily.map((day, index) => <g key={day.date}>
        <title>{day.date + ': ' + day.pageViews + ' views, ' + day.mcpCalls + ' AI actions, ' + day.signups + ' signups'}</title>
        {(day.signups > 0 || day.shareViews > 0) && <circle cx={x(index)} cy={y(Math.max(day.pageViews, day.mcpCalls)) - 8} r="4" fill="#d8ff62" />}
        {index % labelStep === 0 && <text x={x(index)} y={height - 15} textAnchor="middle" fill="#69665f" fontSize="10">{day.label}</text>}
      </g>)}
    </svg>
  </div>;
}

function Funnel({ steps }: { steps: { label: string; value: number; color: string }[] }) {
  const first = Math.max(1, steps[0]?.value || 1);
  return <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
    {steps.map((step, index) => {
      const width = Math.max(12, (step.value / first) * 100);
      const previous = index === 0 ? null : steps[index - 1].value;
      const conversion = previous && previous > 0 ? Math.round((step.value / previous) * 100) : null;
      return <div key={step.label}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'baseline', marginBottom: 7 }}>
          <span style={{ color: '#aaa69e', fontSize: '.64rem', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 700 }}>{index + 1}. {step.label}</span>
          <span><b style={{ color: '#f0eee8' }}>{num(step.value)}</b>{conversion !== null && <small style={{ color: '#77736c', marginLeft: 9 }}>{conversion}% from previous</small>}</span>
        </div>
        <div style={{ height: 12, borderRadius: 99, background: 'rgba(214,209,198,.06)', overflow: 'hidden' }}>
          <div style={{ width: width + '%', height: '100%', borderRadius: 99, background: step.color, boxShadow: '0 0 22px ' + step.color + '33' }} />
        </div>
      </div>;
    })}
  </div>;
}

function DistributionChart({ eyebrow, title, rows, totalLabel }: { eyebrow: string; title: string; rows: Row[]; totalLabel: string }) {
  const colors = ['#d8ff62', '#55d9ff', '#ad77ff', '#ffb766', '#ff6f91'];
  const visible = rows.slice(0, 5);
  const total = visible.reduce((sum, row) => sum + row.count, 0);
  let cursor = 0;
  const stops = visible.map((row, index) => {
    const start = cursor;
    cursor += total ? (row.count / total) * 100 : 0;
    return colors[index] + ' ' + start + '% ' + cursor + '%';
  });
  const gradient = total ? 'conic-gradient(' + stops.join(',') + ')' : 'rgba(255,255,255,.05)';

  return <div className="portal-card" style={{
    margin: 0,
    background: 'radial-gradient(circle at 50% 40%,rgba(173,119,255,.07),transparent 48%),linear-gradient(145deg,rgba(255,255,255,.028),rgba(255,255,255,.006))',
    borderColor: 'rgba(214,209,198,.11)',
    overflow: 'hidden',
  }}>
    <div className="portal-eyebrow">{eyebrow}</div>
    <h2 className="portal-h2" style={{ margin: '7px 0 0' }}>{title}</h2>
    {total === 0 ? <div className="portal-empty" style={{ minHeight: 260, display: 'grid', placeItems: 'center' }}>Not enough data yet.</div> : (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px,.85fr) minmax(170px,1.15fr)', gap: 24, alignItems: 'center', marginTop: 24 }}>
        <div style={{
          width: 'min(170px,100%)',
          aspectRatio: '1',
          borderRadius: '50%',
          background: gradient,
          padding: 16,
          margin: '0 auto',
          boxShadow: '0 0 44px rgba(173,119,255,.10)',
        }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#101012', display: 'grid', placeItems: 'center', textAlign: 'center', boxShadow: 'inset 0 0 24px rgba(0,0,0,.35)' }}>
            <div>
              <div style={{ color: '#77736c', fontSize: '.54rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>{totalLabel}</div>
              <b style={{ display: 'block', color: '#f3f1eb', fontSize: '1.35rem', marginTop: 5 }}>{num(total)}</b>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 13 }}>
          {visible.map((row, index) => {
            const percent = Math.round((row.count / total) * 100);
            return <div key={row.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: '.66rem', marginBottom: 6 }}>
                <span style={{ color: '#aaa69e', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><i style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 99, background: colors[index], marginRight: 7, boxShadow: '0 0 10px ' + colors[index] }} />{row.label}</span>
                <b style={{ color: colors[index] }}>{percent}%</b>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,.05)', overflow: 'hidden' }}><div style={{ width: percent + '%', height: '100%', background: colors[index] }} /></div>
            </div>;
          })}
        </div>
      </div>
    )}
  </div>;
}

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Me | null>(null);
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(range = days) {
    setLoading(true);
    const response = await fetch(`/api/workspace?analytics=admin&days=${range}`, { credentials: 'include' });
    if (!response.ok) throw new Error('Could not load analytics');
    setData(await response.json());
    setLoading(false);
  }

  useEffect(() => {
    getMe().then(async (u) => {
      if (!u) return navigate('/login');
      if (u.role === 'team') return navigate('/team');
      if (u.role !== 'admin') return navigate('/portal');
      setUser(u);
      await load(30);
    }).catch(() => navigate('/login'));
  }, [navigate]);

  if (loading || !data) return <AdminLayout user={user}><BlobLoaderCentered /></AdminLayout>;
  const s = data.summary;
  const trackingDate = data.trackingStartedAt ? new Date(data.trackingStartedAt).toLocaleString() : 'now';
  const visitToSignup = s.visits > 0 ? Math.round((s.brainSignups / s.visits) * 100) : 0;
  const signupToConnection = s.brainSignups > 0 ? Math.round((s.aiConnections / s.brainSignups) * 100) : 0;
  const actionsPerConnectedUser = s.connectedBrainUsers > 0 ? Math.round((s.mcpCalls / s.connectedBrainUsers) * 10) / 10 : 0;
  const pagesPerVisit = s.visits > 0 ? Math.round((s.pageViews / s.visits) * 10) / 10 : 0;

  return <AdminLayout user={user}>
    <section style={{
      position: 'relative',
      overflow: 'hidden',
      padding: '28px',
      marginBottom: 20,
      borderRadius: 18,
      border: '1px solid rgba(216,255,98,.16)',
      background: 'radial-gradient(circle at 85% 12%,rgba(173,119,255,.19),transparent 33%), radial-gradient(circle at 10% 90%,rgba(85,217,255,.12),transparent 32%), linear-gradient(145deg,#111113,#09090a)',
      boxShadow: '0 28px 80px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.05)',
    }}>
      <div style={{ position: 'absolute', inset: 0, opacity: .16, backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)', backgroundSize: '42px 42px', pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', flexWrap: 'wrap', marginBottom: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d8ff62', boxShadow: '0 0 14px #d8ff62' }} />
            <span style={{ color: '#d8ff62', fontSize: '.58rem', letterSpacing: '.14em', fontWeight: 800 }}>LIVE INTELLIGENCE</span>
            <span style={{ color: '#55524d', fontSize: '.58rem', letterSpacing: '.08em' }}>PRIVATE · FIRST-PARTY</span>
          </div>
          <div style={{ display: 'flex', gap: 7, padding: 4, borderRadius: 99, border: '1px solid rgba(214,209,198,.12)', background: 'rgba(0,0,0,.22)' }}>
            {[7, 30, 90].map((range) => <button key={range} onClick={() => { setDays(range); load(range); }} style={{
              border: 0,
              borderRadius: 99,
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '.62rem',
              fontWeight: 800,
              color: days === range ? '#080809' : '#77736c',
              background: days === range ? '#eceae4' : 'transparent',
            }}>{range}D</button>)}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,310px),1fr))', gap: 28, alignItems: 'end' }}>
          <div>
            <div style={{ color: '#8c8982', fontSize: '.62rem', letterSpacing: '.11em', fontWeight: 700, marginBottom: 10 }}>ASHES · OWNER VIEW</div>
            <h1 style={{ margin: 0, maxWidth: 610, color: '#f3f1eb', fontSize: 'clamp(2rem,5vw,4rem)', letterSpacing: '-.065em', lineHeight: .96, fontWeight: 800 }}>
              Growth command<br /><span style={{ color: '#d8ff62' }}>center.</span>
            </h1>
            <p style={{ maxWidth: 560, color: '#7f7b74', fontSize: '.72rem', lineHeight: 1.7, margin: '18px 0 0' }}>
              One private view of attention, acquisition, activation and real AI usage across Ashes.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 10 }}>
            <div style={{ gridRow: 'span 2', padding: 20, borderRadius: 15, border: '1px solid rgba(216,255,98,.18)', background: 'rgba(216,255,98,.045)' }}>
              <div style={{ color: '#77736c', fontSize: '.56rem', letterSpacing: '.1em', fontWeight: 700 }}>VISITS · {days} DAYS</div>
              <div style={{ fontSize: 'clamp(2rem,4vw,3.25rem)', letterSpacing: '-.06em', fontWeight: 800, color: '#f3f1eb', marginTop: 9 }}>{num(s.visits)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#d8ff62', fontSize: '.62rem', marginTop: 12 }}>
                <span style={{ width: 22, height: 2, background: '#d8ff62', boxShadow: '0 0 12px #d8ff62' }} /> {pct(s.signupConversionRate)} convert
              </div>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: 15, border: '1px solid rgba(85,217,255,.14)', background: 'rgba(85,217,255,.035)' }}>
              <div style={{ color: '#6f6c66', fontSize: '.54rem', letterSpacing: '.08em' }}>ACTIVE USERS</div>
              <b style={{ display: 'block', color: '#55d9ff', fontSize: '1.2rem', marginTop: 5 }}>{num(s.activeBrainUsers)}</b>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: 15, border: '1px solid rgba(173,119,255,.16)', background: 'rgba(173,119,255,.04)' }}>
              <div style={{ color: '#6f6c66', fontSize: '.54rem', letterSpacing: '.08em' }}>AI ACTIONS</div>
              <b style={{ display: 'block', color: '#ad77ff', fontSize: '1.2rem', marginTop: 5 }}>{num(s.mcpCalls)}</b>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 26, paddingTop: 15, borderTop: '1px solid rgba(214,209,198,.09)', display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', color: '#5f5c57', fontSize: '.58rem' }}>
          <span>TRACKING SINCE {trackingDate.toUpperCase()}</span>
          <span>NO RAW IP ADDRESSES STORED</span>
        </div>
      </div>
    </section>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 16, margin: '30px 0 14px', flexWrap: 'wrap' }}>
      <div>
        <div className="portal-eyebrow">PORTFOLIO SIGNALS</div>
        <h2 className="portal-h2" style={{ margin: '7px 0 0', fontSize: '1.15rem' }}>The numbers that move the business</h2>
      </div>
      <span style={{ color: '#5f5c57', fontSize: '.6rem', letterSpacing: '.08em' }}>CURRENT WINDOW · {days} DAYS</span>
    </div>
    <div className="portal-btn-grid" style={{ marginBottom: 20 }}>
      <Metric label="Visits" value={num(s.visits)} sub="Distinct browser sessions" />
      <Metric label="Page views" value={num(s.pageViews)} sub="Public site + Ashes Brain pages" />
      <Metric label="Link clicks" value={num(s.linkClicks)} sub="Internal and outbound links" />
      <Metric label="Brain signups" value={num(s.brainSignups)} sub={`${pct(s.signupConversionRate)} of visits`} />
      <Metric label="AI approvals" value={num(s.aiConnections)} sub={`${num(s.connectedBrainUsers)} Brain users approved an AI`} />
      <Metric label="MCP actions" value={num(s.mcpCalls)} sub="Real tool calls from connected AI clients" />
      <Metric label="Shared Brain views" value={num(s.shareViews)} sub={`${num(s.sharedBrains)} Brain projects currently shared`} />
      <Metric label="Total Brain users" value={num(s.totalBrainUsers)} sub={`${num(s.activeBrainUsers)} active in this period`} />
    </div>

    <div className="portal-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '20px 22px 14px' }}>
        <div className="portal-eyebrow">EXECUTIVE RATIOS</div>
        <h2 className="portal-h2" style={{ margin: '7px 0 0' }}>Efficiency, not vanity</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', borderTop: '1px solid rgba(214,209,198,.1)' }}>
        {[
          ['Pages / visit', String(pagesPerVisit), 'How deeply visitors explore'],
          ['Visit → signup', visitToSignup + '%', 'Traffic becoming Brain users'],
          ['Signup → AI', signupToConnection + '%', 'Users approving an AI client'],
          ['Actions / user', String(actionsPerConnectedUser), 'AI tool usage per connected user'],
        ].map(([label, value, help], index) => <div key={label} style={{ padding: '20px 22px', borderRight: index < 3 ? '1px solid rgba(214,209,198,.1)' : undefined }}>
          <div style={{ color: '#77736c', fontSize: '.58rem', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>{label}</div>
          <div style={{ color: index === 1 ? '#d8ff62' : index === 2 ? '#55d9ff' : '#eceae4', fontSize: '1.45rem', fontWeight: 800, marginTop: 7 }}>{value}</div>
          <div style={{ color: '#66625b', fontSize: '.62rem', lineHeight: 1.45, marginTop: 5 }}>{help}</div>
        </div>)}
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,330px),1fr))', gap: 16, marginBottom: 20 }}>
      <div className="portal-card" style={{ margin: 0 }}>
        <div className="portal-eyebrow">PRODUCT FUNNEL</div>
        <h2 className="portal-h2" style={{ margin: '7px 0 3px' }}>From visitor to real AI usage</h2>
        <p className="portal-sub" style={{ marginTop: 0 }}>See where people continue and where they drop off.</p>
        <Funnel steps={[
          { label: 'Visits', value: s.visits, color: '#ad77ff' },
          { label: 'Brain signups', value: s.brainSignups, color: '#8d9dff' },
          { label: 'AI approvals', value: s.aiConnections, color: '#55d9ff' },
        ]} />
        <div style={{ marginTop: 18, paddingTop: 15, borderTop: '1px solid rgba(214,209,198,.1)', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ color: '#77736c', fontSize: '.66rem' }}>Actions completed after connection</span>
          <b style={{ color: '#d8ff62' }}>{num(s.mcpCalls)}</b>
        </div>
      </div>

      <div className="portal-card" style={{ margin: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div className="portal-eyebrow">ACTIVITY TREND</div>
            <h2 className="portal-h2" style={{ margin: '7px 0 3px' }}>Traffic and AI usage</h2>
          </div>
          <div style={{ display: 'flex', gap: 13, color: '#88847d', fontSize: '.62rem' }}>
            <span><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 99, background: '#ad77ff', marginRight: 5 }} />Views</span>
            <span><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 99, background: '#55d9ff', marginRight: 5 }} />AI actions</span>
            <span><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 99, background: '#d8ff62', marginRight: 5 }} />Conversion</span>
          </div>
        </div>
        <ActivityChart daily={data.daily} />
      </div>
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 16, margin: '30px 0 14px', flexWrap: 'wrap' }}>
      <div>
        <div className="portal-eyebrow">AUDIENCE INTELLIGENCE</div>
        <h2 className="portal-h2" style={{ margin: '7px 0 0', fontSize: '1.15rem' }}>Who arrives and how they enter</h2>
      </div>
      <span style={{ color: '#5f5c57', fontSize: '.6rem', letterSpacing: '.08em' }}>LIVE DISTRIBUTION</span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))', gap: 16, marginBottom: 20 }}>
      <DistributionChart eyebrow="ACQUISITION" title="Traffic source mix" rows={data.topSources} totalLabel="VISITS" />
      <DistributionChart eyebrow="AUDIENCE" title="Device distribution" rows={data.topDevices} totalLabel="SESSIONS" />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))', gap: 16, marginBottom: 20 }}>
      <Ranking title="Top pages" rows={data.topPages} />
      <Ranking title="Traffic sources" rows={data.topSources} />
      <Ranking title="Most-clicked links" rows={data.topLinks} />
      <Ranking title="MCP tools used" rows={data.topTools} />
      <Ranking title="AI clients approved" rows={data.topAiClients} />
      <Ranking title="Countries" rows={data.topCountries} />
      <Ranking title="Devices" rows={data.topDevices} />
    </div>

    <div className="portal-card" style={{ marginBottom: 20 }}>
      <div className="portal-eyebrow">MONETIZATION</div>
      <h2 className="portal-h2" style={{ marginTop: 8 }}>Ads are possible — but not inside the Brain workspace.</h2>
      <p className="portal-sub">Best future ad inventory: docs, guides, SEO articles and public educational pages. Keep the actual AI workspace clean so the product still feels premium.</p>
      <div className="portal-btn-grid" style={{ marginTop: 16 }}>
        <Metric label="Privacy page" value="READY" sub="Public policy is live" />
        <Metric label="Terms" value="READY" sub="Public terms are live" />
        <Metric label="Sitemap" value="READY" sub="Discovery pages are indexed in the sitemap" />
        <Metric label="Google AdSense" value={data.monetization.adsenseConfigured ? 'CONFIGURED' : 'NOT CONNECTED'} sub={data.monetization.adsenseConfigured ? 'Publisher configuration detected' : 'Needs an approved AdSense account + publisher ID before ad code is added'} />
      </div>
    </div>

    <div className="portal-card">
      <h2 className="portal-h2">Recent product activity</h2>
      <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
        {data.recentEvents.length === 0 ? <p className="portal-sub">No tracked product events yet.</p> : data.recentEvents.map((event, index) => <div key={`${event.createdAt}-${index}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(125px,.8fr) minmax(140px,1.5fr) auto', gap: 12, alignItems: 'center', borderBottom: '1px solid #1d1d1d', padding: '10px 0', fontSize: '.68rem' }}>
          <b>{event.event.replaceAll('_', ' ')}</b>
          <span style={{ color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.path || event.source || String(event.meta?.tool || '') || 'Ashes'}</span>
          <span style={{ color: '#666', whiteSpace: 'nowrap' }}>{new Date(event.createdAt).toLocaleString()}</span>
        </div>)}
      </div>
    </div>
  </AdminLayout>;
}

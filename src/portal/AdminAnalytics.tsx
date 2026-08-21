import { useEffect, useMemo, useState } from 'react';
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
  return <div className="portal-card" style={{ margin: 0, padding: 18 }}>
    <div style={{ color: '#8c8982', fontSize: '.64rem', letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-.04em', marginTop: 6 }}>{value}</div>
    <div style={{ color: '#777', fontSize: '.66rem', marginTop: 5, lineHeight: 1.5 }}>{sub}</div>
  </div>;
}

function Ranking({ title, rows, empty = 'No data yet.' }: { title: string; rows: Row[]; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return <div className="portal-card" style={{ margin: 0 }}>
    <h2 className="portal-h2">{title}</h2>
    {rows.length === 0 ? <p className="portal-sub">{empty}</p> : <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
      {rows.map((row) => <div key={`${title}-${row.label}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '.72rem' }}><span style={{ color: '#d9d6cf', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.label}</span><b>{num(row.count)}</b></div>
        <div style={{ height: 5, background: 'rgba(255,255,255,.05)', borderRadius: 999, marginTop: 7, overflow: 'hidden' }}><div style={{ width: `${Math.max(3, (row.count / max) * 100)}%`, height: '100%', background: 'linear-gradient(90deg,#ad77ff,#55d9ff)', borderRadius: 999 }} /></div>
      </div>)}
    </div>}
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

  const peak = useMemo(() => Math.max(1, ...(data?.daily || []).map((d) => Math.max(d.pageViews, d.mcpCalls))), [data]);

  if (loading || !data) return <AdminLayout user={user}><BlobLoaderCentered /></AdminLayout>;
  const s = data.summary;
  const trackingDate = data.trackingStartedAt ? new Date(data.trackingStartedAt).toLocaleString() : 'now';

  return <AdminLayout user={user}>
    <div className="portal-page-head">
      <div className="portal-eyebrow">ASHES ANALYTICS</div>
      <h1 className="portal-h1">Traffic → Brain → AI usage</h1>
      <p className="portal-sub">First-party product analytics. No raw IP addresses are stored. “Visits” are privacy-friendly browser sessions, so they are a better measure than pretending we can identify a person across every device.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
        {[7, 30, 90].map((range) => <button key={range} className={days === range ? 'pill-btn solid' : 'pill-btn'} onClick={() => { setDays(range); load(range); }}>{range} days</button>)}
      </div>
    </div>

    <div className="portal-card" style={{ borderColor: 'rgba(85,217,255,.28)', marginBottom: 20 }}>
      <div style={{ fontSize: '.7rem', lineHeight: 1.65, color: '#aaa' }}><b style={{ color: '#f3f3ef' }}>Tracking started {trackingDate}.</b> Historical website visits from before this tracker went live cannot be reconstructed, so this dashboard is accurate from that point forward.</div>
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

    <div className="portal-card" style={{ marginBottom: 20 }}>
      <div className="portal-eyebrow">PRODUCT FUNNEL</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, marginTop: 14 }}>
        {[['VISITS', s.visits], ['BRAIN SIGNUPS', s.brainSignups], ['AI APPROVALS', s.aiConnections], ['MCP ACTIONS', s.mcpCalls]].map(([label, value], i) => <div key={String(label)} style={{ border: '1px solid #242424', borderRadius: 12, padding: 15, background: '#0c0c0c' }}><div style={{ color: '#777', fontSize: '.58rem', letterSpacing: '.09em' }}>{i + 1}. {label}</div><b style={{ display: 'block', fontSize: '1.45rem', marginTop: 5 }}>{num(Number(value))}</b></div>)}
      </div>
    </div>

    <div className="portal-card" style={{ marginBottom: 20 }}>
      <h2 className="portal-h2">Daily activity</h2>
      <p className="portal-sub">Page views are the tall bar; MCP activity is the bright inner bar. Signups and shared-link views are shown below each day.</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, height: 190, marginTop: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {data.daily.map((day) => <div key={day.date} title={`${day.date}: ${day.pageViews} page views, ${day.mcpCalls} MCP calls, ${day.signups} signups`} style={{ flex: '1 0 24px', minWidth: 24, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 5 }}>
          <div style={{ width: '100%', maxWidth: 34, height: `${Math.max(5, (day.pageViews / peak) * 120)}px`, background: 'rgba(173,119,255,.35)', border: '1px solid rgba(173,119,255,.5)', borderRadius: '6px 6px 2px 2px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}><div style={{ width: '100%', height: `${Math.min(100, (day.mcpCalls / Math.max(1, day.pageViews, day.mcpCalls)) * 100)}%`, background: '#55d9ff' }} /></div>
          <div style={{ color: '#aaa', fontSize: '.54rem', whiteSpace: 'nowrap' }}>{day.signups ? `+${day.signups} user` : day.shareViews ? `${day.shareViews} share` : '·'}</div>
          <div style={{ color: '#666', fontSize: '.52rem', transform: 'rotate(-35deg)', transformOrigin: 'center', whiteSpace: 'nowrap', marginTop: 5 }}>{day.label}</div>
        </div>)}
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 16, marginBottom: 20 }}>
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
        {data.recentEvents.length === 0 ? <p className="portal-sub">No tracked product events yet.</p> : data.recentEvents.map((event, index) => <div key={`${event.createdAt}-${index}`} style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: 12, alignItems: 'center', borderBottom: '1px solid #1d1d1d', padding: '10px 0', fontSize: '.68rem' }}>
          <b>{event.event.replaceAll('_', ' ')}</b>
          <span style={{ color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.path || event.source || String(event.meta?.tool || '') || 'Ashes'}</span>
          <span style={{ color: '#666', whiteSpace: 'nowrap' }}>{new Date(event.createdAt).toLocaleString()}</span>
        </div>)}
      </div>
    </div>
  </AdminLayout>;
}

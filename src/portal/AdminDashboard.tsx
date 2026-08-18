import { useEffect, useMemo, useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, BriefcaseBusiness, CircleDollarSign, FileClock, Gauge, LineChart, LogOut, ReceiptText, Settings2, TrendingUp, UserRoundCheck, UsersRound, WalletCards } from 'lucide-react';
import { getMe, logout, Me } from './api';
import AshesLoader from './AshesLoader';

type DashboardData = {
  totalRevenue:number; outstandingPayments:number; outstandingInvoiceCount:number; avgProjectValue:number;
  grossMarginPct:number|null; netProfit:number; netMarginPct:number|null; costPerProject:number|null; profitPerProject:number|null;
  monthlyEarnings:{key:string;label:string;amount:number}[]; revenueByService:Record<string,number>;
  accountsReceivable:number; accountsPayable:number; cashOnHand:number; burnRate:number; runwayMonths:number|null; cashFlow:number;
  totalExpenses:number; totalMarketing:number; arpu:number; revenuePerLead:number; revenuePerPayingClient:number; ltv:number;
  cac:number|null; ltvCacRatio:number|null; repeatPurchaseRate:number|null; retentionRate:number|null; churnRate:number|null;
  clientConcentrationRisk:number|null; stageCounts:Record<string,number>; pipelineValue:number; weightedPipelineValue:number;
  sourceCounts:Record<string,number>; totalClients:number; payingClientCount:number; conversionRate:number; repeatClients:number;
  winRate:number|null; lossRate:number|null; avgDaysToClose:number|null; avgLeadResponseHours:number|null; staleClients:number;
};
type LedgerEntry={_id:string;category:string;amount:number;note?:string;date:string;paid:boolean};
type ClientRow={_id:string;name:string;company?:string;stage?:string;dealValue?:number;source?:string};

const PIPELINE=['lead','contacted','demo','proposal','won','in_progress','delivered','paid','review','repeat_client'];
const STAGE_LABELS:Record<string,string>={lead:'Lead',contacted:'Contacted',demo:'Demo',proposal:'Proposal',won:'Won',in_progress:'In progress',delivered:'Delivered',paid:'Paid',review:'Review',repeat_client:'Repeat'};
const SOURCE_LABELS:Record<string,string>={whatsapp:'WhatsApp',linkedin:'LinkedIn',instagram:'Instagram',fiverr:'Fiverr',referral:'Referral',other:'Other'};
const SOURCE_COLORS=['#ff6a3d','#66e2ff','#b58cff','#ff6db4','#d8ff62','#ffbf48'];
const pkr=(n:number)=>`PKR ${Math.round(n||0).toLocaleString()}`;
const pct=(n:number|null)=>n===null?'—':`${n}%`;

export default function AdminDashboard(){
  const navigate=useNavigate();
  const [user,setUser]=useState<Me|null>(null),[data,setData]=useState<DashboardData|null>(null),[ledger,setLedger]=useState<LedgerEntry[]>([]),[clients,setClients]=useState<ClientRow[]>([]),[loading,setLoading]=useState(true),[showFinance,setShowFinance]=useState(false),[cashOnHand,setCashOnHand]=useState(''),[savingLedger,setSavingLedger]=useState(false);
  const [ledgerForm,setLedgerForm]=useState({category:'expense',amount:'',note:'',date:new Date().toISOString().slice(0,10)});
  async function loadAll(){const[d,l,s,c]=await Promise.all([fetch('/api/admin/dashboard').then(r=>r.json()),fetch('/api/admin/ledger-list').then(r=>r.json()),fetch('/api/admin/get-settings').then(r=>r.json()),fetch('/api/admin/clients').then(r=>r.json())]);setData(d);setLedger(Array.isArray(l)?l:[]);setCashOnHand(String(s.cashOnHand??0));setClients(Array.isArray(c)?c:[])}
  useEffect(()=>{getMe().then(async u=>{if(!u)return navigate('/login');if(u.role!=='admin')return navigate(u.role==='team'?'/team':'/portal');setUser(u);await loadAll();setLoading(false)})},[navigate]);
  async function onLogout(){await logout();navigate('/login')}
  async function saveCash(){await fetch('/api/admin/update-settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cashOnHand:Number(cashOnHand)||0})});loadAll()}
  async function addLedger(e:FormEvent){e.preventDefault();if(!ledgerForm.amount)return;setSavingLedger(true);await fetch('/api/admin/ledger-add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...ledgerForm,amount:Number(ledgerForm.amount),paid:ledgerForm.category!=='payable'})});setSavingLedger(false);setLedgerForm({category:'expense',amount:'',note:'',date:new Date().toISOString().slice(0,10)});loadAll()}
  async function removeLedger(id:string){if(!confirm('Delete this finance entry?'))return;await fetch(`/api/admin/ledger-delete?id=${id}`,{method:'DELETE'});loadAll()}
  if(loading||!data)return <AshesLoader label="Opening owner command center…"/>;

  const maxMonthly=Math.max(1,...data.monthlyEarnings.map(m=>m.amount));
  const sourceEntries=Object.entries(data.sourceCounts).filter(([,v])=>v>0);
  const sourceTotal=sourceEntries.reduce((a,[,v])=>a+v,0)||1;
  let angle=0;const sourceGradient=sourceEntries.map(([,v],i)=>{const start=angle;angle+=v/sourceTotal*360;return `${SOURCE_COLORS[i%SOURCE_COLORS.length]} ${start}deg ${angle}deg`}).join(',')||'#202229 0deg 360deg';
  const services=Object.entries(data.revenueByService).sort((a,b)=>b[1]-a[1]).slice(0,5);const maxService=Math.max(1,...services.map(([,v])=>v));
  const attention=[{label:'Follow-ups',value:data.staleClients,sub:'clients need attention',icon:<UserRoundCheck/>},{label:'Payments pending',value:pkr(data.outstandingPayments),sub:`${data.outstandingInvoiceCount} unpaid invoice(s)`,icon:<ReceiptText/>},{label:'Pipeline value',value:pkr(data.pipelineValue),sub:'open opportunities',icon:<BriefcaseBusiness/>},{label:'Cash on hand',value:pkr(data.cashOnHand),sub:`${data.runwayMonths??'—'} mo runway`,icon:<WalletCards/>}];
  const kpis=[['Revenue',pkr(data.totalRevenue),'Paid invoices'],['Net profit',pkr(data.netProfit),`Margin ${pct(data.netMarginPct)}`],['ROI / margin',pct(data.grossMarginPct),'Gross project margin'],['CAC',data.cac===null?'—':pkr(data.cac),'Marketing ÷ clients'],['LTV',pkr(data.ltv),'Revenue / paying client'],['Conversion',`${data.conversionRate}%`,'Won or later'],['Pipeline',pkr(data.pipelineValue),'Open deals'],['Outstanding',pkr(data.outstandingPayments),`${data.outstandingInvoiceCount} invoice(s)`]];
  const recentClients=clients.slice(0,6);

  return <div className="owner-dashboard">
    <aside className="owner-sidebar">
      <div className="owner-mark"><img src="/ashes-logo-transparent.webp" alt="ASHES"/><span>OWNER PORTAL</span></div>
      <nav><Link className="active" to="/admin/dashboard"><Gauge/>Dashboard</Link><Link to="/admin"><UsersRound/>Clients & team</Link><a href="#pipeline"><TrendingUp/>Pipeline</a><a href="#finance"><CircleDollarSign/>Finance</a><a href="#analytics"><BarChart3/>Analytics</a><Link to="/admin/account"><Settings2/>Settings</Link></nav>
      <div className="owner-side-foot"><small>PRIVATE OWNER ACCESS</small><strong>{user?.name}</strong><span>{user?.email}</span><button onClick={onLogout}><LogOut/>Log out</button></div>
    </aside>

    <main className="owner-main">
      <header className="owner-header"><div><span>ASHES / OWNER COMMAND CENTER</span><h1>Business overview.</h1><p>Clients, revenue, profitability and growth — in one private workspace.</p></div><div className="owner-header-actions"><Link to="/admin" className="owner-btn">Manage people</Link><button className="owner-btn accent" onClick={()=>setShowFinance(v=>!v)}>Finance tools</button></div></header>

      <section className="owner-kpi-strip">{kpis.map(([label,value,sub],i)=><article key={label}><div className="owner-kpi-icon">{[<CircleDollarSign/>,<TrendingUp/>,<Gauge/>,<UsersRound/>,<UserRoundCheck/>,<LineChart/>,<BriefcaseBusiness/>,<FileClock/>][i]}</div><span>{label}</span><strong>{value}</strong><small>{sub}</small></article>)}</section>

      <section id="pipeline" className="owner-panel owner-pipeline"><div className="owner-panel-head"><div><span>SALES PIPELINE</span><h2>From lead to repeat client.</h2></div><small>Real CRM stages</small></div><div className="owner-pipeline-track">{PIPELINE.map((stage,i)=><div className="owner-stage" key={stage}><div className="owner-stage-node">{i+1}</div><span>{STAGE_LABELS[stage]}</span><strong>{data.stageCounts[stage]||0}</strong></div>)}</div></section>

      <section id="analytics" className="owner-dashboard-grid">
        <div className="owner-panel owner-earnings"><div className="owner-panel-head"><div><span>REVENUE</span><h2>Monthly earnings</h2></div><small>Last 6 months</small></div><div className="owner-bars">{data.monthlyEarnings.map(m=><div className="owner-bar-col" key={m.key}><span>{m.amount?pkr(m.amount):''}</span><div className="owner-bar" style={{height:`${Math.max(8,m.amount/maxMonthly*175)}px`}}/><small>{m.label}</small></div>)}</div></div>
        <div className="owner-panel"><div className="owner-panel-head"><div><span>ACQUISITION</span><h2>Client source</h2></div><small>{data.totalClients} total</small></div><div className="owner-source-wrap"><div className="owner-donut" style={{background:`conic-gradient(${sourceGradient})`}}><div><strong>{data.totalClients}</strong><span>clients</span></div></div><div className="owner-source-list">{sourceEntries.map(([key,v],i)=><div key={key}><i style={{background:SOURCE_COLORS[i%SOURCE_COLORS.length]}}/><span>{SOURCE_LABELS[key]||key}</span><strong>{Math.round(v/sourceTotal*100)}%</strong></div>)}</div></div></div>
        <div className="owner-panel owner-today"><div className="owner-panel-head"><div><span>TODAY</span><h2>Needs attention</h2></div></div>{attention.map(a=><article key={a.label}>{a.icon}<div><span>{a.label}</span><strong>{a.value}</strong><small>{a.sub}</small></div></article>)}</div>
        <div className="owner-panel owner-clients"><div className="owner-panel-head"><div><span>CRM</span><h2>Active clients</h2></div><Link to="/admin">View all</Link></div><div className="owner-client-table"><div className="head"><span>Client</span><span>Stage</span><span>Value</span></div>{recentClients.length?recentClients.map(c=><Link to={`/admin/client/${c._id}`} key={c._id}><div><strong>{c.name}</strong><small>{c.company||'No company'}</small></div><span className="owner-stage-pill">{STAGE_LABELS[c.stage||'lead']||c.stage}</span><b>{c.dealValue?pkr(c.dealValue):'—'}</b></Link>):<p>No clients yet.</p>}</div></div>
        <div className="owner-panel owner-services"><div className="owner-panel-head"><div><span>PROFITABILITY</span><h2>Revenue by service</h2></div></div>{services.length?services.map(([name,value])=><div className="owner-service-row" key={name}><span>{name}</span><div><i style={{width:`${value/maxService*100}%`}}/></div><strong>{pkr(value)}</strong></div>):<p className="owner-empty">Add a service category to paid invoices to populate this view.</p>}</div>
      </section>

      <section className="owner-secondary-kpis"><article><span>Cash flow</span><strong>{pkr(data.cashFlow)}</strong></article><article><span>Burn rate</span><strong>{pkr(data.burnRate)}</strong></article><article><span>Win rate</span><strong>{pct(data.winRate)}</strong></article><article><span>Retention</span><strong>{pct(data.retentionRate)}</strong></article><article><span>LTV : CAC</span><strong>{data.ltvCacRatio===null?'—':`${data.ltvCacRatio}:1`}</strong></article><article><span>Avg project</span><strong>{pkr(data.avgProjectValue)}</strong></article></section>

      {showFinance&&<section id="finance" className="owner-panel owner-finance"><div className="owner-panel-head"><div><span>OWNER FINANCE TOOLS</span><h2>Cash & ledger</h2></div><button className="owner-close" onClick={()=>setShowFinance(false)}>Close</button></div><div className="owner-finance-grid"><div><label>Cash on hand</label><div className="owner-inline"><input type="number" value={cashOnHand} onChange={e=>setCashOnHand(e.target.value)}/><button onClick={saveCash}>Save</button></div></div><form onSubmit={addLedger}><label>Add finance entry</label><div className="owner-ledger-form"><select value={ledgerForm.category} onChange={e=>setLedgerForm({...ledgerForm,category:e.target.value})}><option value="expense">Expense</option><option value="marketing">Marketing</option><option value="payable">Payable</option></select><input type="number" placeholder="Amount" value={ledgerForm.amount} onChange={e=>setLedgerForm({...ledgerForm,amount:e.target.value})}/><input placeholder="Note" value={ledgerForm.note} onChange={e=>setLedgerForm({...ledgerForm,note:e.target.value})}/><input type="date" value={ledgerForm.date} onChange={e=>setLedgerForm({...ledgerForm,date:e.target.value})}/><button disabled={savingLedger}>{savingLedger?'Saving…':'Add entry'}</button></div></form></div><div className="owner-ledger-list">{ledger.slice(0,8).map(e=><div key={e._id}><span>{e.category}</span><strong>{pkr(e.amount)}</strong><small>{e.note||new Date(e.date).toLocaleDateString()}</small><button onClick={()=>removeLedger(e._id)}>×</button></div>)}</div></section>}
    </main>
  </div>
}

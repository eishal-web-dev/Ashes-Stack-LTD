import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock3, FolderKanban, LogOut, MessageSquare, Sparkles, TimerReset, UserRound } from 'lucide-react';
import { getMe, logout, Me } from './api';

const tasks = [
  { title: 'Review assigned build notes', type: 'Delivery', status: 'Ready' },
  { title: 'Update internal progress', type: 'Workspace', status: 'Today' },
  { title: 'Prepare next handoff', type: 'Quality', status: 'Upcoming' },
];

export default function TeamPortal(){
  const navigate=useNavigate();
  const [user,setUser]=useState<Me|null>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{getMe().then(u=>{if(!u)return navigate('/login');if(u.role==='admin')return navigate('/admin/dashboard');if(u.role==='client')return navigate('/portal');setUser(u);setLoading(false)})},[navigate]);
  async function onLogout(){await logout();navigate('/login')}
  if(loading)return <div className="portal-shell team-pro-shell"><div className="portal-container">Loading…</div></div>;
  return <div className="portal-shell team-pro-shell">
    <aside className="team-sidebar">
      <div className="team-logo">ASHES <span>TEAM</span></div>
      <nav><a className="active"><Sparkles size={16}/>Overview</a><a><FolderKanban size={16}/>My work</a><a><CalendarDays size={16}/>Calendar</a><a><TimerReset size={16}/>Time & activity</a><a><UserRound size={16}/>My profile</a></nav>
      <div className="team-side-bottom"><small>INTERNAL WORKSPACE</small><strong>{user?.name}</strong><span>ASHES team member</span><button onClick={onLogout}><LogOut size={15}/> Sign out</button></div>
    </aside>
    <main className="team-main">
      <header className="team-header"><div><span>TEAM MEMBER PORTAL</span><h1>Welcome back, {user?.name?.split(' ')[0]}.</h1><p>Your internal workspace for assignments, activity and team communication.</p></div><div className="team-status"><i/> Available</div></header>
      <section className="team-kpis">
        <article><Clock3/><div><span>Today</span><strong>8h</strong><small>work window</small></div></article>
        <article><CheckCircle2/><div><span>Completed</span><strong>0</strong><small>assigned items</small></div></article>
        <article><FolderKanban/><div><span>Active work</span><strong>0</strong><small>projects assigned</small></div></article>
        <article><MessageSquare/><div><span>Updates</span><strong>0</strong><small>unread notices</small></div></article>
      </section>
      <section className="team-grid">
        <div className="team-panel team-focus"><div className="team-panel-head"><div><span>TODAY</span><h2>My focus</h2></div><button>+ Add personal task</button></div>{tasks.map(t=><div className="team-task" key={t.title}><i/><div><strong>{t.title}</strong><small>{t.type}</small></div><span>{t.status}</span></div>)}</div>
        <div className="team-panel"><div className="team-panel-head"><div><span>WORKDAY</span><h2>Activity</h2></div></div><div className="team-empty-visual"><TimerReset/><strong>No timer running</strong><p>Start work when you begin an assigned task. Client, revenue and finance data are intentionally not available in team accounts.</p><button>Start work session</button></div></div>
        <div className="team-panel team-calendar"><div className="team-panel-head"><div><span>SCHEDULE</span><h2>This week</h2></div></div><div className="team-week">{['MON','TUE','WED','THU','FRI'].map((d,i)=><div className={i===0?'active':''} key={d}><span>{d}</span><strong>{18+i}</strong><i/></div>)}</div><p className="team-note">No meetings or internal deadlines have been assigned yet.</p></div>
        <div className="team-panel"><div className="team-panel-head"><div><span>PROFILE</span><h2>Team identity</h2></div></div><div className="team-profile-card"><div className="team-avatar">{user?.name?.slice(0,1)}</div><div><strong>{user?.name}</strong><span>{user?.email}</span><small>Member · ASHES</small></div></div></div>
      </section>
    </main>
  </div>
}

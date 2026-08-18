import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeDollarSign, BriefcaseBusiness, CalendarDays, FileText, LogOut, UserRound } from 'lucide-react';
import { getMe, logout, Me } from './api';
import AshesLoader from './AshesLoader';

type TeamTask={_id?:string;title:string;description?:string;status:'todo'|'in_progress'|'done';dueDate?:string};
type TeamProfile={
  name:string;email:string;phone?:string;teamTitle?:string;department?:string;availability?:string;
  employmentStatus?:string;startedAt?:string;salaryAmount?:number;salaryCurrency?:string;salaryFrequency?:string;
  appointmentLetterTitle?:string;appointmentLetterUrl?:string;teamTasks?:TeamTask[];createdAt?:string;
};

function dateText(v?:string){return v?new Date(v).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'Not set'}
function money(profile:TeamProfile){if(!profile.salaryAmount)return 'Not set';return `${profile.salaryCurrency||'PKR'} ${Number(profile.salaryAmount).toLocaleString()} / ${profile.salaryFrequency||'month'}`}

export default function TeamPortal(){
  const navigate=useNavigate();
  const[user,setUser]=useState<Me|null>(null);
  const[profile,setProfile]=useState<TeamProfile|null>(null);
  const[loading,setLoading]=useState(true);
  useEffect(()=>{getMe().then(async u=>{
    if(!u)return navigate('/login');
    if(u.role==='admin')return navigate('/admin/dashboard');
    if(u.role==='client')return navigate('/portal');
    setUser(u);
    const res=await fetch('/api/team/me');
    if(!res.ok)return navigate('/login');
    setProfile(await res.json());
    setLoading(false);
  })},[navigate]);
  async function onLogout(){await logout();navigate('/login')}
  const tasks=useMemo(()=>profile?.teamTasks||[],[profile]);
  if(loading||!profile)return <AshesLoader label="Opening your workspace…"/>;

  return <div className="portal-shell team-pro-shell team-hr-only">
    <aside className="team-sidebar">
      <div className="team-logo">ASHES <span>TEAM</span></div>
      <nav>
        <a className="active"><UserRound size={16}/>My profile</a>
        <a><BriefcaseBusiness size={16}/>My tasks</a>
        <a><BadgeDollarSign size={16}/>Employment</a>
        <a><FileText size={16}/>Documents</a>
      </nav>
      <div className="team-side-bottom"><small>PRIVATE STAFF PORTAL</small><strong>{user?.name}</strong><span>{profile.teamTitle||'Team Member'}</span><button onClick={onLogout}><LogOut size={15}/> Sign out</button></div>
    </aside>

    <main className="team-main">
      <header className="team-header"><div><span>YOUR ASHES WORKSPACE</span><h1>{profile.name}</h1><p>Only your own employment profile, assigned tasks, salary and documents are available here.</p></div><div className="team-status"><i/> {profile.employmentStatus||'Active'}</div></header>

      <section className="team-kpis team-employment-kpis">
        <article><BriefcaseBusiness/><div><span>Role</span><strong>{profile.teamTitle||'Team Member'}</strong><small>{profile.department||'ASHES'}</small></div></article>
        <article><CalendarDays/><div><span>Joined Ashes</span><strong>{dateText(profile.startedAt)}</strong><small>official start date</small></div></article>
        <article><BadgeDollarSign/><div><span>Salary</span><strong>{money(profile)}</strong><small>your compensation</small></div></article>
        <article><UserRound/><div><span>Status</span><strong>{profile.employmentStatus||'Active'}</strong><small>{profile.availability||'Available'}</small></div></article>
      </section>

      <section className="team-grid team-hr-grid">
        <div className="team-panel">
          <div className="team-panel-head"><div><span>ASSIGNED TO YOU</span><h2>My tasks</h2></div></div>
          {tasks.length?tasks.map(t=><div className="team-task" key={t._id||t.title}><i className={`task-${t.status}`}/><div><strong>{t.title}</strong><small>{t.description||'No additional notes'}</small></div><span>{t.status.replace('_',' ')}{t.dueDate?` · ${dateText(t.dueDate)}`:''}</span></div>):<div className="team-empty-visual"><BriefcaseBusiness/><strong>No tasks assigned</strong><p>Your admin will assign work here. You do not need access to clients, CRM or company finance to complete your role.</p></div>}
        </div>

        <div className="team-panel">
          <div className="team-panel-head"><div><span>EMPLOYMENT</span><h2>My details</h2></div></div>
          <div className="team-detail-list">
            <div><span>Full name</span><strong>{profile.name}</strong></div>
            <div><span>Work email</span><strong>{profile.email}</strong></div>
            <div><span>Phone</span><strong>{profile.phone||'Not set'}</strong></div>
            <div><span>Department</span><strong>{profile.department||'Not set'}</strong></div>
            <div><span>Start date</span><strong>{dateText(profile.startedAt)}</strong></div>
            <div><span>Salary</span><strong>{money(profile)}</strong></div>
          </div>
        </div>

        <div className="team-panel team-document-panel">
          <div className="team-panel-head"><div><span>HR DOCUMENTS</span><h2>My documents</h2></div></div>
          <div className="team-document-row">
            <div className="team-document-icon"><FileText/></div>
            <div><strong>{profile.appointmentLetterTitle||'Appointment Letter'}</strong><span>Your official Ashes appointment document.</span></div>
            {profile.appointmentLetterUrl?<a href={profile.appointmentLetterUrl} target="_blank" rel="noreferrer">Open ↗</a>:<em>Not uploaded yet</em>}
          </div>
        </div>

        <div className="team-panel">
          <div className="team-panel-head"><div><span>PROFILE</span><h2>Team identity</h2></div></div>
          <div className="team-profile-card"><div className="team-avatar">{profile.name?.slice(0,1)}</div><div><strong>{profile.name}</strong><span>{profile.teamTitle||'Team Member'} · {profile.department||'ASHES'}</span><small>ASHES internal team member</small></div></div>
          <p className="team-privacy-note">Business revenue, ROI, CAC, LTV, CRM, client records, invoices and pipeline information are restricted to the owner admin account.</p>
        </div>
      </section>
    </main>
  </div>
}

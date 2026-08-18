import { FormEvent, useMemo, useState } from 'react';
import { FileSignature, Send, X } from 'lucide-react';
import AshesLoader from './AshesLoader';

type TeamMember={_id:string;name:string;email:string;teamTitle?:string;department?:string;salaryAmount?:number;salaryCurrency?:string;salaryFrequency?:string;startedAt?:string;employmentStatus?:string};

export default function AppointmentLetterComposer({member,onClose,onSent}:{member:TeamMember;onClose:()=>void;onSent:()=>void}){
  const defaults=useMemo(()=>({
    documentTitle:`Appointment Letter · ${member.name}`,
    title:member.teamTitle||'Team Member',
    department:member.department||'Delivery',
    startDate:member.startedAt?String(member.startedAt).slice(0,10):new Date().toISOString().slice(0,10),
    employmentStatus:member.employmentStatus||'Active',
    salaryAmount:String(member.salaryAmount||''),
    salaryCurrency:member.salaryCurrency||'PKR',
    salaryFrequency:member.salaryFrequency||'month',
    intro:'',
    closing:'',
    signatoryName:'ASHES Administration',
    signatoryTitle:'Owner / Administration',
  }),[member]);
  const[form,setForm]=useState(defaults);
  const[sending,setSending]=useState(false);
  const[error,setError]=useState('');
  const[success,setSuccess]=useState('');

  async function submit(e:FormEvent){
    e.preventDefault();setError('');setSuccess('');setSending(true);
    const res=await fetch('/api/admin/team-appointment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({teamId:member._id,meta:{...form,salaryAmount:form.salaryAmount?Number(form.salaryAmount):0}})});
    const data=await res.json();setSending(false);
    if(!res.ok)return setError(data.error||'Could not send appointment letter.');
    setSuccess(`Appointment letter sent to ${member.name}.`);onSent();
  }
  if(sending)return <div className="appointment-loader"><AshesLoader label="Creating appointment letter…"/></div>;
  return <div className="appointment-composer portal-card">
    <div className="appointment-composer-head"><div><span>ASHES HR DOCUMENT</span><h2><FileSignature size={19}/> Appointment letter</h2><p>Create a branded official PDF for {member.name}. It will appear privately in their team portal.</p></div><button type="button" onClick={onClose}><X size={17}/></button></div>
    {error&&<div className="portal-error">{error}</div>}{success&&<div className="portal-success">{success}</div>}
    <form onSubmit={submit}>
      <div className="portal-grid-2">
        <div className="portal-field"><label>Document title</label><input value={form.documentTitle} onChange={e=>setForm({...form,documentTitle:e.target.value})}/></div>
        <div className="portal-field"><label>Position / title</label><input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
        <div className="portal-field"><label>Department</label><input value={form.department} onChange={e=>setForm({...form,department:e.target.value})}/></div>
        <div className="portal-field"><label>Start date</label><input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/></div>
        <div className="portal-field"><label>Salary amount</label><input type="number" min="0" value={form.salaryAmount} onChange={e=>setForm({...form,salaryAmount:e.target.value})}/></div>
        <div className="portal-field"><label>Salary currency</label><select value={form.salaryCurrency} onChange={e=>setForm({...form,salaryCurrency:e.target.value})}><option>PKR</option><option>USD</option><option>GBP</option><option>AED</option></select></div>
        <div className="portal-field"><label>Pay frequency</label><select value={form.salaryFrequency} onChange={e=>setForm({...form,salaryFrequency:e.target.value})}><option value="month">Monthly</option><option value="week">Weekly</option><option value="project">Per project</option><option value="hour">Hourly</option></select></div>
        <div className="portal-field"><label>Employment status</label><select value={form.employmentStatus} onChange={e=>setForm({...form,employmentStatus:e.target.value})}><option>Active</option><option>Probation</option><option>Contract</option><option>Intern</option><option>Part-time</option></select></div>
      </div>
      <div className="appointment-copy-grid">
        <div className="portal-field"><label>Opening paragraph (optional)</label><textarea value={form.intro} onChange={e=>setForm({...form,intro:e.target.value})} placeholder="Leave blank to use the polished Ashes default wording."/></div>
        <div className="portal-field"><label>Closing paragraph (optional)</label><textarea value={form.closing} onChange={e=>setForm({...form,closing:e.target.value})} placeholder="Leave blank to use the Ashes default closing."/></div>
      </div>
      <div className="portal-grid-2">
        <div className="portal-field"><label>Signed by</label><input value={form.signatoryName} onChange={e=>setForm({...form,signatoryName:e.target.value})}/></div>
        <div className="portal-field"><label>Signatory title</label><input value={form.signatoryTitle} onChange={e=>setForm({...form,signatoryTitle:e.target.value})}/></div>
      </div>
      <div className="appointment-actions"><button type="button" className="pill-btn" onClick={onClose}>Cancel</button><button className="pill-btn solid"><Send size={14}/> Generate & send PDF</button></div>
    </form>
  </div>
}

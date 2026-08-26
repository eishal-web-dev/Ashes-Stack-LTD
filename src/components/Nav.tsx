import { Menu, UserCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type AccountUser = { id: string; name?: string; email?: string } | null;

export default function Nav(){
  const [open,setOpen]=useState(false);
  const [user,setUser]=useState<AccountUser>(null);
  const [authChecked,setAuthChecked]=useState(false);

  useEffect(()=>{
    let cancelled=false;
    fetch('/api/workspace?auth=me',{credentials:'include'})
      .then(async res=>{
        if(!res.ok) return null;
        return res.json();
      })
      .then(data=>{if(!cancelled)setUser(data?.id?data:null)})
      .catch(()=>{if(!cancelled)setUser(null)})
      .finally(()=>{if(!cancelled)setAuthChecked(true)});
    return()=>{cancelled=true};
  },[]);

  return <header className="nav">
    <div className="nav-brand">
      <Link to="/" aria-label="Ashes home"><img src="/ashes-logo-transparent.webp" alt="ASHES"/></Link>
      <span>AVAILABLE FOR PROJECTS</span>
    </div>
    <nav className={open?'open':''}>
      {[['Work','/work'],['Hire Ashes','/hire/3d-websites'],['Brain','/workspace'],['Blog','/blog'],['Guides','/guides'],['About','/about'],['Contact','/contact']].map(([a,b])=><Link key={a} to={b} onClick={()=>setOpen(false)}>{a}</Link>)}
    </nav>
    {authChecked && user ? (
      <Link className="nav-cta nav-profile" to="/workspace" aria-label="Open your Ashes profile" title={user.name || user.email || 'Your Ashes profile'}>
        <UserCircle size={22}/>
      </Link>
    ) : (
      <Link className="nav-cta" to="/login">Sign in <span>+</span></Link>
    )}
    <button className="menu" onClick={()=>setOpen(v=>!v)} aria-label="Toggle menu" aria-expanded={open}>{open?<X/>:<Menu/>}</button>
  </header>
}

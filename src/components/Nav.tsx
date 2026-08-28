import { LogOut, Menu, UserCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type AccountUser = { id: string; name?: string; email?: string; avatar?: string } | null;
const GMAIL_PROFILE_PHOTO = 'https://lh3.googleusercontent.com/a/ACg8ocL3EfRIwDi7jAweXxfI-v6c57yLfbn9_IacTh-WASbRDJZ6BkN6=s96-c';

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

  const profilePhoto = user?.avatar || (user?.email?.toLowerCase()==='eishal.cecos@gmail.com' ? GMAIL_PROFILE_PHOTO : '');

  async function logout(){
    try{
      await fetch('/api/workspace?auth=logout',{method:'POST',credentials:'include'});
    } finally {
      setUser(null);
      window.location.assign('/');
    }
  }

  return <header className="nav">
    <div className="nav-brand">
      <Link to="/" aria-label="Ashes home"><img src="/ashes-logo-transparent.webp" alt="ASHES"/></Link>
      <span>AVAILABLE FOR PROJECTS</span>
    </div>
    <nav className={open?'open':''}>
      {[['Work','/work'],['Hire Ashes','/hire/3d-websites'],['Brain','/workspace'],['Connect','/connect'],['Blog','/blog'],['Guides','/guides'],['About','/about'],['Contact','/contact']].map(([a,b])=><Link key={a} to={b} onClick={()=>setOpen(false)}>{a}</Link>)}
    </nav>
    {authChecked && user ? (
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <Link className="nav-cta nav-profile" to="/workspace" aria-label="Open your Ashes profile" title={user.name || user.email || 'Your Ashes profile'}>
          {profilePhoto ? <img src={profilePhoto} alt="Your profile" style={{width:28,height:28,borderRadius:'50%',objectFit:'cover',display:'block'}}/> : <UserCircle size={22}/>} 
        </Link>
        <button className="nav-cta nav-profile" type="button" onClick={logout} aria-label="Log out" title="Log out" style={{cursor:'pointer'}}><LogOut size={20}/></button>
      </div>
    ) : (
      <Link className="nav-cta" to="/login">Sign in <span>+</span></Link>
    )}
    <button className="menu" onClick={()=>setOpen(v=>!v)} aria-label="Toggle menu" aria-expanded={open}>{open?<X/>:<Menu/>}</button>
  </header>
}

import { LogOut, Menu, UserCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

type AccountUser = { id: string; name?: string; email?: string; avatar?: string } | null;
const GMAIL_PROFILE_PHOTO = 'https://lh3.googleusercontent.com/a/ACg8ocL3EfRIwDi7jAweXxfI-v6c57yLfbn9_IacTh-WASbRDJZ6BkN6=s96-c';

export default function Nav(){
  const [open,setOpen]=useState(false);
  const [user,setUser]=useState<AccountUser>(null);
  const [authChecked,setAuthChecked]=useState(false);
  const [profileOpen,setProfileOpen]=useState(false);
  const profileRef=useRef<HTMLDivElement>(null);

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

  useEffect(()=>{
    const close=(event:MouseEvent)=>{
      if(profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown',close);
    return()=>document.removeEventListener('mousedown',close);
  },[]);

  const profilePhoto = user?.avatar || (user?.email?.toLowerCase()==='eishal.cecos@gmail.com' ? GMAIL_PROFILE_PHOTO : '');

  async function logout(){
    try{
      await fetch('/api/workspace?auth=logout',{method:'POST',credentials:'include'});
    } finally {
      setUser(null);
      setProfileOpen(false);
      window.location.assign('/');
    }
  }

  return <header className="nav">
    <div className="nav-brand">
      <Link to="/" aria-label="Ashes home"><img src="/ashes-logo-transparent.webp" alt="ASHES"/></Link>
      <span>AVAILABLE FOR PROJECTS</span>
    </div>
    <nav className={open?'open':''}>
      {[['Work','/work'],['Hire Ashes','/hire/3d-websites'],['Brain','/workspace'],['Blog','/blog'],['Guides','/guides'],['About','/about'],['Contact','/contact']].map(([a,b])=><Link key={a} to={b} onClick={()=>setOpen(false)}>{a}</Link>)}
    </nav>
    {authChecked && user ? (
      <div ref={profileRef} style={{position:'relative'}}>
        <button className="nav-cta nav-profile" type="button" onClick={()=>setProfileOpen(v=>!v)} aria-label="Open your Ashes account menu" aria-expanded={profileOpen} title={user.name || user.email || 'Your Ashes profile'} style={{cursor:'pointer'}}>
          {profilePhoto ? <img src={profilePhoto} alt="Your profile" style={{width:28,height:28,borderRadius:'50%',objectFit:'cover',display:'block'}}/> : <UserCircle size={22}/>} 
        </button>
        {profileOpen && <div style={{position:'absolute',right:0,top:'calc(100% + 10px)',minWidth:220,padding:10,borderRadius:16,background:'rgba(12,12,12,.96)',border:'1px solid rgba(255,255,255,.12)',boxShadow:'0 18px 45px rgba(0,0,0,.35)',zIndex:1000}}>
          <div style={{padding:'8px 10px 10px',borderBottom:'1px solid rgba(255,255,255,.08)',marginBottom:6}}>
            <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{user.name || 'Ashes account'}</div>
            {user.email && <div style={{fontSize:11,color:'#8d8981',marginTop:3,wordBreak:'break-all'}}>{user.email}</div>}
          </div>
          <Link to="/workspace" onClick={()=>setProfileOpen(false)} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 11px',borderRadius:10,color:'#fff',textDecoration:'none',fontSize:13}}><UserCircle size={16}/> Brain / Profile</Link>
          <button type="button" onClick={logout} style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'10px 11px',borderRadius:10,border:0,background:'transparent',color:'#ff7b7b',fontSize:13,textAlign:'left',cursor:'pointer'}}><LogOut size={16}/> Log out</button>
        </div>}
      </div>
    ) : (
      <Link className="nav-cta" to="/login">Sign in <span>+</span></Link>
    )}
    <button className="menu" onClick={()=>setOpen(v=>!v)} aria-label="Toggle menu" aria-expanded={open}>{open?<X/>:<Menu/>}</button>
  </header>
}

import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AshesLoader from './AshesLoader';

export default function RouteAshesLoader(){
  const location=useLocation();
  const [show,setShow]=useState(false);
  const pending=useRef(0);
  const revealTimer=useRef<number|null>(null);
  const hideTimer=useRef<number|null>(null);

  useEffect(()=>{
    setShow(true);
    const timer=window.setTimeout(()=>setShow(false),550);
    return()=>window.clearTimeout(timer);
  },[location.pathname,location.search]);

  useEffect(()=>{
    const originalFetch=window.fetch.bind(window);
    const begin=()=>{
      pending.current+=1;
      if(revealTimer.current)window.clearTimeout(revealTimer.current);
      revealTimer.current=window.setTimeout(()=>setShow(true),140);
    };
    const end=()=>{
      pending.current=Math.max(0,pending.current-1);
      if(pending.current!==0)return;
      if(revealTimer.current){window.clearTimeout(revealTimer.current);revealTimer.current=null;}
      if(hideTimer.current)window.clearTimeout(hideTimer.current);
      hideTimer.current=window.setTimeout(()=>setShow(false),260);
    };
    window.fetch=async(...args)=>{
      begin();
      try{return await originalFetch(...args)}finally{end()}
    };
    return()=>{
      window.fetch=originalFetch;
      if(revealTimer.current)window.clearTimeout(revealTimer.current);
      if(hideTimer.current)window.clearTimeout(hideTimer.current);
    };
  },[]);

  if(!show)return null;
  return <div className="ashes-route-loader"><AshesLoader label="Loading Ashes…"/></div>;
}

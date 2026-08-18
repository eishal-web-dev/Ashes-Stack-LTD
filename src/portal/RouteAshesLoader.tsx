import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AshesLoader from './AshesLoader';

export default function RouteAshesLoader(){
  const location=useLocation();
  const [show,setShow]=useState(false);
  useEffect(()=>{
    setShow(true);
    const timer=window.setTimeout(()=>setShow(false),650);
    return()=>window.clearTimeout(timer);
  },[location.pathname,location.search]);
  if(!show)return null;
  return <div className="ashes-route-loader"><AshesLoader label="Loading Ashes…"/></div>;
}

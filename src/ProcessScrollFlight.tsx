import { useEffect } from 'react';

export default function ProcessScrollFlight(){
  useEffect(()=>{
    const section=document.querySelector<HTMLElement>('.process');
    if(!section)return;
    let frame=0;
    const update=()=>{
      frame=0;
      const rect=section.getBoundingClientRect();
      const viewport=window.innerHeight||1;
      const start=viewport*.82;
      const end=-rect.height*.18;
      const progress=Math.max(0,Math.min(1,(start-rect.top)/(start-end)));
      section.style.setProperty('--process-progress',String(progress));
      section.style.setProperty('--process-flight-x',`${6+progress*88}%`);
      section.style.setProperty('--process-flight-y',`${51+Math.sin(progress*Math.PI*4)*2.2}%`);
      section.style.setProperty('--process-flight-rotate',`${Math.sin(progress*Math.PI*6)*7}deg`);
    };
    const requestUpdate=()=>{if(!frame)frame=requestAnimationFrame(update)};
    update();
    window.addEventListener('scroll',requestUpdate,{passive:true});
    window.addEventListener('resize',requestUpdate,{passive:true});
    return()=>{if(frame)cancelAnimationFrame(frame);window.removeEventListener('scroll',requestUpdate);window.removeEventListener('resize',requestUpdate)};
  },[]);
  return null;
}

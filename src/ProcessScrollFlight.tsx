import { useEffect } from 'react';

export default function ProcessScrollFlight(){
  useEffect(()=>{
    const section=document.querySelector<HTMLElement>('.process');
    if(!section)return;
    const observer=new IntersectionObserver(([entry])=>{
      section.classList.toggle('process-flight-active',entry.isIntersecting);
    },{threshold:.22});
    observer.observe(section);
    return()=>observer.disconnect();
  },[]);
  return null;
}

import { useEffect } from 'react';

export default function LowerPageSocials(){
  useEffect(()=>{
    const section=document.querySelector<HTMLElement>('.cta, .contact');
    if(!section || section.querySelector('.final-socials')) return;
    const wrap=document.createElement('div');
    wrap.className='final-socials';
    wrap.innerHTML=`<span>FIND ASHES</span><nav><a href="https://github.com/eishal-web-dev" target="_blank" rel="noreferrer">GITHUB ↗</a><a href="https://wa.me/923305315817?text=Hi%2C%20I%20found%20you%20through%20Ashes." target="_blank" rel="noreferrer">WHATSAPP ↗</a></nav>`;
    section.appendChild(wrap);
  },[]);
  return null;
}

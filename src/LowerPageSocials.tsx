import { useEffect } from 'react';

const instagramIcon=`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M11.47 5C7.91 5 5 7.91 5 11.47v9.06C5 24.09 7.91 27 11.47 27h9.06C24.09 27 27 24.09 27 20.53v-9.06C27 7.91 24.09 5 20.53 5h-9.06Zm0 2h9.06A4.47 4.47 0 0 1 25 11.47v9.06A4.47 4.47 0 0 1 20.53 25h-9.06A4.47 4.47 0 0 1 7 20.53v-9.06A4.47 4.47 0 0 1 11.47 7ZM21.9 9.19a.9.9 0 1 0 0 1.81.9.9 0 0 0 0-1.81ZM16 10a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"/></svg>`;
const linkedinIcon=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z"/></svg>`;
const tiktokIcon=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.6 5.82c-.94-.82-1.5-2-1.56-3.32h-3.09v12.9a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z"/></svg>`;
const whatsappIcon=`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 5a11 11 0 0 0-9.48 16.58L5 27l5.58-1.46A11 11 0 1 0 16 5Zm0 2a9 9 0 1 1-4.6 16.73l-.35-.21-3.18.83.85-3.09-.23-.37A9 9 0 0 1 16 7Zm-4.1 4.2c-.23 0-.6.09-.91.43-.32.35-1.2 1.17-1.2 2.86 0 1.68 1.23 3.31 1.4 3.54.17.23 2.4 3.66 5.82 5.13.81.35 1.45.56 1.94.72.81.26 1.55.22 2.14.13.65-.1 2.01-.82 2.3-1.61.28-.8.28-1.48.2-1.62-.09-.14-.32-.23-.66-.4-.35-.17-2.02-1-2.33-1.11-.31-.12-.54-.17-.77.17-.23.35-.88 1.11-1.08 1.34-.2.23-.4.26-.74.09-.35-.17-1.46-.54-2.78-1.72a10.4 10.4 0 0 1-1.92-2.39c-.2-.35-.02-.53.15-.7.15-.16.35-.4.52-.6.17-.2.23-.35.35-.58.11-.23.05-.43-.03-.6-.09-.18-.77-1.86-1.06-2.54-.28-.67-.56-.58-.77-.59h-.66Z"/></svg>`;

export default function LowerPageSocials(){
  useEffect(()=>{
    const wrapTarget=document.querySelector<HTMLElement>('.philosophy-phoenix-wrap');
    if(!wrapTarget)return;
    wrapTarget.querySelector('.final-socials')?.remove();
    const wrap=document.createElement('div');
    wrap.className='final-socials social-cluster-wrap phoenix-socials';
    wrap.innerHTML=`
      <div class="social-cluster" aria-label="Ashes social links">
        <div class="social-slot social-instagram">
          <a class="social-shape shape-1" href="https://www.instagram.com/ashes.stack?igsh=djliMm9nMTd0NHVi" target="_blank" rel="noreferrer" aria-label="Instagram — @ashes.stack">${instagramIcon}</a>
          <aside class="social-comment"><b>INSTAGRAM</b><span>Visual work, builds & studio drops.</span><small>@ASHES.STACK ↗</small></aside>
        </div>
        <div class="social-slot social-linkedin">
          <a class="social-shape shape-2" href="https://www.linkedin.com/in/eishal-9679a42b9?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noreferrer" aria-label="LinkedIn — Eishal">${linkedinIcon}</a>
          <aside class="social-comment"><b>LINKEDIN</b><span>Studio updates & professional network.</span><small>CONNECT ↗</small></aside>
        </div>
        <div class="social-slot social-tiktok">
          <a class="social-shape shape-3" href="https://www.tiktok.com/@eishal_4a?_r=1&_t=ZS-98ygYWaw3L3" target="_blank" rel="noreferrer" aria-label="TikTok — @eishal_4a">${tiktokIcon}</a>
          <aside class="social-comment"><b>TIKTOK</b><span>Behind the builds, short form.</span><small>@EISHAL_4A ↗</small></aside>
        </div>
        <div class="social-slot social-whatsapp">
          <a class="social-shape shape-4" href="https://wa.me/923305315817?text=Hi%2C%20I%20found%20you%20through%20Ashes." target="_blank" rel="noreferrer" aria-label="WhatsApp — 0330 5315817">${whatsappIcon}</a>
          <aside class="social-comment"><b>WHATSAPP</b><span>0330 5315817</span><small>PROJECTS · WEBSITES · ASHES ↗</small></aside>
        </div>
      </div>`;
    wrapTarget.appendChild(wrap);
  },[]);
  return null;
}

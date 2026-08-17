import { useEffect } from 'react';

const instagramIcon=`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M11.47 5C7.91 5 5 7.91 5 11.47v9.06C5 24.09 7.91 27 11.47 27h9.06C24.09 27 27 24.09 27 20.53v-9.06C27 7.91 24.09 5 20.53 5h-9.06Zm0 2h9.06A4.47 4.47 0 0 1 25 11.47v9.06A4.47 4.47 0 0 1 20.53 25h-9.06A4.47 4.47 0 0 1 7 20.53v-9.06A4.47 4.47 0 0 1 11.47 7ZM21.9 9.19a.9.9 0 1 0 0 1.81.9.9 0 0 0 0-1.81ZM16 10a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"/></svg>`;
const xIcon=`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6.7 6h5.6l4.9 6.5L22.8 6h2.5l-6.9 8.4L25.8 26h-5.6l-5.3-7-6 7H6.3l7.4-8.9L6.7 6Zm4.4 2 10.1 16h1.5L12.6 8h-1.5Z"/></svg>`;
const githubIcon=`<svg viewBox="0 0 30 30" aria-hidden="true"><path d="M15 3C8.37 3 3 8.37 3 15c0 5.62 3.87 10.33 9.09 11.63-.06-.16-.09-.35-.09-.58V24h-1.51c-.82 0-1.55-.35-1.9-1.01-.39-.73-.46-1.84-1.44-2.53-.29-.23-.07-.49.26-.45.62.17 1.13.6 1.61 1.22.48.63.7.77 1.6.77.43 0 1.08-.03 1.69-.12.33-.83.9-1.6 1.59-1.96C9.9 19.51 8 17.52 8 14.82c0-1.16.5-2.29 1.34-3.23C9.05 10.65 8.71 8.73 9.44 8c1.8 0 2.88 1.17 3.14 1.48A9.2 9.2 0 0 1 15.5 9c1.03 0 2.02.17 2.92.48C18.68 9.17 19.76 8 21.57 8c.73.73.38 2.66.1 3.59A4.87 4.87 0 0 1 23 14.82c0 2.7-1.9 4.68-5.9 5.1 1.1.57 1.9 2.18 1.9 3.39v2.74c0 .1-.02.18-.04.27A12 12 0 0 0 27 15c0-6.63-5.37-12-12-12Z"/></svg>`;
const whatsappIcon=`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 5a11 11 0 0 0-9.48 16.58L5 27l5.58-1.46A11 11 0 1 0 16 5Zm0 2a9 9 0 1 1-4.6 16.73l-.35-.21-3.18.83.85-3.09-.23-.37A9 9 0 0 1 16 7Zm-4.1 4.2c-.23 0-.6.09-.91.43-.32.35-1.2 1.17-1.2 2.86 0 1.68 1.23 3.31 1.4 3.54.17.23 2.4 3.66 5.82 5.13.81.35 1.45.56 1.94.72.81.26 1.55.22 2.14.13.65-.1 2.01-.82 2.3-1.61.28-.8.28-1.48.2-1.62-.09-.14-.32-.23-.66-.4-.35-.17-2.02-1-2.33-1.11-.31-.12-.54-.17-.77.17-.23.35-.88 1.11-1.08 1.34-.2.23-.4.26-.74.09-.35-.17-1.46-.54-2.78-1.72a10.4 10.4 0 0 1-1.92-2.39c-.2-.35-.02-.53.15-.7.15-.16.35-.4.52-.6.17-.2.23-.35.35-.58.11-.23.05-.43-.03-.6-.09-.18-.77-1.86-1.06-2.54-.28-.67-.56-.58-.77-.59h-.66Z"/></svg>`;

export default function LowerPageSocials(){
  useEffect(()=>{
    const section=document.querySelector<HTMLElement>('.cta, .contact');
    if(!section)return;
    section.querySelector('.final-socials')?.remove();
    const wrap=document.createElement('div');
    wrap.className='final-socials social-cluster-wrap';
    wrap.innerHTML=`
      <div class="social-cluster-label"><span>FIND ASHES</span><small>Hover a channel</small></div>
      <div class="social-cluster" aria-label="Ashes social links">
        <div class="social-slot social-left social-instagram">
          <button class="social-shape shape-1" type="button" aria-label="Instagram — profile link coming soon">${instagramIcon}</button>
          <aside class="social-comment"><b>INSTAGRAM</b><span>Visual work, builds & studio drops.</span><small>PROFILE LINK TO BE ADDED</small></aside>
        </div>
        <div class="social-slot social-right social-x">
          <button class="social-shape shape-2" type="button" aria-label="X — profile link coming soon">${xIcon}</button>
          <aside class="social-comment"><b>X / TWITTER</b><span>Build notes, launches & quick updates.</span><small>PROFILE LINK TO BE ADDED</small></aside>
        </div>
        <div class="social-slot social-left social-github">
          <a class="social-shape shape-3" href="https://github.com/eishal-web-dev" target="_blank" rel="noreferrer" aria-label="GitHub — eishal-web-dev">${githubIcon}</a>
          <aside class="social-comment"><b>GITHUB</b><span>@eishal-web-dev</span><small>CODE · PRODUCTS · EXPERIMENTS ↗</small></aside>
        </div>
        <div class="social-slot social-right social-whatsapp">
          <a class="social-shape shape-4" href="https://wa.me/923305315817?text=Hi%2C%20I%20found%20you%20through%20Ashes." target="_blank" rel="noreferrer" aria-label="WhatsApp — 0330 5315817">${whatsappIcon}</a>
          <aside class="social-comment"><b>WHATSAPP</b><span>0330 5315817</span><small>PROJECTS · WEBSITES · ASHES ↗</small></aside>
        </div>
      </div>`;
    section.appendChild(wrap);
  },[]);
  return null;
}

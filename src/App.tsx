import { ArrowDownRight, ArrowUpRight, Box, Braces, BrainCircuit, Crosshair, Smartphone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Nav from './components/Nav';

const powers=[
  {number:'01',title:'AI\nSYSTEMS',copy:'Intelligent systems that learn, reason and adapt.',icon:BrainCircuit,accent:'#55d9ff',mode:'ai'},
  {number:'02',title:'WEB\nEXPERIENCES',copy:'Fast, beautiful platforms that convert and scale.',icon:Braces,accent:'#ad77ff',mode:'web'},
  {number:'03',title:'MOBILE\nAPPS',copy:'Native-feeling products people actually love.',icon:Smartphone,accent:'#ffb25c',mode:'mobile'},
  {number:'04',title:'IMMERSIVE\n3D',copy:'Cinematic experiences that move people and brands.',icon:Box,accent:'#ff54c8',mode:'vr'}
];

const signals=[
  [-34,-19,'#66ebf2',1.1],[-25,-30,'#ff62c7',2.4],[-14,-23,'#d8ff62',.3],[-5,-32,'#ff875c',3.1],
  [9,-29,'#ad77ff',1.8],[19,-24,'#66ebf2',.7],[30,-17,'#ff62c7',2.8],[36,-5,'#d8ff62',1.5],
  [33,12,'#ff875c',.1],[24,23,'#ad77ff',2.1],[12,30,'#66ebf2',1.2],[-10,29,'#ff62c7',3.4],
  [-23,23,'#d8ff62',.9],[-35,10,'#ff875c',2.6]
] as const;

function Reveal({children,className=''}:{children:React.ReactNode,className?:string}){const ref=useRef<HTMLDivElement>(null);useEffect(()=>{const el=ref.current;if(!el)return;const io=new IntersectionObserver(([entry])=>{if(entry.isIntersecting)el.classList.add('shown')},{threshold:.12});io.observe(el);return()=>io.disconnect()},[]);return <div ref={ref} className={`reveal ${className}`}>{children}</div>}
function Phoenix({className='',variant='plain',priority=false}:{className?:string,variant?:string,priority?:boolean}){return <div className={`phoenix ${className} phoenix-${variant}`}><img src="/ashes-phoenix-hero.webp" alt="Ashes phoenix" draggable={false} loading={priority?'eager':'lazy'} decoding="async" fetchPriority={priority?'high':'auto'}/></div>}
function PowerPhoenix({mode}:{mode:string}){return <img className="power-phoenix" src={`/powers/${mode}.webp`} alt={`${mode} phoenix`} loading="lazy" decoding="async"/>}
function SignalNetwork(){return <div className="signal-network" aria-hidden="true">{signals.map(([x,y,color,delay],i)=><div className="signal" key={i} style={{'--x':`${x}vw`,'--y':`${y}vh`,'--signal':color,'--delay':`-${delay}s`} as React.CSSProperties}><i/><span/><b/></div>)}</div>}

export default function App(){const [power,setPower]=useState(0);return <>
  <div className="grain"/><Nav/>
  <main>
    <section id="top" className="hero"><div className="radar radar-a"/><div className="radar radar-b"/><SignalNetwork/><Phoenix className="hero-phoenix" priority/><div className="hero-energy"/>
      <div className="hero-copy hero-left"><p className="hero-index">01 / DESIGN-LED SOFTWARE</p><h1>WE<br/>BUILD</h1><p className="hero-intro">Digital products engineered<br/>to move people and business.</p><a href="#capabilities">EXPLORE ASHES <ArrowDownRight/></a></div>
      <div className="hero-copy hero-right"><p className="hero-index">ISLAMABAD · EVERYWHERE</p><h1>WHAT<br/>RISES<br/>NEXT.</h1></div>
      <div className="orbit-label orbit-ai"><i/>AI</div><div className="orbit-label orbit-web"><i/>WEB</div><div className="orbit-label orbit-apps"><i/>APPS</div><div className="orbit-label orbit-3d"><i/>3D</div>
      <a className="scroll-cue" href="#capabilities">SCROLL TO EXPLORE <ArrowDownRight/></a>
    </section>

    <section id="capabilities" className="capabilities"><Reveal><p className="kicker">02 / CAPABILITIES</p><h2>ONE STUDIO.<br/><span>FOUR WAYS TO BUILD.</span></h2><p className="section-lede">Strategy, design and engineering—connected from first thought to final release.</p><p className="hint"><span>◉</span> HOVER TO ENTER EACH WORLD</p></Reveal>
      <div className="power-grid">{powers.map((p,i)=>{const Icon=p.icon;return <article key={p.mode} className={`power-card ${power===i?'active':''}`} style={{'--accent':p.accent} as React.CSSProperties} onMouseEnter={()=>setPower(i)}>
        <span className="power-no">{p.number}</span><Icon className="power-icon"/><h3>{p.title.split('\n').map(x=><span key={x}>{x}</span>)}</h3><p>{p.copy}</p><div className="power-scene"><PowerPhoenix mode={p.mode}/><div className="power-device">{p.mode==='ai'?<><span>&gt; PROMPT</span><span>&gt; SOLVE</span><span>&gt; THINK</span></>:p.mode==='web'?<><b>{'{ CODE }'}</b><em>SHIP IT</em></>:p.mode==='mobile'?<div className="phone"><i/><i/><i/></div>:<div className="visor"/>}</div></div><ArrowUpRight className="card-arrow"/></article>})}</div>
    </section>

    <section id="work" className="work"><Reveal><p className="kicker">03 / SELECTED WORK</p><div className="title-row"><h2>BUILT TO WORK.<br/><span>MADE TO BE REMEMBERED.</span></h2><p>THREE PRODUCTS · ONE STANDARD</p></div></Reveal><div className="work-stage"><div className="work-cards">
      <article><span>ASHES AI —<br/>ONE IMAGE.<br/>REAL 3D.</span><div className="face-mesh">A</div><b>SPIN IT</b></article>
      <article><span>NAZAR AI —<br/>COMPUTER VISION<br/>FOR THE PHYSICAL WORLD.</span><div className="network-eye"><i/></div><b>IT SAW THAT</b></article>
      <article><span>WAKULAW —<br/>PAKISTAN'S LEGAL<br/>INTELLIGENCE.</span><div className="law-ui">§<small>ASK · ANALYZE · ACT</small></div><b>ASK THE LAW</b></article>
    </div></div></section>

    <section className="philosophy"><Reveal><p className="kicker">OUR PHILOSOPHY</p><h2>SERIOUS ENGINEERING.<br/><span>UNREASONABLY GOOD DESIGN.</span></h2><p>BUILT TO WORK. MADE TO HIT DIFFERENT.</p></Reveal><div className="principles"><div><Crosshair/><span><b>THINK SHARP</b>Curious minds.<br/>Clear thinking.</span></div><div><Box/><span><b>BUILD SOLID</b>Clean code.<br/>Strong foundations.</span></div><div><span className="spark">✳</span><span><b>MAKE IT ICONIC</b>Details that click.<br/>Design that lasts.</span></div></div></section>

    <section className="process"><Reveal><p className="kicker">OUR PROCESS</p><h2>FROM FIRST PRINCIPLE<br/>TO FINAL PIXEL.</h2></Reveal><div className="process-world"><div className="process-core"/><div className="process-grid">{['VIBE CHECK','MAKE IT\nMAKE SENSE','BUILD\nTHE THING','SHIP &\nEVOLVE'].map((x,i)=><div key={x}><span>0{i+1}</span><b>{x.split('\n').map(v=><em key={v}>{v}</em>)}</b><small>{['Discover','Design','Engineer','Improve'][i]}</small></div>)}</div></div></section>

    <section id="studio" className="about"><Reveal><p className="kicker">ABOUT ASHES</p><h2>ASHES IS A DESIGN-LED<br/>SOFTWARE HOUSE FOR<br/>BRANDS THAT REFUSE<br/>TO BE BORING.</h2></Reveal><ul><li>◇ IMMERSIVE WEB</li><li>⚛ PRODUCT ENGINEERING</li><li>⬡ AI & COMPUTER VISION</li><li>▧ FULL-STACK SYSTEMS</li><li>◎ PRODUCT DESIGN</li></ul></section>

    <section className="cta"><div className="cta-energy" aria-hidden="true"/><div><p className="kicker">START SOMETHING UNIGNORABLE.</p><h2>GOT A WILD IDEA?<br/>GOOD. WE LIKE THOSE.</h2><a href="mailto:hello@ashes.studio">LET'S BUILD IT <ArrowUpRight/></a></div></section>
  </main><footer><div className="footer-brand"><span>ASHES</span><p>Software that refuses<br/>to be forgettable.</p></div><div className="footer-contact"><span>START SOMETHING</span><a href="mailto:hello@ashes.studio">hello@ashes.studio ↗</a></div><nav><a href="#">INSTAGRAM</a><a href="#">LINKEDIN</a><a href="#">GITHUB</a><a href="#top">BACK TO TOP ↑</a></nav><small>© 2026 ASHES · ISLAMABAD / EVERYWHERE</small></footer>
  </>}

import { ArrowDown, ArrowUpRight, Box, Braces, BrainCircuit, Smartphone } from 'lucide-react';
import { Suspense, useEffect, useRef, useState } from 'react';
import Nav from './components/Nav';
import PhoenixScene from './three/PhoenixScene';

const capabilities=[
  {name:'AI systems',tag:'THINK DIFFERENT',copy:'Useful intelligence, built around real people and real work.',icon:BrainCircuit,color:'#ff6554'},
  {name:'Web experiences',tag:'SHIP IT',copy:'Digital experiences that feel alive, fast and unmistakably yours.',icon:Braces,color:'#9f7cff'},
  {name:'Mobile products',tag:'IN YOUR POCKET',copy:'Apps with product instinct, sharp engineering and zero dead weight.',icon:Smartphone,color:'#55dff5'},
  {name:'3D & immersive',tag:'REALITY, REMIXED',copy:'Interactive worlds that turn looking into experiencing.',icon:Box,color:'#d8ff68'},
];
const work=[
  {name:'Ashes AI',type:'IMAGE → 3D',note:'SPIN IT',className:'work-ai'},
  {name:'Nazar AI',type:'VISION INTELLIGENCE',note:'IT SAW THAT',className:'work-nazar'},
  {name:'WakuLAW',type:'LEGAL AI',note:'ASK THE LAW',className:'work-law'},
];

function Reveal({children,className=''}:{children:React.ReactNode,className?:string}){const ref=useRef<HTMLDivElement>(null);useEffect(()=>{const el=ref.current;if(!el)return;const io=new IntersectionObserver(([e])=>e.isIntersecting&&el.classList.add('is-visible'),{threshold:.13});io.observe(el);return()=>io.disconnect()},[]);return <div ref={ref} className={`reveal ${className}`}>{children}</div>}

export default function App(){const [mode,setMode]=useState(0);const [loaded,setLoaded]=useState(false);useEffect(()=>{const t=setTimeout(()=>setLoaded(true),900);return()=>clearTimeout(t)},[]);return <>
  <div className={`loader ${loaded?'loader-away':''}`}><span>ASHES</span><i/></div><div className="noise"/><Nav/>
  <main id="top">
    <section className="hero"><div className="hero-orbit orbit-a"/><div className="hero-orbit orbit-b"/><Suspense fallback={null}><div className="hero-bird"><PhoenixScene mode={0}/></div></Suspense><div className="hero-copy"><p className="eyebrow"><span/> Independent digital studio · Islamabad</p><h1><span>WE BUILD</span><span>WHAT <em>RISES</em> NEXT.</span></h1><p className="hero-sub">AI, products and digital worlds engineered with taste.</p></div><div className="hero-nodes"><span>AI</span><span>WEB</span><span>APPS</span><span>3D</span></div><a className="scroll" href="#capabilities">SCROLL TO EXPLORE <ArrowDown size={14}/></a><p className="drag">DRAG THE PHOENIX</p></section>

    <section className="manifesto"><Reveal><p className="section-no">01 / WHAT WE DO</p><h2>Technology that works.<br/><span>Design that stays with you.</span></h2></Reveal></section>

    <section id="capabilities" className="capability-stage"><div className="sticky-cap"><div className="cap-bird"><PhoenixScene mode={mode}/></div><div className="cap-panel"><p className="section-no">02 / CAPABILITIES</p><p className="cap-kicker">ONE PHOENIX. FOUR MODES.</p><h2>{mode===0?'Pick a power.':capabilities[mode-1].name}</h2><p>{mode===0?'The character changes with the craft. Same obsessive standard underneath.':capabilities[mode-1].copy}</p>{mode>0&&<span className="sticker" style={{background:capabilities[mode-1].color}}>{capabilities[mode-1].tag}</span>}<div className="cap-tabs">{capabilities.map((c,i)=>{const Icon=c.icon;return <button key={c.name} className={mode===i+1?'active':''} onMouseEnter={()=>setMode(i+1)} onFocus={()=>setMode(i+1)} onClick={()=>setMode(i+1)} style={{'--accent':c.color} as React.CSSProperties}><span>0{i+1}</span><Icon/><b>{c.name}</b></button>})}</div></div></div></section>

    <section id="work" className="work"><Reveal><p className="section-no">03 / SELECTED WORK</p><div className="section-head"><h2>Things we made<br/>real.</h2><p>Products born from hard problems,<br/>clear thinking and a little chaos.</p></div></Reveal><div className="work-grid">{work.map((p,i)=><Reveal key={p.name} className={`project ${p.className}`}><div className="project-art"><span className="project-number">0{i+1}</span><div className="project-object">{i===0?<><div className="cube"/><div className="scan"/></>:i===1?<div className="eye"><i/></div>:<div className="law">§</div>}</div><span className="project-note">{p.note}</span></div><div className="project-meta"><span>{p.type}</span><h3>{p.name}</h3><ArrowUpRight/></div></Reveal>)}</div></section>

    <section id="studio" className="philosophy"><Reveal><p className="section-no">04 / OUR THING</p><h2>Serious engineering.<br/><span>Unreasonably good design.</span></h2><p className="big-p">We are a software studio for people building what does not exist yet. Small senior teams. Direct collaboration. No layers of theatre.</p></Reveal><div className="ticker"><div>STRATEGY ✦ AI ✦ PRODUCT ✦ WEBGL ✦ MOBILE ✦ 3D ✦ STRATEGY ✦ AI ✦ PRODUCT ✦ WEBGL ✦ MOBILE ✦ 3D ✦</div></div></section>

    <section className="process"><p className="section-no">05 / HOW WE MOVE</p>{['VIBE CHECK','MAKE IT MAKE SENSE','BUILD THE THING','SHIP & EVOLVE'].map((x,i)=><Reveal key={x} className="process-row"><span>0{i+1}</span><h3>{x}</h3><p>{['We meet, talk honestly, and see if the energy is right.','We find the signal, frame the problem and cut the noise.','Design and engineering move together from day one.','Launch is a beginning. We learn, tune and keep rising.'][i]}</p></Reveal>)}</section>

    <section className="cta"><div className="cta-glow"/><Reveal><p className="section-no">READY WHEN YOU ARE</p><h2>Got a wild idea?</h2><a href="mailto:hello@ashes.studio">LET'S MAKE IT REAL <ArrowUpRight/></a></Reveal><div className="cta-phoenix">A</div></section>
  </main><footer><span>© 2026 ASHES</span><span>ISLAMABAD · WORKING EVERYWHERE</span><div><a href="#">INSTAGRAM</a><a href="#">LINKEDIN</a></div></footer>
  </>}

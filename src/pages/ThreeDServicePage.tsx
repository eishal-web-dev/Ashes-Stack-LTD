import { ArrowDownRight, ArrowUpRight, Check, Cuboid, Gauge, Layers3, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import Nav from '../components/Nav';
import { useSEO } from '../useSEO';

const whatsapp = 'https://wa.me/923305315817?text=Hi%20Eishal%2C%20I%20want%20a%203D%20website%20for%20my%20brand.';

const packages = [
  {
    name: '3D HERO', price: '$300', note: 'A memorable first screen', featured: false,
    items: ['Custom interactive hero section', 'Three.js / WebGL implementation', 'Scroll or pointer interaction', 'Responsive mobile version', 'Performance optimization', 'Source code + deployment']
  },
  {
    name: '3D LANDING', price: '$700', note: 'A complete campaign experience', featured: true,
    items: ['Full custom landing page', 'Interactive 3D hero', 'Cinematic scroll animations', 'Premium UI and graphics', 'Contact or conversion flow', 'Analytics + deployment']
  },
  {
    name: 'CONNECTED BUILD', price: 'FROM $1,200', note: 'Website plus working systems', featured: false,
    items: ['Multi-page 3D website', 'Admin portal or dashboard', 'AI or API integrations', 'Authentication and database', 'Custom reporting workflows', 'Production deployment']
  }
];

export default function ThreeDServicePage() {
  useSEO({
    title: '3D Website Design & Three.js Development | Hire Ashes',
    description: 'Hire Ashes to build a premium interactive 3D website, product experience or cinematic Three.js landing page. Packages from $300.',
    path: '/hire/3d-websites'
  });

  useEffect(() => {
    const schema = document.createElement('script'); schema.type = 'application/ld+json'; schema.id = 'service-schema';
    schema.text = JSON.stringify({
      '@context':'https://schema.org', '@type':'Service', name:'Interactive 3D website design and development',
      provider:{'@type':'Organization',name:'Ashes Stack',url:'https://www.ashesstack.cloud'},
      areaServed:'Worldwide', serviceType:'Three.js, WebGL and interactive 3D website development',
      offers:[
        {'@type':'Offer',name:'3D Hero',price:'300',priceCurrency:'USD'},
        {'@type':'Offer',name:'3D Landing Page',price:'700',priceCurrency:'USD'},
        {'@type':'Offer',name:'Connected 3D Website',price:'1200',priceCurrency:'USD'}
      ]
    });
    document.getElementById('service-schema')?.remove(); document.head.appendChild(schema);
    return () => schema.remove();
  }, []);

  return <><Nav/><main className="service-page">
    <section className="service-hero" id="top">
      <div className="service-grid" aria-hidden="true"/>
      <div className="service-orb orb-one"/><div className="service-orb orb-two"/>
      <p className="service-kicker">ASHES / INTERACTIVE WEB STUDIO</p>
      <h1>YOUR WEBSITE<br/>SHOULD NOT FEEL<br/><span>FLAT.</span></h1>
      <div className="service-intro"><p>Premium Three.js websites, cinematic product experiences and interactive 3D landing pages—designed to make people stop, explore and remember your brand.</p><div><a className="service-primary" href={whatsapp} target="_blank" rel="noreferrer">START ON WHATSAPP <ArrowUpRight/></a><a className="service-secondary" href="#packages">SEE PACKAGES <ArrowDownRight/></a></div></div>
      <div className="service-trust"><span>THREE.JS</span><span>WEBGL</span><span>REACT</span><span>3D OPTIMIZATION</span><span>DEPLOYMENT</span></div>
    </section>

    <section className="service-outcomes">
      <div className="service-section-head"><p>01 / WHAT YOU GET</p><h2>DESIGNED TO IMPRESS.<br/><span>ENGINEERED TO WORK.</span></h2></div>
      <div className="outcome-grid">
        <article><Sparkles/><span>01</span><h3>ORIGINAL ART DIRECTION</h3><p>A visual system built for your product and audience—not another copied template.</p></article>
        <article><Cuboid/><span>02</span><h3>USEFUL INTERACTION</h3><p>3D that explains, demonstrates or sells instead of spinning without a purpose.</p></article>
        <article><Gauge/><span>03</span><h3>REAL PERFORMANCE</h3><p>Compressed assets, device-aware effects, lazy loading and mobile fallbacks.</p></article>
        <article><Layers3/><span>04</span><h3>COMPLETE DELIVERY</h3><p>Responsive development, conversion flow, testing, deployment and source code.</p></article>
      </div>
    </section>

    <section className="service-work">
      <div className="service-section-head"><p>02 / PROOF OF WORK</p><h2>NOT A MOCKUP.<br/><span>OPEN THE EXPERIENCE.</span></h2></div>
      <div className="service-showcase">
        <a href="https://lizard-anatomy-3d.vercel.app" target="_blank" rel="noreferrer"><small>INTERACTIVE ANATOMY</small><h3>LIZARD<br/>ANATOMY 3D</h3><p>A scroll-driven layered dissection experience built for the browser.</p><b>VIEW LIVE <ArrowUpRight/></b></a>
        <a href="https://www.ashesstack.cloud" target="_blank" rel="noreferrer"><small>STUDIO EXPERIENCE</small><h3>ASHES<br/>STACK</h3><p>Interactive motion, custom graphics and a performance-aware responsive system.</p><b>VIEW LIVE <ArrowUpRight/></b></a>
      </div>
    </section>

    <section className="service-packages" id="packages">
      <div className="service-section-head"><p>03 / SIMPLE PACKAGES</p><h2>KNOW THE STARTING POINT.<br/><span>NO MYSTERY QUOTES.</span></h2></div>
      <div className="package-grid">{packages.map(item => <article className={item.featured?'featured':''} key={item.name}>{item.featured&&<em>MOST POPULAR</em>}<p>{item.name}</p><h3>{item.price}</h3><small>{item.note}</small><ul>{item.items.map(feature=><li key={feature}><Check/>{feature}</li>)}</ul><a href={whatsapp} target="_blank" rel="noreferrer">CHOOSE {item.name} <ArrowUpRight/></a></article>)}</div>
      <p className="package-note">Prices are starting points for a clearly defined scope. 3D asset creation, complex configurators and external platform fees are quoted separately before work begins.</p>
    </section>

    <section className="service-process">
      <div className="service-section-head"><p>04 / THE PROCESS</p><h2>FROM IDEA<br/><span>TO LIVE.</span></h2></div>
      <ol><li><span>01</span><div><h3>BRIEF</h3><p>Send the product, goal, references and deadline.</p></div></li><li><span>02</span><div><h3>DIRECTION</h3><p>We agree on scope, visual direction and deliverables.</p></div></li><li><span>03</span><div><h3>BUILD</h3><p>A working experience is developed and shared for review.</p></div></li><li><span>04</span><div><h3>SHIP</h3><p>We optimize, test and deploy the approved website.</p></div></li></ol>
    </section>

    <section className="service-faq">
      <div className="service-section-head"><p>05 / QUESTIONS</p><h2>BEFORE WE<br/><span>START.</span></h2></div>
      <div><details><summary>Will the website work on mobile?</summary><p>Yes. The interaction, layout and asset quality are adapted for touch devices and realistic mobile performance.</p></details><details><summary>Do I need to provide a 3D model?</summary><p>Not always. If you have a model, it can be optimized for the web. If a new asset must be created, that scope is priced separately before work begins.</p></details><details><summary>How long does it take?</summary><p>A focused hero can take about one week. A complete landing experience typically needs two to three weeks, depending on assets and feedback.</p></details><details><summary>Can you connect forms, ecommerce or an admin portal?</summary><p>Yes. Connected functionality is available in the larger package or as a custom scope.</p></details></div>
    </section>

    <section className="service-final"><p>MAKE THE FIRST IMPRESSION COUNT.</p><h2>LET'S BUILD SOMETHING<br/>PEOPLE REMEMBER.</h2><div><a href={whatsapp} target="_blank" rel="noreferrer">MESSAGE ON WHATSAPP <ArrowUpRight/></a><Link to="/contact">OTHER CONTACT OPTIONS</Link></div></section>
  </main><Footer/></>;
}

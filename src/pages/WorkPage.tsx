import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { useSEO } from '../useSEO';

const projects = [
  { tag: '01 / IMAGE → 3D', name: 'ASHES AI', copy: 'One image in. A product you can spin, explore and sell in 3D — turning flat product photos into interactive 3D experiences.', accent: '#ff54c8' },
  { tag: '02 / VISION AI', name: 'NAZAR AI', copy: 'A camera-powered watcher for activity, safety and the physical world — real-time computer vision built for practical use.', accent: '#55d9ff' },
  { tag: '03 / LEGAL AI', name: 'WAKULAW', copy: 'Pakistani legal intelligence with research, reasoning and case support — AI built specifically for local legal workflows.', accent: '#ad77ff' },
];

export default function WorkPage() {
  useSEO({
    title: 'Our Work — ASHES AI, NAZAR AI, WakuLAW | Ashes Stack Portfolio',
    description: 'See what Ashes Stack has built: ASHES AI (3D product experiences), NAZAR AI (computer vision), and WakuLAW (Pakistani legal AI). Real products from our Islamabad software house.',
    path: '/work',
  });

  return (
    <>
      <Nav />
      <div className="standalone-page">
        <div className="page-kicker">03 / SELECTED WORK</div>
        <h1>BUILT TO WORK.<br/><span>MADE TO BE REMEMBERED.</span></h1>
        <p className="page-lede">Three products. One standard. A look at what Ashes Stack has actually shipped.</p>

        <div className="page-body">
          <div className="page-card-grid">
            {projects.map((p) => (
              <div className="page-card" key={p.name} style={{ ['--accent' as any]: p.accent }}>
                <div className="page-card-num">{p.tag}</div>
                <h3>{p.name}</h3>
                <p>{p.copy}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '5vh', color: '#8e8a85', font: '300 .9rem/1.7 Manrope,sans-serif', maxWidth: 560 }}>
            Have a project in mind? <a href="/contact" style={{ color: '#ff68b7' }}>Get in touch</a> — we'd love to hear what you're building.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}

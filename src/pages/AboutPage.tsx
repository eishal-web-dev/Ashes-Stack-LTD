import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { useSEO } from '../useSEO';

export default function AboutPage() {
  useSEO({
    title: 'About Ashes Stack — Software House Founded by Eishal, London',
    description: 'Ashes Stack is a design-led software house in London, United Kingdom, founded by Eishal. We build web design, full-stack development, AI-powered products and immersive 3D websites for brands that refuse to be boring.',
    path: '/about',
  });

  return (
    <>
      <Nav />
      <div className="standalone-page">
        <div className="page-kicker">ABOUT ASHES</div>
        <h1>ASHES IS A DESIGN-LED<br/>SOFTWARE HOUSE FOR<br/>BRANDS THAT REFUSE<br/><span>TO BE BORING.</span></h1>
        <p className="page-lede">
          Ashes Stack is a software house based in London, United Kingdom, founded by Eishal.
          We build websites, web applications, and AI-powered products for startups and growing
          brands — specializing in custom web design, full-stack development, product engineering,
          AI integration, and immersive 3D web experiences.
        </p>

        <div className="page-body">
          <div className="page-card-grid">
            <div className="page-card" style={{ ['--accent' as any]: '#55d9ff' }}>
              <div className="page-card-num">WHO WE ARE</div>
              <h3>Founded by Eishal</h3>
              <p>
                Ashes Stack was started by Eishal as a small, design-obsessed studio — the kind that
                cares as much about how a product feels as how it functions. Every project is treated
                like a real product launch, not a checkbox.
              </p>
            </div>
            <div className="page-card" style={{ ['--accent' as any]: '#ad77ff' }}>
              <div className="page-card-num">WHERE WE WORK</div>
              <h3>London, United Kingdom</h3>
              <p>
                Based in London and building for clients everywhere — local businesses, international
                startups, and everything in between. Remote-first, deadline-serious.
              </p>
            </div>
            <div className="page-card" style={{ ['--accent' as any]: '#d5ff68' }}>
              <div className="page-card-num">WHAT WE BUILD</div>
              <h3>Web, AI &amp; 3D</h3>
              <p>
                Landing pages and full web platforms, AI-integrated tools, and immersive 3D websites —
                the kind of software that gets remembered, not just used.
              </p>
            </div>
          </div>

          <div className="page-card-grid" style={{ marginTop: '3vh' }}>
            <div className="page-card" style={{ ['--accent' as any]: '#ff66b6' }}>
              <div className="page-card-num">HOW WE THINK</div>
              <h3>Think Sharp</h3>
              <p>Question the obvious. Find the cleanest path. Solve the real problem before touching the pixels.</p>
            </div>
            <div className="page-card" style={{ ['--accent' as any]: '#d5ff68' }}>
              <div className="page-card-num">HOW WE BUILD</div>
              <h3>Build Solid</h3>
              <p>Fast is good. Fragile is not. We care about systems that keep working after the launch-day glow fades.</p>
            </div>
            <div className="page-card" style={{ ['--accent' as any]: '#6ee7f0' }}>
              <div className="page-card-num">HOW WE DESIGN</div>
              <h3>Make It Iconic</h3>
              <p>The tiny details matter. Motion, rhythm, spacing and personality should make the product feel unmistakably alive.</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

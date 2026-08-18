import { BrainCircuit, Braces, Smartphone, Box } from 'lucide-react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { useSEO } from '../useSEO';

const powers = [
  { number: '01', title: 'AI Systems', copy: 'Intelligent systems that learn, reason and adapt — chatbots, automation, and custom AI integrations for real business use cases.', icon: BrainCircuit, accent: '#55d9ff' },
  { number: '02', title: 'Web Experiences', copy: 'Fast, beautiful, full-stack web platforms that convert and scale — from landing pages to complex applications.', icon: Braces, accent: '#ad77ff' },
  { number: '03', title: 'Mobile Apps', copy: 'Native-feeling products people actually love using — built for performance and polish on every device.', icon: Smartphone, accent: '#ffb25c' },
  { number: '04', title: 'Immersive 3D', copy: 'Cinematic, three-dimensional web experiences that move people and brands — 3D product viewers, interactive scenes, and more.', icon: Box, accent: '#ff54c8' },
];

export default function ExpertisePage() {
  useSEO({
    title: 'Expertise — AI, Web, Mobile & 3D Development | Ashes Stack',
    description: 'Ashes Stack specializes in AI systems, full-stack web development, mobile apps, and immersive 3D websites. See what our software house builds for clients in Islamabad and beyond.',
    path: '/expertise',
  });

  return (
    <>
      <Nav />
      <div className="standalone-page">
        <div className="page-kicker">02 / EXPERTISE</div>
        <h1>ONE STUDIO.<br/><span>FOUR WAYS TO BUILD.</span></h1>
        <p className="page-lede">
          Strategy, design and engineering — connected from first thought to final release.
          Here's what Ashes Stack actually specializes in.
        </p>

        <div className="page-body">
          <div className="page-card-grid">
            {powers.map((p) => (
              <div className="page-card" key={p.number} style={{ ['--accent' as any]: p.accent }}>
                <div className="page-card-icon"><p.icon size={20} /></div>
                <div className="page-card-num">{p.number} / {p.title.toUpperCase()}</div>
                <h3>{p.title}</h3>
                <p>{p.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

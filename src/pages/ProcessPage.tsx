import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { useSEO } from '../useSEO';

const steps = [
  { n: '01', title: 'Vibe Check', desc: 'Discover — we start by understanding your brand, your users, and the actual problem worth solving.' },
  { n: '02', title: 'Make It Make Sense', desc: 'Design — strategy turns into a real concept: structure, flow, and the look and feel that fits.' },
  { n: '03', title: 'Build The Thing', desc: 'Engineer — the concept gets built for real, with production-grade code, not a throwaway prototype.' },
  { n: '04', title: 'Ship & Evolve', desc: 'Improve — launch, then keep refining based on real usage, not guesswork.' },
];

export default function ProcessPage() {
  useSEO({
    title: 'Our Process — Discover, Design, Engineer, Evolve | Ashes Stack',
    description: 'How Ashes Stack builds software: from first principle to final pixel. A four-step process — Discover, Design, Engineer, Evolve — used on every project.',
    path: '/process',
  });

  return (
    <>
      <Nav />
      <div className="standalone-page">
        <div className="page-kicker">OUR PROCESS</div>
        <h1>FROM FIRST PRINCIPLE<br/><span>TO FINAL PIXEL.</span></h1>
        <p className="page-lede">Every Ashes Stack project moves through the same four stages — no shortcuts, no guesswork.</p>

        <div className="page-body">
          <div className="process-steps-list">
            {steps.map((s) => (
              <div className="process-step-row" key={s.n}>
                <b>{s.n}</b>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

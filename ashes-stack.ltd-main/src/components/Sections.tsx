import { useRef, useEffect } from 'react';
import { ArrowUpRight, MousePointer2, Sparkles, Code2, Smartphone, Boxes, Brain, Globe, Zap } from 'lucide-react';

// ── Hero Section ─────────────────────────────────────────────────
export function HeroSection() {
  return (
    <section
      id="section-hero"
      data-section="hero"
      className="relative min-h-screen flex items-center justify-center px-6"
    >
      {/* WE BUILD — left side, behind wing */}
      <div className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <h1 className="text-5xl md:text-8xl lg:text-9xl font-display font-bold tracking-tight text-ash-50 leading-none">
          WE
          <br />
          BUILD
        </h1>
      </div>

      {/* WHAT RISES NEXT. — right side, in front of dissolving particles */}
      <div className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 z-30 pointer-events-none text-right">
        <h1 className="text-5xl md:text-8xl lg:text-9xl font-display font-bold tracking-tight text-ash-50 leading-none">
          WHAT
          <br />
          RISES
          <br />
          <span className="text-coral-500">NEXT.</span>
        </h1>
      </div>

      {/* AI, WEB, APPS, 3D interaction nodes */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 md:gap-6">
        {[
          { label: 'AI', key: 'ai', icon: Brain, color: 'text-cyan-400' },
          { label: 'WEB', key: 'web', icon: Globe, color: 'text-lime-400' },
          { label: 'APPS', key: 'mobile', icon: Smartphone, color: 'text-coral-400' },
          { label: '3D', key: 'immersive', icon: Boxes, color: 'text-ultraviolet-400' },
        ].map((node) => (
          <button
            key={node.key}
            className="group flex flex-col items-center gap-2 transition-transform hover:scale-110"
            onMouseEnter={() => setPhoenixSection(node.key)}
            onMouseLeave={() => setPhoenixSection(null)}
            onClick={() => {
              document.getElementById(`section-${node.key}`)?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full glass flex items-center justify-center group-hover:bg-ash-700/60 transition-colors">
              <node.icon className={`w-5 h-5 md:w-6 md:h-6 ${node.color}`} strokeWidth={1.5} />
            </div>
            <span className="text-xs font-mono tracking-ultra-wide text-ash-300 group-hover:text-ash-50 transition-colors">
              {node.label}
            </span>
          </button>
        ))}
      </div>

      {/* DRAG TO ROTATE */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 text-ash-400 text-xs font-mono tracking-ultra-wide">
        <MousePointer2 className="w-3.5 h-3.5 animate-ash-pulse" />
        DRAG TO ROTATE
      </div>

      {/* ENTER THE EXPERIENCE */}
      <a
        href="#capabilities"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('section-capabilities')?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="absolute top-20 right-6 md:right-12 z-30 flex items-center gap-2 text-xs font-mono tracking-ultra-wide text-ash-200 hover:text-ash-50 transition-colors glass rounded-full px-4 py-2"
      >
        ENTER THE EXPERIENCE
        <ArrowUpRight className="w-3.5 h-3.5 text-coral-500" />
      </a>
    </section>
  );
}

// ── Capabilities Overview ────────────────────────────────────────
export function CapabilitiesSection() {
  return (
    <section
      id="section-capabilities"
      data-section="capabilities"
      className="relative min-h-screen flex items-center justify-center px-6 py-24"
    >
      <div className="max-w-4xl mx-auto text-center z-20 pointer-events-none">
        <div className="text-xs font-mono tracking-ultra-wide text-ash-400 mb-4">
          / CAPABILITIES
        </div>
        <h2 className="text-4xl md:text-6xl font-display font-bold text-ash-50 leading-tight mb-6 text-balance">
          Four disciplines.
          <br />
          <span className="text-ultraviolet-400">One phoenix.</span>
        </h2>
        <p className="text-lg text-ash-300 max-w-2xl mx-auto leading-relaxed">
          We build what rises next across AI systems, web experiences, mobile apps,
          and immersive 3D. Scroll to watch the phoenix transform.
        </p>
      </div>
    </section>
  );
}

// ── AI Systems ───────────────────────────────────────────────────
export function AISection() {
  return (
    <section
      id="section-ai"
      data-section="ai"
      className="relative min-h-screen flex items-center px-6 py-24"
    >
      <div className="absolute left-6 md:left-12 max-w-md z-20 pointer-events-none">
        <div className="flex items-center gap-2 text-cyan-400 mb-4">
          <Brain className="w-5 h-5" />
          <span className="text-xs font-mono tracking-ultra-wide">/ AI SYSTEMS</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-bold text-ash-50 leading-tight mb-4">
          Intelligence
          <br />
          <span className="text-cyan-400">worn lightly.</span>
        </h2>
        <p className="text-ash-300 leading-relaxed mb-6">
          Neural particles orbit the phoenix as it wears translucent smart glasses.
          Prompt fragments drift through space. Every system we build is quietly
          confident — intelligent without shouting.
        </p>
        <div className="flex flex-wrap gap-2">
          {['LLM Integration', 'RAG Pipelines', 'Neural Search', 'Agents'].map((tag) => (
            <span key={tag} className="text-xs font-mono px-3 py-1 glass rounded-full text-cyan-300">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Web Experiences ──────────────────────────────────────────────
export function WebSection() {
  return (
    <section
      id="section-web"
      data-section="web"
      className="relative min-h-screen flex items-center justify-end px-6 py-24"
    >
      <div className="absolute right-6 md:right-12 max-w-md z-20 pointer-events-none text-right">
        <div className="flex items-center justify-end gap-2 text-lime-400 mb-4">
          <span className="text-xs font-mono tracking-ultra-wide">/ WEB EXPERIENCES</span>
          <Globe className="w-5 h-5" />
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-bold text-ash-50 leading-tight mb-4">
          Shipped, not
          <br />
          <span className="text-lime-400">just designed.</span>
        </h2>
        <p className="text-ash-300 leading-relaxed mb-6">
          The phoenix works on a floating laptop, wings near the keyboard.
          Browser windows orbit. There's a SHIP IT sticker because we believe
          in finishing things.
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          {['React', 'Next.js', 'Three.js', 'WebGL'].map((tag) => (
            <span key={tag} className="text-xs font-mono px-3 py-1 glass rounded-full text-lime-300">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Mobile Apps ──────────────────────────────────────────────────
export function MobileSection() {
  return (
    <section
      id="section-mobile"
      data-section="mobile"
      className="relative min-h-screen flex items-center px-6 py-24"
    >
      <div className="absolute left-6 md:left-12 max-w-md z-20 pointer-events-none">
        <div className="flex items-center gap-2 text-coral-400 mb-4">
          <Smartphone className="w-5 h-5" />
          <span className="text-xs font-mono tracking-ultra-wide">/ MOBILE APPS</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-bold text-ash-50 leading-tight mb-4">
          Gen-Z energy,
          <br />
          <span className="text-coral-400">serious craft.</span>
        </h2>
        <p className="text-ash-300 leading-relaxed mb-6">
          The phoenix leans into a relaxed pose, holding a phone, tapping with
          a wing tip. Notifications float. It's playful, but the engineering
          underneath is precise.
        </p>
        <div className="flex flex-wrap gap-2">
          {['iOS', 'Android', 'React Native', 'Flutter'].map((tag) => (
            <span key={tag} className="text-xs font-mono px-3 py-1 glass rounded-full text-coral-300">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Immersive 3D ─────────────────────────────────────────────────
export function ImmersiveSection() {
  return (
    <section
      id="section-immersive"
      data-section="immersive"
      className="relative min-h-screen flex items-center justify-end px-6 py-24"
    >
      <div className="absolute right-6 md:right-12 max-w-md z-20 pointer-events-none text-right">
        <div className="flex items-center justify-end gap-2 text-ultraviolet-400 mb-4">
          <span className="text-xs font-mono tracking-ultra-wide">/ IMMERSIVE 3D</span>
          <Boxes className="w-5 h-5" />
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-bold text-ash-50 leading-tight mb-4">
          Spatial worlds,
          <br />
          <span className="text-ultraviolet-400">reached into.</span>
        </h2>
        <p className="text-ash-300 leading-relaxed mb-6">
          Oversized VR glasses fit around the phoenix's head. Lenses glow with
          restrained coral, violet, and cyan. Elastic shapes and particle
          trails respond to its wings in real time.
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          {['WebXR', 'Unity', 'Three.js', 'Spatial UI'].map((tag) => (
            <span key={tag} className="text-xs font-mono px-3 py-1 glass rounded-full text-ultraviolet-300">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Projects ─────────────────────────────────────────────────────
const PROJECTS = [
  { name: 'Helix AI', category: 'AI Platform', year: '2025', desc: 'Conversational AI for healthcare, deployed across 40 hospitals.' },
  { name: 'Nova Commerce', category: 'Web Experience', year: '2025', desc: 'Award-winning 3D commerce platform with real-time product config.' },
  { name: 'Pulse Fitness', category: 'Mobile App', year: '2024', desc: 'Gen-Z fitness app with 2M downloads and 4.9 star rating.' },
  { name: 'Vortex VR', category: 'Immersive 3D', year: '2024', desc: 'VR training simulator for industrial safety operations.' },
];

export function ProjectsSection() {
  return (
    <section
      id="section-projects"
      data-section="projects"
      className="relative min-h-screen flex items-center px-6 py-24"
    >
      <div className="max-w-5xl mx-auto w-full z-20">
        <div className="text-xs font-mono tracking-ultra-wide text-ash-400 mb-4">
          / SELECTED WORK
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-bold text-ash-50 mb-12">
          The phoenix flies
          <span className="text-cyan-400"> between projects.</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {PROJECTS.map((project, i) => (
            <div
              key={project.name}
              className="glass rounded-2xl p-6 hover:bg-ash-800/60 transition-all group cursor-pointer"
              onMouseEnter={() => setPhoenixSection(i % 2 === 0 ? 'ai' : 'web')}
              onMouseLeave={() => setPhoenixSection(null)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-display font-bold text-ash-50 group-hover:text-cyan-400 transition-colors">
                    {project.name}
                  </h3>
                  <span className="text-xs font-mono text-ash-400">{project.category} · {project.year}</span>
                </div>
                <ArrowUpRight className="w-5 h-5 text-ash-500 group-hover:text-cyan-400 transition-colors" />
              </div>
              <p className="text-sm text-ash-300 leading-relaxed">{project.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Philosophy ───────────────────────────────────────────────────
export function PhilosophySection() {
  return (
    <section
      id="section-philosophy"
      data-section="philosophy"
      className="relative min-h-screen flex items-center justify-center px-6 py-24"
    >
      <div className="max-w-3xl mx-auto text-center z-20 pointer-events-none">
        <div className="text-xs font-mono tracking-ultra-wide text-ash-400 mb-4">
          / PHILOSOPHY
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-bold text-ash-50 leading-tight mb-8 text-balance">
          The phoenix becomes
          <span className="text-ash-400"> wireframe</span> to reveal
          <span className="text-ash-400"> what it's made of.</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {[
            { icon: Sparkles, title: 'Rebirth through ash', desc: 'We build from what came before, never from nothing.' },
            { icon: Code2, title: 'Engineered properly', desc: 'Every pixel, every shader, every line has intent.' },
            { icon: Zap, title: 'Majestic then mischievous', desc: 'Serious at first glance. Playful when explored.' },
          ].map((item) => (
            <div key={item.title} className="text-left">
              <item.icon className="w-6 h-6 text-ash-300 mb-3" strokeWidth={1.5} />
              <h3 className="text-sm font-display font-bold text-ash-100 mb-2">{item.title}</h3>
              <p className="text-sm text-ash-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Process ──────────────────────────────────────────────────────
export function ProcessSection() {
  const steps = [
    { num: '01', title: 'Discover', desc: 'We immerse in your world, understand the problem, map the terrain.' },
    { num: '02', title: 'Design', desc: 'The phoenix interacts with devices — laptop open, phone in hand.' },
    { num: '03', title: 'Build', desc: 'Real code, real geometry, real systems. No placeholders.' },
    { num: '04', title: 'Ship', desc: 'We launch, measure, iterate. The sticker says it all.' },
  ];

  return (
    <section
      id="section-process"
      data-section="process"
      className="relative min-h-screen flex items-center px-6 py-24"
    >
      <div className="max-w-4xl mx-auto w-full z-20">
        <div className="text-xs font-mono tracking-ultra-wide text-ash-400 mb-4">
          / PROCESS
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-bold text-ash-50 mb-12">
          How the phoenix
          <span className="text-lime-400"> works.</span>
        </h2>
        <div className="space-y-1">
          {steps.map((step) => (
            <div
              key={step.num}
              className="flex items-start gap-6 py-6 border-b border-ash-700/50 group hover:border-lime-400/30 transition-colors"
            >
              <span className="text-2xl font-mono text-ash-500 group-hover:text-lime-400 transition-colors w-12">
                {step.num}
              </span>
              <div className="flex-1">
                <h3 className="text-xl font-display font-bold text-ash-50 mb-1">{step.title}</h3>
                <p className="text-ash-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── About ────────────────────────────────────────────────────────
export function AboutSection() {
  return (
    <section
      id="section-about"
      data-section="about"
      className="relative min-h-screen flex items-center justify-end px-6 py-24"
    >
      <div className="absolute right-6 md:right-12 max-w-md z-20 pointer-events-none">
        <div className="text-xs font-mono tracking-ultra-wide text-ash-400 mb-4">
          / ABOUT
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-bold text-ash-50 leading-tight mb-6">
          The phoenix sits
          <br />
          <span className="text-coral-400">on a code window.</span>
        </h2>
        <p className="text-ash-300 leading-relaxed mb-6">
          ASHES is a creative technology studio. We build AI systems, web
          experiences, mobile apps, and immersive 3D for companies that want
          what comes next — not what already exists.
        </p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { num: '40+', label: 'Projects shipped' },
            { num: '12', label: 'Awards won' },
            { num: '8', label: 'Years building' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-display font-bold text-ash-50">{stat.num}</div>
              <div className="text-xs text-ash-400 font-mono">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA ──────────────────────────────────────────────────────────
export function CTASection() {
  return (
    <section
      id="section-cta"
      data-section="cta"
      className="relative min-h-screen flex items-center justify-center px-6 py-24"
    >
      <div className="max-w-2xl mx-auto text-center z-20 pointer-events-none">
        <div className="text-xs font-mono tracking-ultra-wide text-ash-400 mb-4">
          / LET'S BUILD
        </div>
        <h2 className="text-4xl md:text-7xl font-display font-bold text-ash-50 leading-tight mb-6 text-balance">
          The phoenix
          <br />
          <span className="text-ultraviolet-400">reassembles.</span>
        </h2>
        <p className="text-lg text-ash-300 mb-8 max-w-md mx-auto">
          Wings fully open. VR glasses lifted on its forehead. Ready for
          what rises next.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pointer-events-auto">
          <a
            href="mailto:hello@ashes.studio"
            className="px-8 py-3.5 bg-ash-50 text-ash-950 font-mono text-sm tracking-ultra-wide rounded-full hover:bg-coral-500 hover:text-ash-50 transition-colors"
          >
            START A PROJECT
          </a>
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-8 py-3.5 glass text-ash-100 font-mono text-sm tracking-ultra-wide rounded-full hover:bg-ash-700/60 transition-colors"
          >
            BACK TO TOP ↑
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Helper to set phoenix section from UI ────────────────────────
function setPhoenixSection(key: string | null) {
  const fn = (window as unknown as { __setPhoenixSection?: (s: string | null) => void }).__setPhoenixSection;
  if (fn) fn(key);
}

// ── Scroll progress indicator ────────────────────────────────────
export function ScrollProgressIndicator({ progress }: { progress: number }) {
  return (
    <div className="fixed right-4 md:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1.5">
      {Array.from({ length: 11 }).map((_, i) => (
        <div
          key={i}
          className={`w-1 h-4 rounded-full transition-colors duration-300 ${
            progress >= i / 10 ? 'bg-coral-500' : 'bg-ash-700'
          }`}
        />
      ))}
    </div>
  );
}

// ── Section entrance animation hook ──────────────────────────────
export function useSectionEntrance() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-ash-fade-in');
          }
        });
      },
      { threshold: 0.15 },
    );

    document.querySelectorAll('section').forEach((sec) => {
      observerRef.current?.observe(sec);
    });

    return () => observerRef.current?.disconnect();
  }, []);
}

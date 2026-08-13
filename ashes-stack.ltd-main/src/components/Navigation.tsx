import { Flame } from 'lucide-react';

type NavigationProps = {
  onCapabilityHover: (key: string | null) => void;
};

export function Navigation({ onCapabilityHover }: NavigationProps) {
  const links = [
    { label: 'AI', key: 'ai' },
    { label: 'WEB', key: 'web' },
    { label: 'APPS', key: 'mobile' },
    { label: '3D', key: 'immersive' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-5 flex items-center justify-between">
      {/* ASHES logo */}
      <a
        href="#hero"
        className="flex items-center gap-2 group"
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <Flame
          className="w-5 h-5 text-coral-500 transition-transform group-hover:scale-110"
          strokeWidth={2.5}
        />
        <span className="font-display font-bold text-lg tracking-mega text-ash-50">
          ASHES
        </span>
      </a>

      {/* Center nav — capability interaction nodes */}
      <div className="hidden md:flex items-center gap-1 glass rounded-full px-2 py-1.5">
        {links.map((link) => (
          <button
            key={link.key}
            className="px-4 py-1.5 text-xs font-mono tracking-ultra-wide text-ash-300 hover:text-ash-50 transition-colors rounded-full hover:bg-ash-700/50"
            onMouseEnter={() => onCapabilityHover(link.key)}
            onMouseLeave={() => onCapabilityHover(null)}
            onClick={() => {
              document.getElementById(`section-${link.key}`)?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* Right — CTA */}
      <a
        href="#cta"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('section-cta')?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="flex items-center gap-1.5 text-xs font-mono tracking-ultra-wide text-ash-200 hover:text-ash-50 transition-colors"
      >
        ENTER THE EXPERIENCE
        <span className="text-coral-500">↗</span>
      </a>
    </nav>
  );
}

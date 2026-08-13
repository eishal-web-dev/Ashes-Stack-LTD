/**
 * StaticFallbackHero — displayed when WebGL is unavailable.
 * Preserves all text, navigation, links, and CTAs without the 3D phoenix.
 */
export function StaticFallbackHero() {
  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex items-center justify-center">
      <div className="relative">
        {/* Abstract phoenix silhouette using CSS */}
        <div className="relative w-72 h-72 md:w-96 md:h-96">
          {/* Central glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-radial from-ultraviolet-500/20 via-ash-700/10 to-transparent" />

          {/* Wing shapes */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-32 h-48 md:w-40 md:h-56 bg-gradient-to-br from-ash-600 to-ash-800 rounded-full blur-sm opacity-60 -rotate-12" />
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-32 h-48 md:w-40 md:h-56 bg-gradient-to-bl from-ash-600 to-ash-800 rounded-full blur-sm opacity-40 rotate-12" />

          {/* Body */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-32 md:w-24 md:h-40 bg-gradient-to-b from-ash-700 to-ash-900 rounded-3xl" />

          {/* Energy dots */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const r = 100 + Math.random() * 50;
            return (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full animate-ash-pulse"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(${Math.cos(angle) * r}px, ${Math.sin(angle) * r}px)`,
                  backgroundColor: ['#FF496C', '#8B5CF6', '#22D3EE', '#C7F464', '#b8b8c8'][i % 5],
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

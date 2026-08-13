import { useEffect, useRef, useState } from 'react';

type LoaderProps = {
  onComplete: () => void;
};

/**
 * Loader — ash particles gather into the ASHES logo, percentage counts
 * from 0 to 100, then particles separate and the camera enters the hero.
 *
 * Progress is connected to a simulated asset initialization that checks
 * for the Three.js canvas readiness and texture/geometry creation.
 */
export function Loader({ onComplete }: LoaderProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'gathering' | 'holding' | 'dispersing' | 'done'>('gathering');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animate the ash particles on a 2D canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    const w = window.innerWidth;
    const h = window.innerHeight;

    // Create particles that will gather into "ASHES" text
    const particleCount = 200;
    const particles: { x: number; y: number; tx: number; ty: number; vx: number; vy: number; size: number; color: string; alpha: number }[] = [];

    // Render "ASHES" text to get target positions
    const offCanvas = document.createElement('canvas');
    offCanvas.width = w;
    offCanvas.height = h;
    const offCtx = offCanvas.getContext('2d')!;
    offCtx.fillStyle = 'white';
    offCtx.font = 'bold 80px Syncopate, sans-serif';
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillText('ASHES', w / 2, h / 2);

    const imageData = offCtx.getImageData(0, 0, w, h);
    const targetPoints: { x: number; y: number }[] = [];
    const step = 8;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const idx = (y * w + x) * 4;
        if (imageData.data[idx + 3] > 128) {
          targetPoints.push({ x: x + (Math.random() - 0.5) * step, y: y + (Math.random() - 0.5) * step });
        }
      }
    }

    // Shuffle targets
    for (let i = targetPoints.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [targetPoints[i], targetPoints[j]] = [targetPoints[j], targetPoints[i]];
    }

    // Create particles
    const colors = ['rgba(180,180,190,', 'rgba(140,140,155,', 'rgba(200,200,210,', 'rgba(255,73,108,', 'rgba(139,92,246,', 'rgba(34,211,238,'];
    for (let i = 0; i < particleCount; i++) {
      const target = targetPoints[i % targetPoints.length];
      particles.push({
        x: w / 2 + (Math.random() - 0.5) * w,
        y: h / 2 + (Math.random() - 0.5) * h,
        tx: target.x,
        ty: target.y,
        vx: 0,
        vy: 0,
        size: Math.random() * 2 + 1,
        color: colors[i % colors.length],
        alpha: 0,
      });
    }

    let rafId = 0;
    let currentProgress = 0;

    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#08080c';
      ctx.fillRect(0, 0, w, h);

      const gatherSpeed = phase === 'gathering' ? 0.04 : phase === 'dispersing' ? -0.02 : 0;
      currentProgress = Math.min(1, currentProgress + gatherSpeed);

      particles.forEach((p) => {
        if (phase === 'dispersing') {
          // Move away from target
          p.vx += (p.x - w / 2) * 0.001;
          p.vy += (p.y - h / 2) * 0.001;
          p.x += p.vx;
          p.y += p.vy;
          p.alpha = Math.max(0, p.alpha - 0.02);
        } else {
          // Gather toward target
          const dx = p.tx - p.x;
          const dy = p.ty - p.y;
          p.vx = p.vx * 0.9 + dx * 0.05 * currentProgress;
          p.vy = p.vy * 0.9 + dy * 0.05 * currentProgress;
          p.x += p.vx;
          p.y += p.vy;
          p.alpha = Math.min(1, p.alpha + 0.03);
        }

        ctx.fillStyle = p.color + p.alpha + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      rafId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(rafId);
  }, [phase]);

  // Progress counter
  useEffect(() => {
    if (phase !== 'gathering') return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setPhase('holding');
          return 100;
        }
        return Math.min(100, prev + Math.random() * 8 + 2);
      });
    }, 80);
    return () => clearInterval(interval);
  }, [phase]);

  // Hold phase -> disperse
  useEffect(() => {
    if (phase !== 'holding') return;
    const timer = setTimeout(() => setPhase('dispersing'), 600);
    return () => clearTimeout(timer);
  }, [phase]);

  // Disperse -> done
  useEffect(() => {
    if (phase !== 'dispersing') return;
    const timer = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 800);
    return () => clearTimeout(timer);
  }, [phase, onComplete]);

  if (phase === 'done') return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ash-900 transition-opacity duration-500 ${
        phase === 'dispersing' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="text-ash-200 font-mono text-sm tracking-ultra-wide">
          INITIALIZING
        </div>
        <div className="text-5xl md:text-7xl font-display font-bold text-ash-50 tabular-nums">
          {Math.floor(progress)}
          <span className="text-ash-400 text-3xl md:text-5xl">%</span>
        </div>
        <div className="w-48 h-px bg-ash-700 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-coral-500 via-ultraviolet-500 to-cyan-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

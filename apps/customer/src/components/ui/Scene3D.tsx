/**
 * Scene3D — animated 3D background for all apps.
 * Pure CSS/SVG — no canvas, no heavy libraries, no perf impact.
 * Renders floating orbs, a drifting grid, and particle dots.
 */

import { useEffect, useRef } from 'react';

interface Scene3DProps {
  variant?: 'default' | 'dashboard' | 'minimal';
}

export function Scene3D({ variant = 'default' }: Scene3DProps) {
  const orbRef = useRef<HTMLDivElement>(null);

  // Subtle mouse parallax on the orbs — pure CSS fallback if JS not ready
  useEffect(() => {
    if (variant === 'minimal') return;
    const el = orbRef.current;
    if (!el) return;

    let rafId: number;
    const handleMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth  - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(rafId);
    };
  }, [variant]);

  if (variant === 'minimal') return (
    <div className="fixed inset-0 pointer-events-none -z-10" aria-hidden>
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
    </div>
  );

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden>
      {/* Parallax orb layer */}
      <div ref={orbRef} className="absolute inset-0 transition-transform duration-700 ease-out will-change-transform">
        {/* Primary glow — top left */}
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle at 40% 40%, rgba(99,102,241,0.12) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        {/* Secondary glow — bottom right */}
        <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle at 60% 60%, rgba(59,130,246,0.09) 0%, transparent 65%)', filter: 'blur(60px)', animation: 'orbDrift2 16s ease-in-out infinite' }} />
        {/* Tertiary — center cyan accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'orbDrift3 20s ease-in-out infinite' }} />
      </div>

      {/* Floating 3D geometric shapes */}
      {variant === 'default' && (
        <div className="absolute inset-0">
          {/* Hexagon wireframe — top right */}
          <svg className="absolute top-20 right-10 w-32 h-32 opacity-[0.07]"
            style={{ animation: 'floatElement 8s ease-in-out infinite' }}
            viewBox="0 0 100 100" fill="none" stroke="#6366f1" strokeWidth="0.8">
            <polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" />
            <polygon points="50,20 75,32.5 75,67.5 50,80 25,67.5 25,32.5" />
            <line x1="50" y1="5" x2="50" y2="20" />
            <line x1="90" y1="27.5" x2="75" y2="32.5" />
            <line x1="90" y1="72.5" x2="75" y2="67.5" />
            <line x1="50" y1="95" x2="50" y2="80" />
            <line x1="10" y1="72.5" x2="25" y2="67.5" />
            <line x1="10" y1="27.5" x2="25" y2="32.5" />
          </svg>

          {/* Cube wireframe — bottom left */}
          <svg className="absolute bottom-32 left-16 w-24 h-24 opacity-[0.06]"
            style={{ animation: 'floatElement 11s ease-in-out infinite', animationDelay: '-4s' }}
            viewBox="0 0 100 100" fill="none" stroke="#06b6d4" strokeWidth="0.8">
            <rect x="20" y="35" width="45" height="45" />
            <rect x="35" y="20" width="45" height="45" />
            <line x1="20" y1="35" x2="35" y2="20" />
            <line x1="65" y1="35" x2="80" y2="20" />
            <line x1="65" y1="80" x2="80" y2="65" />
            <line x1="20" y1="80" x2="35" y2="65" />
          </svg>

          {/* Triangle — top left area */}
          <svg className="absolute top-1/3 left-8 w-16 h-16 opacity-[0.06]"
            style={{ animation: 'floatElement 14s ease-in-out infinite', animationDelay: '-7s' }}
            viewBox="0 0 100 100" fill="none" stroke="#8b5cf6" strokeWidth="0.8">
            <polygon points="50,10 90,80 10,80" />
            <polygon points="50,30 73,70 27,70" />
            <line x1="50" y1="10" x2="50" y2="30" />
            <line x1="90" y1="80" x2="73" y2="70" />
            <line x1="10" y1="80" x2="27" y2="70" />
          </svg>

          {/* Circle ring — center right */}
          <svg className="absolute top-1/2 right-20 w-20 h-20 opacity-[0.05]"
            style={{ animation: 'spinSlow 30s linear infinite' }}
            viewBox="0 0 100 100" fill="none" stroke="#6366f1" strokeWidth="0.8">
            <circle cx="50" cy="50" r="40" strokeDasharray="8 4" />
            <circle cx="50" cy="50" r="25" strokeDasharray="4 6" />
            <circle cx="50" cy="50" r="10" />
          </svg>

          {/* Floating code snippet panels */}
          <div className="absolute top-28 left-1/4 opacity-[0.04]"
            style={{ animation: 'floatElement 9s ease-in-out infinite', animationDelay: '-2s', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#6366f1', whiteSpace: 'pre', lineHeight: 1.6, transform: 'perspective(400px) rotateY(-8deg) rotateX(4deg)' }}>
{`const app = express()
app.use(cors({ origin: '*' }))
app.get('/health', (_, res) =>
  res.json({ status: 'ok' }))`}
          </div>

          <div className="absolute bottom-40 right-1/4 opacity-[0.04]"
            style={{ animation: 'floatElement 12s ease-in-out infinite', animationDelay: '-5s', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#06b6d4', whiteSpace: 'pre', lineHeight: 1.6, transform: 'perspective(400px) rotateY(6deg) rotateX(-3deg)' }}>
{`type Props = {
  data: Record<string, unknown>
  onUpdate: (v: string) => void
}`}
          </div>
        </div>
      )}

      {/* Dashboard variant — data visualization decorations */}
      {variant === 'dashboard' && (
        <div className="absolute inset-0">
          {/* Floating mini chart lines */}
          <svg className="absolute top-24 right-24 w-48 h-24 opacity-[0.06]"
            style={{ animation: 'floatElement 10s ease-in-out infinite' }}
            viewBox="0 0 200 80" fill="none">
            <polyline points="0,60 30,45 60,50 90,25 120,35 150,15 180,20 200,10"
              stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="0,70 30,65 60,68 90,50 120,55 150,40 180,45 200,35"
              stroke="#06b6d4" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          {/* Floating stat bubble */}
          <div className="absolute bottom-48 left-24 opacity-[0.05]"
            style={{ animation: 'floatElement 13s ease-in-out infinite', animationDelay: '-6s' }}>
            <div style={{ border: '1px solid rgba(99,102,241,0.5)', borderRadius: '12px', padding: '8px 14px', backdropFilter: 'blur(4px)' }}>
              <div style={{ fontSize: '18px', fontFamily: 'Syne', fontWeight: 700, color: '#6366f1' }}>↑ 24%</div>
              <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'Outfit' }}>Growth</div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes orbDrift2 {
          0%,100% { transform: translate(0,0); }
          50%      { transform: translate(-25px, 15px); }
        }
        @keyframes orbDrift3 {
          0%,100% { transform: translate(-50%,-50%) scale(1); }
          50%      { transform: translate(-50%,-50%) scale(1.1); }
        }
        @keyframes floatElement {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-14px); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

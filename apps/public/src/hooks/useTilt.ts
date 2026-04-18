/**
 * useTilt — adds a smooth 3D perspective tilt effect to a card element on hover.
 * Uses CSS transforms only. Respects prefers-reduced-motion.
 */
import { useEffect, useRef } from 'react';

interface TiltOptions {
  maxTilt?: number;    // max degrees of tilt (default 8)
  scale?:   number;    // hover scale (default 1.02)
  speed?:   number;    // transition speed ms (default 200)
  glare?:   boolean;   // show glare reflection (default true)
}

export function useTilt<T extends HTMLElement>(opts: TiltOptions = {}) {
  const ref = useRef<T>(null);
  const { maxTilt = 8, scale = 1.02, speed = 200, glare = true } = opts;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion preference
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    let glareEl: HTMLDivElement | null = null;
    if (glare) {
      glareEl = document.createElement('div');
      glareEl.style.cssText = `
        position:absolute; inset:0; border-radius:inherit; pointer-events:none;
        background: radial-gradient(circle at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 60%);
        opacity:0; transition:opacity ${speed}ms ease;
        z-index:1;
      `;
      el.style.position = el.style.position || 'relative';
      el.appendChild(glareEl);
    }

    const handleMove = (e: MouseEvent) => {
      const rect   = el.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) / (rect.width  / 2);
      const dy     = (e.clientY - cy) / (rect.height / 2);
      const rotX   = -dy * maxTilt;
      const rotY   =  dx * maxTilt;

      el.style.transition = `transform ${speed / 3}ms ease-out, box-shadow ${speed / 3}ms ease-out`;
      el.style.transform  = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`;

      if (glareEl) {
        const angle  = Math.atan2(dy, dx) * 180 / Math.PI;
        glareEl.style.background = `radial-gradient(circle at ${(dx + 1) * 50}% ${(dy + 1) * 50}%, rgba(255,255,255,0.08) 0%, transparent 60%)`;
        glareEl.style.opacity    = '1';
      }
    };

    const handleLeave = () => {
      el.style.transition = `transform ${speed}ms cubic-bezier(0.22,1,0.36,1), box-shadow ${speed}ms ease`;
      el.style.transform  = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
      if (glareEl) glareEl.style.opacity = '0';
    };

    el.addEventListener('mousemove',  handleMove);
    el.addEventListener('mouseleave', handleLeave);

    return () => {
      el.removeEventListener('mousemove',  handleMove);
      el.removeEventListener('mouseleave', handleLeave);
      if (glareEl && el.contains(glareEl)) el.removeChild(glareEl);
    };
  }, [maxTilt, scale, speed, glare]);

  return ref;
}

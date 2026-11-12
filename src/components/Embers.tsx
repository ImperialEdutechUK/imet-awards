'use client';

import { useEffect, useRef } from 'react';

type Ember = { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number; phase: number; tone: string };

/** Slow gold embers drifting upward, drawn on a canvas. Paused when off screen or when motion is reduced. */
export function Embers({ className, density = 1 }: { className?: string; density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tones = ['248,230,184', '226,184,102', '201,154,72', '192,40,75'];
    let w = 0, h = 0, raf = 0, last = 0, visible = true;
    let embers: Ember[] = [];

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const make = (anywhere: boolean): Ember => ({
      x: Math.random() * w, y: anywhere ? Math.random() * h : h + 8,
      vx: (Math.random() - 0.5) * 12, vy: -(8 + Math.random() * 24),
      r: 0.6 + Math.random() * 2, life: anywhere ? Math.random() * 6 : 0, max: 9 + Math.random() * 10,
      phase: Math.random() * 6.28, tone: tones[Math.random() < 0.12 ? 3 : (Math.random() * 3) | 0],
    });
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
      const target = Math.max(16, Math.min(70, Math.round((w * h) / 22000 * density)));
      ctx.clearRect(0, 0, w, h);
      for (let i = embers.length - 1; i >= 0; i--) {
        const p = embers[i];
        p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt;
        const t = p.life / p.max;
        if (t >= 1 || p.y < -12) { embers.splice(i, 1); continue; }
        const alpha = Math.sin(Math.PI * t) * (0.5 + 0.4 * Math.sin(p.phase + p.life * 2.1));
        if (alpha <= 0.01) continue;
        ctx.fillStyle = `rgba(${p.tone},${(alpha * 0.16).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.8, 0, 6.2832); ctx.fill();
        ctx.fillStyle = `rgba(${p.tone},${alpha.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
      while (embers.length < target) embers.push(make(false));
    };

    size();
    embers = Array.from({ length: 30 }, () => make(true));
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    observer.observe(canvas);
    window.addEventListener('resize', size);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); window.removeEventListener('resize', size); };
  }, [density]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { event } from '@/lib/event';
import s from './curtain.module.css';

/** True once the curtain has parted enough for the page behind it to start its own entrance. */
const IntroContext = createContext(true);
export const useIntroRevealed = () => useContext(IntroContext);

const KEY = 'imet-curtain';
type Stage = 'pending' | 'closed' | 'opening' | 'gone';

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeIn = (t: number) => t * t * t;

// Timeline in seconds after the click.
const OPEN_FROM = 0.3, OPEN_FOR = 2.9, REVEAL_AT = 1.25, EXIT_FROM = 2.95, EXIT_FOR = 1.15, DONE_AT = 4.2;

/**
 * The opening curtain. The velvet is drawn on a canvas column by column: each column's shade
 * follows a fold pattern fixed to the cloth, so as the panels are drawn aside the folds bunch
 * together the way a real stage curtain gathers.
 */
export function CurtainIntro({ children }: { children: ReactNode }) {
  const enabled = event.curtain.enabled;
  const [stage, setStage] = useState<Stage>(enabled ? 'pending' : 'gone');
  const [revealed, setRevealed] = useState(!enabled);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const openedAt = useRef(0);

  // Decide once, in the browser, whether this visitor sees the curtain.
  useEffect(() => {
    if (!enabled) return;
    let seen = false;
    try { seen = event.curtain.oncePerSession && window.sessionStorage.getItem(KEY) === '1'; } catch { /* storage unavailable */ }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (seen || reducedMotion) { setStage('gone'); setRevealed(true); } else { setStage('closed'); }
  }, [enabled]);

  // Tell the page which state the curtain is in (used for scroll lock and paused entrances).
  useEffect(() => {
    if (stage === 'pending') return;
    document.documentElement.dataset.curtain = stage === 'gone' ? 'open' : stage;
  }, [stage]);

  const active = stage === 'closed' || stage === 'opening';
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Velvet shades from the valley of a fold (near black) to its ridge and sheen, matched to the wall's burgundy.
    const palette = Array.from({ length: 256 }, (_, i) => {
      const c = i / 255, ridge = Math.pow(c, 2.0), sheen = Math.pow(c, 20);
      return `rgb(${Math.round(13 + ridge * 84 + sheen * 46)},${Math.round(2 + ridge * 15 + sheen * 12)},${Math.round(3 + ridge * 17 + sheen * 13)})`;
    });

    let W = 0, H = 0, dpr = 1, raf = 0;
    let shade: CanvasGradient, spot: CanvasGradient;
    let didReveal = false, finished = false;

    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = canvas.width = Math.max(2, Math.round(canvas.clientWidth * dpr));
      H = canvas.height = Math.max(2, Math.round(canvas.clientHeight * dpr));
      shade = ctx.createLinearGradient(0, 0, 0, H);
      shade.addColorStop(0, 'rgba(5,2,3,0.78)'); shade.addColorStop(0.26, 'rgba(5,2,3,0)');
      shade.addColorStop(0.72, 'rgba(5,2,3,0)'); shade.addColorStop(1, 'rgba(5,2,3,0.6)');
      const r = Math.max(W, H) * 0.62;
      spot = ctx.createRadialGradient(W / 2, H * 0.5, 0, W / 2, H * 0.5, r);
      spot.addColorStop(0, 'rgba(234,215,168,0.08)'); spot.addColorStop(0.45, 'rgba(200,164,93,0.02)');
      spot.addColorStop(0.7, 'rgba(5,2,3,0.25)'); spot.addColorStop(1, 'rgba(5,2,3,0.7)');
    };

    const draw = (open: number, exit: number, t: number, stir: number) => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      const half = W / 2, gathered = 0.2, step = 2;
      const panel = half * (1 - open * (1 - gathered)) + (open < 0.01 ? 2 * dpr : 0);
      const out = exit * (panel + 40 * dpr);
      const folds = clamp(Math.round(half / dpr / 66), 5, 15);
      const sway = 0.16 + stir * 0.9 + open * (1 - open) * 1.7;
      for (let side = 0; side < 2; side++) {
        const seed = side ? 2.1 : 0.4;
        for (let px = 0; px < panel; px += step) {
          const u = px / panel; // 0 at the wing, 1 at the leading edge
          const phase = u * folds * 6.2832 + 0.75 * Math.sin(u * folds * 2.31 + seed * 3) + sway * Math.sin(t * 1.25 + u * 4.2 + seed);
          let c = 0.5 + 0.5 * Math.cos(phase);
          c *= 0.74 + 0.26 * Math.sin(u * folds * 0.83 + seed * 5); // some folds sit deeper than others
          if (u > 0.94) c *= 1 - ((u - 0.94) / 0.06) * 0.55; // the turned hem on the leading edge
          ctx.fillStyle = palette[(c * 255) | 0];
          ctx.fillRect(side ? W + out - px - step : px - out, 0, step + 0.6, H);
        }
      }
      // Stage lighting, applied only where there is cloth.
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 0.86 + 0.14 * Math.sin(t * 0.8);
      ctx.fillStyle = spot; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      // The curtains cast a soft shadow into the opening.
      if (open > 0 && exit < 1) {
        ctx.globalCompositeOperation = 'destination-over';
        const depth = 90 * dpr, left = panel - out, right = W + out - panel;
        const a = ctx.createLinearGradient(left, 0, left + depth, 0);
        a.addColorStop(0, 'rgba(5,2,3,0.6)'); a.addColorStop(1, 'rgba(5,2,3,0)');
        ctx.fillStyle = a; ctx.fillRect(left, 0, depth, H);
        const b = ctx.createLinearGradient(right, 0, right - depth, 0);
        b.addColorStop(0, 'rgba(5,2,3,0.6)'); b.addColorStop(1, 'rgba(5,2,3,0)');
        ctx.fillStyle = b; ctx.fillRect(right - depth, 0, depth, H);
      }
    };

    const frame = (now: number) => {
      const t = now / 1000;
      const since = openedAt.current ? (now - openedAt.current) / 1000 : -1;
      if (since < 0) {
        draw(0, 0, t, 0);
      } else {
        const open = easeInOut(clamp((since - OPEN_FROM) / OPEN_FOR));
        const exit = easeIn(clamp((since - EXIT_FROM) / EXIT_FOR));
        const stir = since < 0.7 ? Math.sin((Math.PI * since) / 0.7) : 0; // a ripple as the ropes take the weight
        draw(open, exit, t, stir);
        if (!didReveal && since >= REVEAL_AT) { didReveal = true; setRevealed(true); }
        if (!finished && since >= DONE_AT) {
          finished = true;
          if (event.curtain.oncePerSession) { try { window.sessionStorage.setItem(KEY, '1'); } catch { /* storage unavailable */ } }
          setStage('gone');
          return;
        }
      }
      raf = requestAnimationFrame(frame);
    };

    size();
    window.addEventListener('resize', size);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); };
  }, [active]);

  const open = () => {
    if (stage !== 'closed') return;
    openedAt.current = performance.now();
    setStage('opening');
  };

  return (
    <IntroContext.Provider value={revealed}>
      <div inert={active}>{children}</div>
      {stage !== 'gone' && (
        <button
          type="button"
          data-intro-curtain=""
          className={`${s.curtain} ${active ? s.live : ''} ${stage === 'opening' ? s.opening : ''}`}
          onClick={open}
          aria-label={`${event.curtain.hint} to enter the ${event.name} website`}
        >
          <canvas ref={canvasRef} className={s.canvas} aria-hidden="true" />
          <span className={s.emblem} aria-hidden="true">
            <span className={s.name}>
              <small>{event.organisation} presents</small>
              {event.title.top} {event.title.main}
              <br />
              {event.title.sub} {event.title.year}
            </span>
            <span className={s.hint}>{event.curtain.hint}</span>
          </span>
        </button>
      )}
    </IntroContext.Provider>
  );
}

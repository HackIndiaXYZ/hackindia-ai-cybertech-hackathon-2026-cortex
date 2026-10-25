/**
 * HeroSkyCanvas
 * ------------------------------------------------------------------
 * Animated sky canvas: sun travels an arc from sunrise to sunset
 * over a 20-second loop, smoothly changing the sky gradient.
 * Pauses when tab is hidden. Reduced-motion: static gradient fallback.
 * ------------------------------------------------------------------
 */
import { useEffect, useRef } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface HeroSkyCanvasProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function HeroSkyCanvas({ className, style }: HeroSkyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef(0);
  const tRef      = useRef(0);
  const pausedRef = useRef(false);
  const reduced   = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    type SkyStop = { top: string; mid: string; bot: string; sunCol: string; glowAlpha: number; glowR: number; glowG: number; glowB: number };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const lerpC = (a: [number,number,number], b: [number,number,number], t: number): [number,number,number] =>
      [Math.round(lerp(a[0],b[0],t)), Math.round(lerp(a[1],b[1],t)), Math.round(lerp(a[2],b[2],t))];
    const hex = (h: string): [number,number,number] => {
      const s = h.replace("#","");
      return [parseInt(s.slice(0,2),16), parseInt(s.slice(2,4),16), parseInt(s.slice(4,6),16)];
    };
    const rgb = (c: [number,number,number]) => `rgb(${c[0]},${c[1]},${c[2]})`;

    // Key sky states at normalized time t in [0,1]
    type Key = { t: number; top: [number,number,number]; mid: [number,number,number]; bot: [number,number,number]; sunCol: [number,number,number]; glowA: number; glowR: number; glowG: number; glowB: number };
    const KEYS: Key[] = [
      { t: 0.00, top: hex("#070B1A"), mid: hex("#1A2A60"), bot: hex("#F4A261"), sunCol: hex("#FF9F43"), glowA: 0.55, glowR:255, glowG:140, glowB:60  },
      { t: 0.12, top: hex("#1E407A"), mid: hex("#F4A261"), bot: hex("#FDF3E3"), sunCol: hex("#FFD060"), glowA: 0.45, glowR:255, glowG:190, glowB:100 },
      { t: 0.30, top: hex("#2563A8"), mid: hex("#7EC8F4"), bot: hex("#D9EDFF"), sunCol: hex("#FFF5A0"), glowA: 0.30, glowR:255, glowG:240, glowB:180 },
      { t: 0.50, top: hex("#1D55B0"), mid: hex("#60AFEC"), bot: hex("#C8E6FF"), sunCol: hex("#FFFFEE"), glowA: 0.22, glowR:255, glowG:255, glowB:220 },
      { t: 0.68, top: hex("#2563A8"), mid: hex("#7EC8F4"), bot: hex("#D9EDFF"), sunCol: hex("#FFF5A0"), glowA: 0.30, glowR:255, glowG:240, glowB:180 },
      { t: 0.82, top: hex("#8B3A14"), mid: hex("#F97316"), bot: hex("#FDE68A"), sunCol: hex("#FF9F43"), glowA: 0.50, glowR:255, glowG:120, glowB:40  },
      { t: 0.93, top: hex("#1A1040"), mid: hex("#4B2070"), bot: hex("#F4A261"), sunCol: hex("#FF6B35"), glowA: 0.45, glowR:255, glowG:80,  glowB:30  },
      { t: 1.00, top: hex("#070B1A"), mid: hex("#1A2A60"), bot: hex("#F4A261"), sunCol: hex("#FF9F43"), glowA: 0.55, glowR:255, glowG:140, glowB:60  },
    ];

    const getSky = (T: number): SkyStop => {
      let i = 0;
      while (i < KEYS.length - 2 && KEYS[i+1].t <= T) i++;
      const a = KEYS[i], b = KEYS[i+1];
      const p = (T - a.t) / (b.t - a.t);
      return {
        top:      rgb(lerpC(a.top, b.top, p)),
        mid:      rgb(lerpC(a.mid, b.mid, p)),
        bot:      rgb(lerpC(a.bot, b.bot, p)),
        sunCol:   rgb(lerpC(a.sunCol, b.sunCol, p)),
        glowAlpha: lerp(a.glowA, b.glowA, p),
        glowR:    Math.round(lerp(a.glowR, b.glowR, p)),
        glowG:    Math.round(lerp(a.glowG, b.glowG, p)),
        glowB:    Math.round(lerp(a.glowB, b.glowB, p)),
      };
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onVis = () => { pausedRef.current = document.hidden; };
    document.addEventListener("visibilitychange", onVis);

    const PERIOD = 20; // seconds per loop

    const draw = (dt: number) => {
      if (pausedRef.current) return;
      tRef.current = (tRef.current + dt / PERIOD) % 1;
      const T = tRef.current;

      const dpr = window.devicePixelRatio || 1;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      const sky = getSky(T);

      ctx.save();
      ctx.scale(dpr, dpr);

      // Sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0,    sky.top);
      grad.addColorStop(0.55, sky.mid);
      grad.addColorStop(1,    sky.bot);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Sun arc: parabola from left ? apex ? right
      const margin = W * 0.06;
      const sunX = margin + (W - 2 * margin) * T;
      const arcH = H * 0.80;
      const baseY = H * 0.92;
      const sunY = baseY - arcH * 4 * T * (1 - T);

      // Only draw when above visible horizon
      const aboveHorizon = T > 0.02 && T < 0.98;
      if (aboveHorizon) {
        const noonProximity = 1 - Math.abs(T - 0.5) * 2;  // 0 at edges, 1 at noon
        const sunR = 18 + 10 * noonProximity;
        const glowSize = sunR * 5.5;

        // Glow layers
        for (let i = 3; i >= 1; i--) {
          const gr = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, glowSize * (i / 3));
          gr.addColorStop(0,   `rgba(${sky.glowR},${sky.glowG},${sky.glowB},${sky.glowAlpha / i})`);
          gr.addColorStop(1,   "rgba(0,0,0,0)");
          ctx.fillStyle = gr;
          ctx.beginPath();
          ctx.arc(sunX, sunY, glowSize * (i / 3), 0, Math.PI * 2);
          ctx.fill();
        }

        // Sun disc
        const disc = ctx.createRadialGradient(sunX - sunR*0.2, sunY - sunR*0.2, 0, sunX, sunY, sunR);
        disc.addColorStop(0,   "#FFFFFF");
        disc.addColorStop(0.4, sky.sunCol);
        disc.addColorStop(1,   `rgba(${sky.glowR},${sky.glowG},${sky.glowB},0.85)`);
        ctx.fillStyle = disc;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Horizon glow
      const hGrad = ctx.createLinearGradient(0, H * 0.78, 0, H);
      hGrad.addColorStop(0, `rgba(${sky.glowR},${sky.glowG},${sky.glowB},0)`);
      hGrad.addColorStop(1, `rgba(${sky.glowR},${sky.glowG},${sky.glowB},0.12)`);
      ctx.fillStyle = hGrad;
      ctx.fillRect(0, H * 0.78, W, H * 0.22);

      // Stars at night edges
      const nightness = T < 0.1 ? (0.1 - T) / 0.1 : T > 0.9 ? (T - 0.9) / 0.1 : 0;
      if (nightness > 0) {
        ctx.globalAlpha = nightness * 0.9;
        for (let i = 0; i < 45; i++) {
          const sx = ((i * 137.508) % 1) * W;
          const sy = ((i * 97.311)  % 1) * H * 0.65;
          const sr = 0.5 + (i % 3) * 0.4;
          const blink = 0.6 + 0.4 * Math.sin(Date.now() * 0.001 + i * 2.3);
          ctx.fillStyle = `rgba(255,255,255,${blink})`;
          ctx.beginPath();
          ctx.arc(sx, sy, sr, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    };

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1); // cap delta at 100ms
      last = now;
      draw(dt);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  if (reduced) {
    return (
      <div
        className={className}
        aria-hidden="true"
        style={{
          background: "linear-gradient(180deg, #1D55B0 0%, #60AFEC 55%, #C8E6FF 100%)",
          ...style,
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ width: "100%", height: "100%", display: "block", ...style }}
    />
  );
}

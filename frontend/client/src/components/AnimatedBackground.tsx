/**
 * AnimatedBackground
 * ------------------------------------------------------------------
 * Zone-aware canvas particle system that sits behind the whole app.
 *
 * Constraints (from spec):
 *  - Max 60 particles per zone
 *  - Pauses when tab is hidden (visibilitychange API)
 *  - Completely disabled (static bg div) when prefers-reduced-motion
 *  - Lightweight canvas only — no heavy libraries
 *
 * Zone effects:
 *  HOT_DRY    — slow heat-shimmer waves + glowing pulsing sun
 *  WARM_HUMID — gentle falling rain streaks + floating mist circles
 *  COMPOSITE  — slow drifting warm gradient + faint dust particles
 *  TEMPERATE  — floating leaf shapes + soft drifting clouds
 *  COLD       — slow falling snowflakes with glowing halos
 *  NEUTRAL    — subtle slow-moving gradient (no particles)
 * ------------------------------------------------------------------
 */
import { useEffect, useRef, useCallback } from "react";
import { useClimateZone } from "../theme/ClimateThemeProvider";
import type { ZoneOrNeutral } from "../types";

/* ------------------------------------------------------------------ */
/*  Particle definition                                                   */
/* ------------------------------------------------------------------ */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  rotation: number;
  vr: number;      // rotation speed (rad/frame)
  phase: number;   // wave / sine offset
  life: number;    // 0-1; respawn when <= 0
  decay: number;   // life reduction per frame (0 = immortal)
  len?: number;    // for rain streaks: streak length
  w?: number;      // for dust: ellipse width
}

/* ------------------------------------------------------------------ */
/*  Zone config interface                                                 */
/* ------------------------------------------------------------------ */
interface ZoneConfig {
  /** Total particle count. Must be <= 60. */
  count: number;
  /** Returns the background gradient or solid colour for this frame. */
  bgGradient: (ctx: CanvasRenderingContext2D, w: number, h: number) => CanvasGradient | string;
  /** Spawn a brand-new particle (position may be randomised below). */
  spawn: (w: number, h: number) => Particle;
  /** Mutate particle state each frame. */
  update: (p: Particle, w: number, h: number, t: number) => void;
  /** Paint the particle onto the canvas. */
  draw: (ctx: CanvasRenderingContext2D, p: Particle, t: number) => void;
  /** Optional extra canvas effects drawn before particles (sun, clouds…). */
  extra?: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                               */
/* ------------------------------------------------------------------ */
const rnd = (min: number, max: number) => min + Math.random() * (max - min);

/* ------------------------------------------------------------------ */
/*  Zone configurations                                                   */
/* ------------------------------------------------------------------ */
const CONFIGS: Record<ZoneOrNeutral, ZoneConfig> = {

  /* ----------------------------------------------------------------
     NEUTRAL — soft neutral gradient, no particles
     ---------------------------------------------------------------- */
  NEUTRAL: {
    count: 0,
    bgGradient: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w * 0.3, h);
      g.addColorStop(0, "#F2F4F3");
      g.addColorStop(0.6, "#E8EDEC");
      g.addColorStop(1, "#DDE5E3");
      return g;
    },
    spawn:  (w, h) => ({ x: rnd(0, w), y: rnd(0, h), vx: 0, vy: 0, radius: 2, alpha: 0, rotation: 0, vr: 0, phase: 0, life: 1, decay: 0 }),
    update: () => undefined,
    draw:   () => undefined,
    extra:  (ctx, w, h, t) => {
      // Subtle slow drifting highlight
      const ox = Math.sin(t * 0.08) * w * 0.1;
      const oy = Math.cos(t * 0.06) * h * 0.08;
      const grd = ctx.createRadialGradient(w * 0.5 + ox, h * 0.35 + oy, 0, w * 0.5 + ox, h * 0.35 + oy, w * 0.5);
      grd.addColorStop(0,   "rgba(15, 118, 110, 0.04)");
      grd.addColorStop(0.7, "rgba(56, 189, 248, 0.02)");
      grd.addColorStop(1,   "rgba(15, 118, 110, 0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
    },
  },

  /* ----------------------------------------------------------------
     HOT_DRY — heat shimmer waves + glowing pulsing sun
     ---------------------------------------------------------------- */
  HOT_DRY: {
    count: 18,   // shimmer wave bands
    bgGradient: (ctx, w, h) => {
      const g = ctx.createRadialGradient(w * 0.5, h * 0.25, 0, w * 0.5, h * 0.25, h * 1.4);
      g.addColorStop(0,   "#F7C96E");   // warm bright centre
      g.addColorStop(0.4, "#F4D9A8");   // sand mid
      g.addColorStop(0.8, "#EDCA80");
      g.addColorStop(1,   "#D4A85A");   // dusty horizon
      return g;
    },
    spawn: (w, h) => ({
      x:        rnd(0, w),
      y:        rnd(h * 0.35, h * 0.9),
      vx:       0,
      vy:       rnd(-0.18, -0.06),     // drift upward
      radius:   rnd(0.8, 2.5),
      alpha:    rnd(0.06, 0.16),
      rotation: 0,
      vr:       0,
      phase:    rnd(0, Math.PI * 2),
      life:     rnd(0.4, 1),
      decay:    rnd(0.0006, 0.0018),
    }),
    update: (p, w, h) => {
      p.y += p.vy;
      p.x += Math.sin(p.phase) * 0.45;
      p.phase += 0.014;
      p.life -= p.decay;
      if (p.life <= 0) {
        p.x = rnd(0, w);
        p.y = rnd(h * 0.4, h * 0.95);
        p.life = rnd(0.6, 1);
        p.alpha = rnd(0.06, 0.16);
        p.phase = rnd(0, Math.PI * 2);
      }
    },
    draw: (ctx, p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha * p.life;
      // Horizontal shimmer band — ellipse with soft gradient
      const grd = ctx.createLinearGradient(p.x - 70, p.y, p.x + 70, p.y);
      grd.addColorStop(0,   "rgba(255, 210, 80, 0)");
      grd.addColorStop(0.3, "rgba(255, 210, 80, 0.5)");
      grd.addColorStop(0.5, "rgba(255, 230, 120, 0.7)");
      grd.addColorStop(0.7, "rgba(255, 210, 80, 0.5)");
      grd.addColorStop(1,   "rgba(255, 210, 80, 0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 70, 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
    extra: (ctx, w, _h, t) => {
      const sx = w * 0.82;
      const sy = 72;
      const pulse = 1 + 0.06 * Math.sin(t * 0.9);

      // Layered outer glow halos
      for (let i = 5; i >= 1; i--) {
        const radius = 58 * i * pulse;
        const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
        grd.addColorStop(0,   `rgba(255, 195, 40, ${0.045 / i})`);
        grd.addColorStop(0.6, `rgba(255, 150, 0,  ${0.02 / i})`);
        grd.addColorStop(1,   "rgba(255, 150, 0, 0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sun disc with bright core
      const disc = ctx.createRadialGradient(sx - 4, sy - 4, 0, sx, sy, 38 * pulse);
      disc.addColorStop(0,   "#FFFDE0");
      disc.addColorStop(0.3, "#FFE066");
      disc.addColorStop(0.7, "#FFB830");
      disc.addColorStop(1,   "rgba(255, 140, 20, 0.7)");
      ctx.fillStyle = disc;
      ctx.beginPath();
      ctx.arc(sx, sy, 38 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Sun shimmer ring
      ctx.save();
      ctx.globalAlpha = 0.12 * (0.5 + 0.5 * Math.sin(t * 2));
      ctx.strokeStyle = "rgba(255, 230, 80, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 48 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Horizon heat haze band
      const haze = ctx.createLinearGradient(0, _h * 0.65, 0, _h * 0.75);
      haze.addColorStop(0, "rgba(255, 220, 100, 0)");
      haze.addColorStop(0.5, `rgba(255, 220, 100, ${0.04 + 0.02 * Math.sin(t * 0.7)})`);
      haze.addColorStop(1, "rgba(255, 220, 100, 0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, _h * 0.65, w, _h * 0.12);
    },
  },

  /* ----------------------------------------------------------------
     WARM_HUMID — falling rain streaks + floating mist
     ---------------------------------------------------------------- */
  WARM_HUMID: {
    count: 55,   // rain streaks (=60)
    bgGradient: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w * 0.15, h);
      g.addColorStop(0,   "#051F1E");
      g.addColorStop(0.4, "#062C2B");
      g.addColorStop(0.8, "#073430");
      g.addColorStop(1,   "#051F1E");
      return g;
    },
    spawn: (w, h) => ({
      x:        rnd(0, w),
      y:        rnd(-120, h * 0.5),
      vx:       rnd(-0.3, 0.1),
      vy:       rnd(4, 9),           // fast-ish rain
      radius:   rnd(0.5, 1.2),
      alpha:    rnd(0.25, 0.55),
      rotation: 0,
      vr:       0,
      phase:    rnd(0, Math.PI * 2),
      life:     1,
      decay:    0,
      len:      rnd(8, 22),          // streak length
    }),
    update: (p, w, h) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > h + 30) {
        p.x = rnd(0, w);
        p.y = rnd(-60, -5);
        p.alpha = rnd(0.25, 0.55);
        p.vy   = rnd(4, 9);
        p.len  = rnd(8, 22);
      }
    },
    draw: (ctx, p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.strokeStyle = `rgba(100, 210, 220, ${p.alpha})`;
      ctx.lineWidth = p.radius;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx * 1.5, p.y - (p.len ?? 14));
      ctx.stroke();
      ctx.restore();
    },
    extra: (ctx, w, h, t) => {
      // Floating mist circles
      const mistPositions = [
        { cx: w * 0.2,  cy: h * 0.55, r: w * 0.22 },
        { cx: w * 0.75, cy: h * 0.65, r: w * 0.18 },
        { cx: w * 0.5,  cy: h * 0.8,  r: w * 0.25 },
        { cx: w * 0.1,  cy: h * 0.85, r: w * 0.14 },
        { cx: w * 0.9,  cy: h * 0.45, r: w * 0.16 },
      ];

      mistPositions.forEach(({ cx, cy, r }, i) => {
        const drift = Math.sin(t * 0.05 + i * 1.3) * 18;
        const alpha = 0.06 + 0.025 * Math.sin(t * 0.08 + i * 0.9);
        const grd = ctx.createRadialGradient(cx + drift, cy, 0, cx + drift, cy, r);
        grd.addColorStop(0,   `rgba(56, 200, 200, ${alpha})`);
        grd.addColorStop(0.5, `rgba(15, 118, 110, ${alpha * 0.4})`);
        grd.addColorStop(1,   "rgba(6, 44, 43, 0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.ellipse(cx + drift, cy, r, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Lagoon light reflection at top (like moonlight on water)
      const refGrd = ctx.createLinearGradient(0, 0, 0, h * 0.28);
      refGrd.addColorStop(0,   "rgba(56, 189, 248, 0.06)");
      refGrd.addColorStop(1,   "rgba(56, 189, 248, 0)");
      ctx.fillStyle = refGrd;
      ctx.fillRect(0, 0, w, h * 0.28);
    },
  },

  /* ----------------------------------------------------------------
     COMPOSITE — slow drifting warm gradient + dust particles
     ---------------------------------------------------------------- */
  COMPOSITE: {
    count: 35,   // dust motes
    bgGradient: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0,   "#2A3445");
      g.addColorStop(0.5, "#334155");
      g.addColorStop(1,   "#293040");
      return g;
    },
    spawn: (w, h) => ({
      x:        rnd(0, w),
      y:        rnd(0, h),
      vx:       rnd(-0.12, 0.12),
      vy:       rnd(-0.08, 0.08),
      radius:   rnd(1, 3.5),
      alpha:    rnd(0.05, 0.18),
      rotation: rnd(0, Math.PI * 2),
      vr:       rnd(-0.003, 0.003),
      phase:    rnd(0, Math.PI * 2),
      life:     rnd(0.5, 1),
      decay:    rnd(0.0003, 0.0008),
      w:        rnd(2, 5),            // ellipse width
    }),
    update: (p, w, h) => {
      p.x += p.vx + Math.sin(p.phase) * 0.15;
      p.y += p.vy + Math.cos(p.phase * 0.7) * 0.1;
      p.phase += 0.008;
      p.life -= p.decay;
      if (p.life <= 0 || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
        p.x = rnd(0, w);
        p.y = rnd(0, h);
        p.life = rnd(0.6, 1);
        p.alpha = rnd(0.05, 0.18);
        p.phase = rnd(0, Math.PI * 2);
      }
    },
    draw: (ctx, p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha * p.life;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius * 2);
      grd.addColorStop(0,   `rgba(245, 158, 11, ${p.alpha * 1.5})`);
      grd.addColorStop(0.5, `rgba(132, 169, 140, ${p.alpha * 0.6})`);
      grd.addColorStop(1,   "rgba(245, 158, 11, 0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.radius * 2, p.radius, p.rotation, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
    extra: (ctx, w, h, t) => {
      // Primary warm amber gradient blob — drifts slowly
      const ox1 = Math.sin(t * 0.12) * w * 0.14;
      const oy1 = Math.cos(t * 0.09) * h * 0.10;
      const g1 = ctx.createRadialGradient(w * 0.35 + ox1, h * 0.42 + oy1, 0, w * 0.35 + ox1, h * 0.42 + oy1, w * 0.55);
      g1.addColorStop(0,   "rgba(245, 158, 11, 0.09)");
      g1.addColorStop(0.5, "rgba(245, 158, 11, 0.04)");
      g1.addColorStop(1,   "rgba(245, 158, 11, 0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      // Secondary sage gradient blob — slower drift, opposite phase
      const ox2 = Math.cos(t * 0.08) * w * 0.12;
      const oy2 = Math.sin(t * 0.07) * h * 0.12;
      const g2 = ctx.createRadialGradient(w * 0.7 + ox2, h * 0.6 + oy2, 0, w * 0.7 + ox2, h * 0.6 + oy2, w * 0.45);
      g2.addColorStop(0,   "rgba(132, 169, 140, 0.07)");
      g2.addColorStop(0.6, "rgba(132, 169, 140, 0.03)");
      g2.addColorStop(1,   "rgba(132, 169, 140, 0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      // Horizon amber glow
      const horizon = ctx.createLinearGradient(0, h * 0.55, 0, h * 0.72);
      horizon.addColorStop(0, "rgba(245, 158, 11, 0)");
      horizon.addColorStop(0.5, `rgba(245, 158, 11, ${0.035 + 0.015 * Math.sin(t * 0.5)})`);
      horizon.addColorStop(1, "rgba(245, 158, 11, 0)");
      ctx.fillStyle = horizon;
      ctx.fillRect(0, h * 0.55, w, h * 0.18);
    },
  },

  /* ----------------------------------------------------------------
     TEMPERATE — floating leaves + drifting clouds
     ---------------------------------------------------------------- */
  TEMPERATE: {
    count: 28,   // leaves
    bgGradient: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w * 0.2, h);
      g.addColorStop(0,   "#D8EFC0");
      g.addColorStop(0.5, "#EEF5D8");
      g.addColorStop(1,   "#F7F5EC");
      return g;
    },
    spawn: (w, _h) => ({
      x:        rnd(-40, w + 40),
      y:        rnd(-60, -5),
      vx:       rnd(-0.7, -0.15),    // drift left (breeze)
      vy:       rnd(0.45, 1.4),
      radius:   rnd(5, 16),
      alpha:    rnd(0.3, 0.75),
      rotation: rnd(0, Math.PI * 2),
      vr:       rnd(-0.018, 0.018),
      phase:    rnd(0, Math.PI * 2),
      life:     1,
      decay:    0,
    }),
    update: (p, w, h) => {
      p.x += p.vx + Math.sin(p.phase) * 0.35;
      p.y += p.vy;
      p.rotation += p.vr;
      p.phase += 0.01;
      // Respawn when off screen
      if (p.y > h + 50 || p.x < -80) {
        p.x = rnd(w * 0.3, w + 40);
        p.y = rnd(-60, -5);
        p.rotation = rnd(0, Math.PI * 2);
        p.alpha = rnd(0.3, 0.75);
        p.vx = rnd(-0.7, -0.15);
        p.vy = rnd(0.45, 1.4);
      }
    },
    draw: (ctx, p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      const r = p.radius;
      // Pick leaf colour based on alpha (variety of autumn/spring greens)
      const colours = [
        "rgba(34,  197, 94,  0.70)",
        "rgba(134, 196, 80,  0.65)",
        "rgba(201, 204, 80,  0.60)",
        "rgba(162, 196, 100, 0.60)",
        "rgba(80,  160, 70,  0.70)",
      ];
      const col = colours[Math.floor(p.phase * 5) % colours.length];
      ctx.fillStyle = col;

      // Almond leaf shape
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(r * 0.85,  0,  0,  r);
      ctx.quadraticCurveTo(-r * 0.85, 0,  0, -r);
      ctx.fill();

      // Leaf vein (centre line)
      ctx.strokeStyle = "rgba(20, 80, 30, 0.20)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(0, r);
      ctx.stroke();

      ctx.restore();
    },
    extra: (ctx, w, _h, t) => {
      // Soft cloud puffs drifting slowly
      const clouds = [
        { cx: w * 0.12, cy: 65,  r: 60,  speed: 0.04, amp: 22 },
        { cx: w * 0.55, cy: 88,  r: 80,  speed: 0.03, amp: 28 },
        { cx: w * 0.88, cy: 50,  r: 50,  speed: 0.05, amp: 18 },
        { cx: w * 0.35, cy: 110, r: 45,  speed: 0.035, amp: 20 },
      ];
      clouds.forEach(({ cx, cy, r, speed, amp }, i) => {
        const drift = Math.sin(t * speed + i * 1.2) * amp;
        const puffAlpha = 0.28 + 0.08 * Math.sin(t * 0.06 + i);
        // Multi-bubble cloud
        const centres = [
          { ox: 0,   oy: 0,   rr: r },
          { ox: r * 0.7, oy: r * 0.25, rr: r * 0.65 },
          { ox: -r * 0.65, oy: r * 0.2, rr: r * 0.55 },
        ];
        centres.forEach(({ ox, oy, rr }) => {
          const x = cx + drift + ox;
          const y = cy + oy;
          const grd = ctx.createRadialGradient(x, y - rr * 0.15, 0, x, y, rr);
          grd.addColorStop(0,   `rgba(255, 255, 255, ${puffAlpha})`);
          grd.addColorStop(0.6, `rgba(240, 248, 230, ${puffAlpha * 0.5})`);
          grd.addColorStop(1,   "rgba(240, 248, 230, 0)");
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(x, y, rr, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      // Sky gradient at top
      const sky = ctx.createLinearGradient(0, 0, 0, _h * 0.25);
      sky.addColorStop(0, "rgba(125, 211, 252, 0.18)");
      sky.addColorStop(1, "rgba(125, 211, 252, 0)");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, _h * 0.25);
    },
  },

  /* ----------------------------------------------------------------
     COLD — slow falling snowflakes with glowing halos
     ---------------------------------------------------------------- */
  COLD: {
    count: 55,   // snowflakes
    bgGradient: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w * 0.1, h);
      g.addColorStop(0,   "#07152A");
      g.addColorStop(0.45, "#0B1B33");
      g.addColorStop(1,   "#132240");
      return g;
    },
    spawn: (w, h) => ({
      x:        rnd(0, w),
      y:        rnd(-30, h * 0.3),
      vx:       rnd(-0.28, 0.28),
      vy:       rnd(0.4, 1.6),
      radius:   rnd(1.5, 5),
      alpha:    rnd(0.45, 0.92),
      rotation: rnd(0, Math.PI * 2),
      vr:       rnd(-0.012, 0.012),
      phase:    rnd(0, Math.PI * 2),
      life:     1,
      decay:    0,
    }),
    update: (p, w, h) => {
      p.x += p.vx + Math.sin(p.phase) * 0.28;
      p.y += p.vy;
      p.phase += 0.007;
      p.rotation += p.vr;
      if (p.y > h + 15) {
        p.x = rnd(0, w);
        p.y = rnd(-30, -5);
        p.alpha = rnd(0.45, 0.92);
        p.vy = rnd(0.4, 1.6);
      }
      // Gentle horizontal drift at screen edges
      if (p.x < -20) p.x = w + 10;
      if (p.x > w + 20) p.x = -10;
    },
    draw: (ctx, p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      // Soft glow halo
      const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2.5);
      halo.addColorStop(0,   `rgba(191, 227, 245, ${p.alpha * 0.6})`);
      halo.addColorStop(0.5, `rgba(191, 227, 245, ${p.alpha * 0.2})`);
      halo.addColorStop(1,   "rgba(191, 227, 245, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Main snowflake body (small + large use same circle for perf)
      const core = ctx.createRadialGradient(p.x - p.radius * 0.2, p.y - p.radius * 0.2, 0, p.x, p.y, p.radius);
      core.addColorStop(0,   "rgba(255, 255, 255, 0.98)");
      core.addColorStop(0.6, "rgba(220, 240, 255, 0.8)");
      core.addColorStop(1,   "rgba(191, 227, 245, 0.4)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // For larger flakes: draw 6 radial arms (snowflake cross)
      if (p.radius > 3) {
        ctx.globalAlpha = p.alpha * 0.5;
        ctx.strokeStyle = "rgba(220, 240, 255, 0.7)";
        ctx.lineWidth = 0.7;
        for (let arm = 0; arm < 6; arm++) {
          const angle = (arm / 6) * Math.PI * 2 + p.rotation;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(
            p.x + Math.cos(angle) * p.radius * 1.8,
            p.y + Math.sin(angle) * p.radius * 1.8,
          );
          ctx.stroke();
        }
      }

      ctx.restore();
    },
    extra: (ctx, w, h, t) => {
      // Aurora borealis shimmer at top
      const auroraPositions = [
        { cx: w * 0.2, colour: "rgba(59, 91, 146, 0.12)" },
        { cx: w * 0.5, colour: "rgba(80, 160, 200, 0.09)" },
        { cx: w * 0.78, colour: "rgba(59, 91, 146, 0.10)" },
      ];
      auroraPositions.forEach(({ cx, colour }, i) => {
        const wave = Math.sin(t * 0.07 + i * 1.1) * 18;
        const grd = ctx.createRadialGradient(cx + wave, h * 0.12, 0, cx + wave, h * 0.12, w * 0.35);
        grd.addColorStop(0,   colour);
        grd.addColorStop(0.6, "rgba(59, 91, 146, 0.03)");
        grd.addColorStop(1,   "rgba(59, 91, 146, 0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.ellipse(cx + wave, h * 0.1, w * 0.35, h * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Ground snow accumulation hint
      const snow = ctx.createLinearGradient(0, h * 0.88, 0, h);
      snow.addColorStop(0, "rgba(191, 227, 245, 0)");
      snow.addColorStop(1, `rgba(191, 227, 245, ${0.04 + 0.02 * Math.sin(t * 0.3)})`);
      ctx.fillStyle = snow;
      ctx.fillRect(0, h * 0.88, w, h * 0.12);
    },
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                             */
/* ------------------------------------------------------------------ */
export default function AnimatedBackground() {
  const { zone } = useClimateZone();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<{
    particles: Particle[];
    raf:       number;
    paused:    boolean;
    zone:      ZoneOrNeutral;
    t:         number;
  }>({ particles: [], raf: 0, paused: false, zone: "NEUTRAL", t: 0 });

  /* Detect prefers-reduced-motion once (SSR-safe) */
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Spawn all particles for a given zone, spread across the canvas */
  const spawnAll = useCallback((z: ZoneOrNeutral, w: number, h: number): Particle[] => {
    const cfg = CONFIGS[z];
    const particles: Particle[] = [];
    for (let i = 0; i < cfg.count; i++) {
      const p = cfg.spawn(w, h);
      // Spread initial y across full canvas height (not just off-top)
      p.y = rnd(0, h);
      particles.push(p);
    }
    return particles;
  }, []);

  /* Main animation loop — runs once on mount */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = stateRef.current;

    /* Resize canvas to viewport */
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    /* Pause when tab is hidden — saves CPU/GPU */
    const onVisibility = () => { state.paused = document.hidden; };
    document.addEventListener("visibilitychange", onVisibility);

    /* RAF loop */
    const loop = () => {
      if (!state.paused) {
        const { width: w, height: h } = canvas;
        const cfg = CONFIGS[state.zone];

        /* Background */
        ctx.fillStyle = cfg.bgGradient(ctx, w, h) as string;
        ctx.fillRect(0, 0, w, h);

        /* Extra environmental effects (sun, aurora, mist…) */
        cfg.extra?.(ctx, w, h, state.t);

        /* Particles */
        for (const p of state.particles) {
          cfg.update(p, w, h, state.t);
          cfg.draw(ctx, p, state.t);
        }

        state.t += 0.016;  // ~60 fps time unit (seconds-ish)
      }
      state.raf = requestAnimationFrame(loop);
    };

    state.raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(state.raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);  // intentionally empty — loop only mounts once

  /* React to zone change — reset particles */
  useEffect(() => {
    const canvas = canvasRef.current;
    const state  = stateRef.current;
    const w = canvas?.width  || window.innerWidth;
    const h = canvas?.height || window.innerHeight;
    state.zone      = zone;
    state.particles = spawnAll(zone, w, h);
    state.t         = 0;
  }, [zone, spawnAll]);

  /* -- Reduced-motion fallback -- */
  if (prefersReduced) {
    const staticBg: Record<ZoneOrNeutral, string> = {
      NEUTRAL:    "#F2F4F3",
      HOT_DRY:    "#F4D9A8",
      WARM_HUMID: "#062C2B",
      COMPOSITE:  "#334155",
      TEMPERATE:  "#F7F5EC",
      COLD:       "#0B1B33",
    };
    return (
      <div
        aria-hidden="true"
        style={{
          position:     "fixed",
          inset:        0,
          zIndex:       -1,
          background:   staticBg[zone],
          transition:   "background 800ms ease",
          pointerEvents:"none",
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position:     "fixed",
        inset:        0,
        zIndex:       -1,
        pointerEvents:"none",
        display:      "block",
      }}
    />
  );
}

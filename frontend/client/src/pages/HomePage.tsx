/**
 * HomePage
 * ------------------------------------------------------------------
 * Hero section with:
 *  - Animated sky canvas (sun arc, sky gradient, stars)
 *  - Glass search card (place search, GPS, map link)
 *  - Staggered Framer Motion entrance animations
 *  - Responsive layout (mobile-first, single centred column)
 * ------------------------------------------------------------------
 */
import { motion } from "framer-motion";
import { Thermometer, Wind, MapPin, Sparkles, ChevronDown } from "lucide-react";
import { pageVariants, fadeUp, staggerContainer } from "../motion/variants";
import { useReducedMotion } from "../hooks/useReducedMotion";
import HeroSkyCanvas   from "../components/HeroSkyCanvas";
import LocationPicker from "../components/LocationPicker";
import ScrollStory from "../components/ScrollStory";

/* ── Stagger variants ── */
const heroContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.2 } },
};

const slideUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const zoneData = [
  { zone: "HOT_DRY",    label: "Hot & Dry",    emoji: "🌵", colour: "#C8553D" },
  { zone: "WARM_HUMID", label: "Warm & Humid", emoji: "🌴", colour: "#0F766E" },
  { zone: "COMPOSITE",  label: "Composite",    emoji: "🌆", colour: "#F59E0B" },
  { zone: "TEMPERATE",  label: "Temperate",    emoji: "🍃", colour: "#22C55E" },
  { zone: "COLD",       label: "Cold",         emoji: "❄️", colour: "#3B5B92" },
];

const stats = [
  { icon: <Thermometer size={22} aria-hidden="true" />, value: "5",    label: "Climate Zones"   },
  { icon: <Wind        size={22} aria-hidden="true" />, value: "15+",  label: "Shelter Designs" },
  { icon: <MapPin      size={22} aria-hidden="true" />, value: "100+", label: "Regions Covered" },
];

export default function HomePage() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      variants={reduce ? undefined : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ minHeight: "100dvh" }}
    >
      {/* ══════════════════════════════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Hero"
        style={{
          position: "relative",
          minHeight: "100dvh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Sky canvas — absolute behind everything */}
        <HeroSkyCanvas
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
          }}
        />

        {/* Dark overlay for text legibility */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background: "linear-gradient(160deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.28) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "0 var(--space-6)",
            maxWidth: 760,
            margin: "0 auto",
            width: "100%",
            paddingTop: "clamp(5rem, 12vh, 9rem)",
            paddingBottom: "clamp(4rem, 8vh, 6rem)",
          }}
        >
          {/* ── Hero copy + search (single centred column) ── */}
          <motion.div
            variants={reduce ? undefined : heroContainer}
            initial="hidden"
            animate="visible"
            style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}
          >
            {/* Badge */}
            <motion.div variants={reduce ? undefined : slideUp}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  background: "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: "var(--radius-full)",
                  padding: "var(--space-2) var(--space-4)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "#fff",
                  fontFamily: "var(--font-body)",
                  letterSpacing: "0.02em",
                }}
              >
                <Sparkles size={14} aria-hidden="true" />
                Climate-Aware Architecture
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={reduce ? undefined : slideUp}
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(2.2rem, 5.5vw, 4rem)",
                fontWeight: 800,
                lineHeight: 1.08,
                color: "#fff",
                margin: 0,
                textShadow: "0 2px 24px rgba(0,0,0,0.3)",
                letterSpacing: "-0.02em",
              }}
            >
              Build for the climate{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #FFE066 0%, #FFB830 50%, #FF9F43 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                you live in
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={reduce ? undefined : slideUp}
              style={{
                fontSize: "clamp(1rem, 2.2vw, 1.2rem)",
                color: "rgba(255,255,255,0.85)",
                lineHeight: "var(--leading-relaxed)",
                margin: 0,
                maxWidth: 520,
                textShadow: "0 1px 8px rgba(0,0,0,0.2)",
              }}
            >
              Discover shelter designs optimised for your thermal environment.
              Enter your location and let the climate shape your architecture.
            </motion.p>

            {/* Search card */}
            <motion.div variants={reduce ? undefined : slideUp}>
              <LocationPicker />
            </motion.div>

            {/* Zone trust badges */}
            <motion.div
              variants={reduce ? undefined : slideUp}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--space-3)",
              }}
            >
              {zoneData.map(({ zone: z, label, emoji }) => (
                <span
                  key={z}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "var(--space-1)",
                    fontSize: "var(--text-xs)",
                    color: "rgba(255,255,255,0.75)",
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "var(--radius-full)",
                    padding: "3px 10px",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <span aria-hidden="true">{emoji}</span> {label}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Scroll cue ── */}
          <motion.div
            variants={reduce ? undefined : fadeUp}
            initial="hidden"
            animate="visible"
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "var(--space-10)",
            }}
          >
            <a
              href="#zones"
              aria-label="Scroll down to learn more"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "var(--space-1)",
                color: "rgba(255,255,255,0.55)",
                textDecoration: "none",
                fontSize: "var(--text-xs)",
                fontFamily: "var(--font-body)",
                animation: reduce ? "none" : "hero-bounce 2s ease-in-out infinite",
              }}
            >
              <span>Explore</span>
              <ChevronDown size={20} aria-hidden="true" />
            </a>
          </motion.div>
        </div>
      </section>

      <ScrollStory />

      {/* ══════════════════════════════════════════════════════════════
          ZONE PREVIEW SECTION
          ══════════════════════════════════════════════════════════════ */}
      <section
        id="zones"
        aria-label="Climate zones overview"
        style={{
          padding: "clamp(4rem, 8vw, 7rem) var(--space-6)",
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        <motion.div
          variants={reduce ? undefined : staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div variants={reduce ? undefined : slideUp} style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
            <h2 style={{ color: "var(--text)", marginBottom: "var(--space-4)" }}>
              Five Climate Zones
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "var(--text-lg)", maxWidth: 560, margin: "0 auto" }}>
              Every zone has its own palette, physics, and shelter strategy. Switch zones above to feel the difference.
            </p>
          </motion.div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
              gap: "var(--space-4)",
            }}
          >
            {zoneData.map(({ zone: z, label, emoji, colour }) => (
              <motion.div
                key={z}
                variants={reduce ? undefined : slideUp}
                className="card"
                style={{
                  textAlign: "center",
                  cursor: "default",
                  transition: "transform 200ms ease, box-shadow 200ms ease",
                }}
                whileHover={reduce ? {} : { translateY: -4, transition: { duration: 0.15 } }}
              >
                <div style={{ fontSize: "2.4rem", marginBottom: "var(--space-3)", lineHeight: 1 }} aria-hidden="true">
                  {emoji}
                </div>
                <h3
                  style={{
                    color: colour,
                    fontSize: "var(--text-base)",
                    fontWeight: 700,
                    marginBottom: "var(--space-1)",
                    transition: "color 800ms ease",
                  }}
                >
                  {label}
                </h3>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--muted)", fontFamily: "monospace", letterSpacing: "0.04em" }}>
                  {z}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          STATS SECTION
          ══════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Key statistics"
        style={{
          padding: "0 var(--space-6) clamp(4rem, 8vw, 7rem)",
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        <motion.div
          variants={reduce ? undefined : staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {stats.map(({ icon, value, label }) => (
            <motion.div
              key={label}
              variants={reduce ? undefined : slideUp}
              className="card"
              style={{ textAlign: "center" }}
            >
              <div style={{ color: "var(--primary)", marginBottom: "var(--space-2)", display: "flex", justifyContent: "center" }}>
                {icon}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "var(--text-4xl)",
                  fontWeight: 800,
                  color: "var(--text)",
                  lineHeight: 1.1,
                }}
              >
                {value}
              </div>
              <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>
                {label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Bounce keyframe */}
      <style>{`
        @keyframes hero-bounce {
          0%, 100% { transform: translateY(0);    opacity: 0.55; }
          50%       { transform: translateY(6px);  opacity: 0.85; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-bounce { animation: none !important; }
        }
      `}</style>
    </motion.div>
  );
}


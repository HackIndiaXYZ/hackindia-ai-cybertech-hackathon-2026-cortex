import { motion } from "framer-motion";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { Thermometer, Wind, Droplets, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ScrollStory() {
  const reduce = useReducedMotion();
  const navigate = useNavigate();

  // Animation variants
  const slideLeft = {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const slideRight = {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section
      aria-label="How it works"
      style={{
        padding: "clamp(4rem, 8vw, 7rem) var(--space-6)",
        maxWidth: 1000,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "clamp(6rem, 12vw, 10rem)",
      }}
    >
      {/* -- STEP 1: SENSE -- */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-8)",
          alignItems: "center",
          flexDirection: "row", // text left, image right
        }}
      >
        <motion.div
          variants={reduce ? undefined : slideLeft}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{ flex: "1 1 300px" }}
        >
          <div style={{ color: "var(--primary)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "var(--space-2)", fontSize: "var(--text-sm)" }}>STEP 1</div>
          <h2 style={{ fontSize: "var(--text-4xl)", marginBottom: "var(--space-4)" }}>Sense</h2>
          <p style={{ fontSize: "var(--text-lg)", color: "var(--muted)", lineHeight: "var(--leading-relaxed)" }}>
            We start by fetching live climatic data for your exact location. Temperature ranges, humidity levels, and wind patterns form the baseline of your thermal environment.
          </p>
        </motion.div>

        <motion.div
          variants={reduce ? undefined : slideRight}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{
            flex: "1 1 300px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 240,
            background: "rgba(var(--shadow-color), 0.05)",
            borderRadius: "var(--radius-2xl)",
            border: "1px solid var(--border)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <motion.div
            initial={reduce ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            whileInView={reduce ? {} : { y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            viewport={{ once: true }}
            style={{ position: "absolute", left: "20%", top: "35%", color: "#C8553D" }}
          >
            <Thermometer size={48} strokeWidth={1.5} />
          </motion.div>
          <motion.div
            initial={reduce ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            whileInView={reduce ? {} : { y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            viewport={{ once: true }}
            style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", color: "#38BDF8" }}
          >
            <Droplets size={64} strokeWidth={1.5} />
          </motion.div>
          <motion.div
            initial={reduce ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            whileInView={reduce ? {} : { y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            viewport={{ once: true }}
            style={{ position: "absolute", right: "20%", top: "35%", color: "#94A3B8" }}
          >
            <Wind size={48} strokeWidth={1.5} />
          </motion.div>
        </motion.div>
      </div>

      {/* -- STEP 2: UNDERSTAND -- */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap-reverse",
          gap: "var(--space-8)",
          alignItems: "center",
        }}
      >
        <motion.div
          variants={reduce ? undefined : slideLeft}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{
            flex: "1 1 300px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 240,
            background: "rgba(var(--shadow-color), 0.05)",
            borderRadius: "var(--radius-2xl)",
            border: "1px solid var(--border)",
            position: "relative",
          }}
        >
          {/* Climate Dial */}
          <svg viewBox="0 0 200 120" width="100%" height="100%" style={{ maxHeight: 180, overflow: "visible" }}>
            {/* Background Arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="rgba(var(--shadow-color), 0.1)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Zone segments */}
            <path d="M 20 100 A 80 80 0 0 1 50 45" fill="none" stroke="#3B5B92" strokeWidth="12" strokeLinecap="round" />
            <path d="M 50 45 A 80 80 0 0 1 100 20" fill="none" stroke="#22C55E" strokeWidth="12" strokeLinecap="round" />
            <path d="M 100 20 A 80 80 0 0 1 150 45" fill="none" stroke="#F59E0B" strokeWidth="12" strokeLinecap="round" />
            <path d="M 150 45 A 80 80 0 0 1 180 100" fill="none" stroke="#C8553D" strokeWidth="12" strokeLinecap="round" />
            
            {/* Dial Needle */}
            <motion.g
              initial={reduce ? { rotate: 120 } : { rotate: -40 }}
              whileInView={reduce ? {} : { rotate: 120 }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
              viewport={{ once: true }}
              style={{ originX: "100px", originY: "100px" }}
            >
              <line x1="100" y1="100" x2="100" y2="35" stroke="var(--text)" strokeWidth="4" strokeLinecap="round" />
              <circle cx="100" cy="100" r="8" fill="var(--text)" />
            </motion.g>

            {/* Label fading in */}
            <motion.text
              initial={reduce ? { opacity: 1 } : { opacity: 0 }}
              whileInView={reduce ? {} : { opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              viewport={{ once: true }}
              x="100"
              y="130"
              textAnchor="middle"
              fill="#C8553D"
              fontSize="16"
              fontWeight="bold"
            >
              Hot & Dry
            </motion.text>
          </svg>
        </motion.div>

        <motion.div
          variants={reduce ? undefined : slideRight}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{ flex: "1 1 300px" }}
        >
          <div style={{ color: "var(--primary)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "var(--space-2)", fontSize: "var(--text-sm)" }}>STEP 2</div>
          <h2 style={{ fontSize: "var(--text-4xl)", marginBottom: "var(--space-4)" }}>Understand</h2>
          <p style={{ fontSize: "var(--text-lg)", color: "var(--muted)", lineHeight: "var(--leading-relaxed)" }}>
            We synthesize these metrics to classify your environment into a specific climate zone. This classification unlocks the fundamental architectural strategies needed for comfort.
          </p>
        </motion.div>
      </div>

      {/* -- STEP 3: DESIGN -- */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-8)",
          alignItems: "center",
        }}
      >
        <motion.div
          variants={reduce ? undefined : slideLeft}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{ flex: "1 1 300px" }}
        >
          <div style={{ color: "var(--primary)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "var(--space-2)", fontSize: "var(--text-sm)" }}>STEP 3</div>
          <h2 style={{ fontSize: "var(--text-4xl)", marginBottom: "var(--space-4)" }}>Design</h2>
          <p style={{ fontSize: "var(--text-lg)", color: "var(--muted)", lineHeight: "var(--leading-relaxed)" }}>
            Finally, we present shelter typologies specifically engineered for your zone. From passive cooling courtyards to highly insulated snow shelters, discover what works where you live.
          </p>
        </motion.div>

        <motion.div
          variants={reduce ? undefined : slideRight}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{
            flex: "1 1 300px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 240,
            background: "rgba(var(--shadow-color), 0.05)",
            borderRadius: "var(--radius-2xl)",
            border: "1px solid var(--border)",
            position: "relative",
          }}
        >
          {/* Morphing House */}
          <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ maxHeight: 180, overflow: "visible" }}>
            <motion.path
              fill="rgba(var(--shadow-color), 0.15)"
              stroke="var(--primary)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduce ? { d: "M 50 160 L 50 100 L 100 50 L 150 100 L 150 160 Z" } : false}
              animate={
                reduce
                  ? {}
                  : {
                      d: [
                        "M 40 160 L 40 80 L 100 40 L 160 80 L 160 160 Z", // Standard shape
                        "M 20 140 L 20 80 L 100 20 L 180 80 L 180 140 Z", // Wide/Courtyard
                        "M 60 180 L 60 60 L 100 10 L 140 60 L 140 180 Z", // Tall/Compact
                        "M 40 160 L 40 80 L 100 40 L 160 80 L 160 160 Z", // Back to standard
                      ],
                    }
              }
              transition={{
                duration: 6,
                ease: "easeInOut",
                times: [0, 0.33, 0.66, 1],
                repeat: Infinity,
                repeatType: "loop",
              }}
            />
          </svg>
        </motion.div>
      </div>

      {/* -- CALL TO ACTION -- */}
      <motion.div
        variants={reduce ? undefined : {
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.2 } }
        }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "var(--space-4)",
        }}
      >
        <button
          onClick={() => navigate("/dashboard")}
          className="cta-glow"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            background: "var(--primary)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-full)",
            padding: "var(--space-4) var(--space-8)",
            fontSize: "var(--text-lg)",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "var(--font-heading)",
            position: "relative",
            overflow: "hidden",
            transition: "transform 200ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          Get Started
          <ArrowRight size={20} aria-hidden="true" />
          
          <style>{`
            .cta-glow::before {
              content: '';
              position: absolute;
              top: 0; left: -100%; width: 50%; height: 100%;
              background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);
              transform: skewX(-20deg);
              animation: cta-shine 3s infinite;
            }
            @keyframes cta-shine {
              0% { left: -100%; }
              20% { left: 200%; }
              100% { left: 200%; }
            }
            @media (prefers-reduced-motion: reduce) {
              .cta-glow::before { animation: none; display: none; }
            }
          `}</style>
        </button>
      </motion.div>
    </section>
  );
}

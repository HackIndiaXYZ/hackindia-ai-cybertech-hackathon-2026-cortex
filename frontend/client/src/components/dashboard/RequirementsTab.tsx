import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Compass, 
  Layout, 
  GripHorizontal, 
  Home, 
  AppWindow, 
  Sun, 
  Wind, 
  Trees, 
  HelpCircle, 
  X,
  Loader
} from "lucide-react";
import { mockRequirements, Requirement } from "../../mock/requirements";
import { getRequirements } from "../../services/api";
import { useLocationContext } from "../../context/LocationContext";
import { useClimateZone } from "../../theme/ClimateThemeProvider";
import { mapToThemeZone } from "../../utils/climateMapping";
import { staggerContainer, fadeUp } from "../../motion/variants";
import { useReducedMotion } from "../../hooks/useReducedMotion";

/**
 * Animated Icon Component based on the requirement type
 */
function AnimatedIcon({ type }: { type: Requirement["iconType"] }) {
  const reduce = useReducedMotion();
  const size = 32;
  const color = "var(--primary, #6366F1)";

  switch (type) {
    case "orientation":
      return (
        <motion.div
          animate={reduce ? {} : { rotate: [-10, 15, -5, 0, 10, -10] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Compass size={size} color={color} strokeWidth={1.5} />
        </motion.div>
      );
    case "layout":
      return (
        <motion.div
          animate={reduce ? {} : { scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Layout size={size} color={color} strokeWidth={1.5} />
        </motion.div>
      );
    case "walls":
      return (
        <motion.div
          animate={reduce ? {} : { y: [0, -3, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <GripHorizontal size={size} color={color} strokeWidth={1.5} />
        </motion.div>
      );
    case "roof":
      return (
        <motion.div
          animate={reduce ? {} : { y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        >
          <Home size={size} color={color} strokeWidth={1.5} />
        </motion.div>
      );
    case "windows":
      return (
        <motion.div
          animate={reduce ? {} : { opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <AppWindow size={size} color={color} strokeWidth={1.5} />
        </motion.div>
      );
    case "shading":
      return (
        <motion.div
          animate={reduce ? {} : { rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <Sun size={size} color={color} strokeWidth={1.5} />
        </motion.div>
      );
    case "ventilation":
      return (
        <motion.div
          animate={reduce ? {} : { x: [-4, 6, -4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Wind size={size} color={color} strokeWidth={1.5} />
        </motion.div>
      );
    case "landscape":
      return (
        <motion.div
          style={{ originY: 1 }}
          animate={reduce ? {} : { rotate: [-5, 5, -5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Trees size={size} color={color} strokeWidth={1.5} />
        </motion.div>
      );
    default:
      return <HelpCircle size={size} color={color} />;
  }
}

/**
 * Individual Requirement Card Component with Flip Animation
 */
function RequirementCard({ req }: { req: Requirement }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const reduce = useReducedMotion();

  return (
    <motion.div
      variants={fadeUp}
      whileHover={reduce ? {} : { y: -6, transition: { duration: 0.2 } }}
      style={{
        position: "relative",
        perspective: "1000px",
        height: 240,
        zIndex: isFlipped ? 10 : 1,
      }}
    >
      <motion.div
        animate={{ rotateY: isFlipped && !reduce ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 70, damping: 15 }}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
        }}
      >
        {/* FRONT SIDE */}
        <div
          className="card"
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            padding: "var(--space-6)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
            cursor: "default",
            opacity: reduce && isFlipped ? 0 : 1,
            pointerEvents: isFlipped ? "none" : "auto",
            transition: reduce ? "opacity 0.3s" : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ padding: "var(--space-3)", background: "var(--primary)15", borderRadius: "var(--radius-md)", display: "flex" }}>
              <AnimatedIcon type={req.iconType} />
            </div>
            <button
              onClick={() => setIsFlipped(true)}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                color: "var(--text)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.color = "var(--primary)"; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text)"; }}
            >
              <HelpCircle size={14} />
              Why?
            </button>
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: "0 0 var(--space-2)", fontSize: "var(--text-lg)" }}>{req.title}</h3>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--muted)", lineHeight: 1.5 }}>
              {req.recommendation}
            </p>
          </div>
        </div>

        {/* BACK SIDE */}
        <div
          className="card"
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: !reduce ? "rotateY(180deg)" : "none",
            padding: "var(--space-6)",
            display: "flex",
            flexDirection: "column",
            background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark, #4F46E5) 100%)",
            color: "#fff",
            boxShadow: "0 16px 40px rgba(99, 102, 241, 0.3)",
            opacity: reduce && !isFlipped ? 0 : 1,
            pointerEvents: !isFlipped ? "none" : "auto",
            transition: reduce ? "opacity 0.3s" : "none",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
            <h4 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
              The Reasoning
            </h4>
            <button
              onClick={() => setIsFlipped(false)}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                padding: "var(--space-2)",
                borderRadius: "50%",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                backdropFilter: "blur(4px)",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.3)"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
            >
              <X size={16} />
            </button>
          </div>
          
          <p style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: 1.6, color: "rgba(255,255,255,0.95)", overflowY: "auto" }}>
            {req.reason}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * RequirementsTab Component
 */
export default function RequirementsTab() {
  const { analysis } = useLocationContext();
  const { zone: themeZone } = useClimateZone();
  const reduce = useReducedMotion();

  // Determine active bioclimatic zone
  const activeZone =
    (themeZone !== "NEUTRAL" ? themeZone : null) ??
    (analysis ? mapToThemeZone(analysis.analysis.classification) : null) ??
    "COMPOSITE";

  const [requirements, setRequirements] = useState<Requirement[]>(mockRequirements);
  const [isFallback, setIsFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    const alerts = analysis?.analysis?.conditions?.map((c) => c.toLowerCase()) ?? [];

    getRequirements(activeZone, alerts)
      .then((res) => {
        if (isCancelled) return;
        if (res?.strategies && res.strategies.length > 0) {
          const mapped: Requirement[] = res.strategies.map((s, idx) => ({
            id: s.id || `req-${s.element}-${idx}`,
            title: s.title || (s.element.charAt(0).toUpperCase() + s.element.slice(1)),
            recommendation: s.recommendation || s.value,
            reason: s.reason,
            iconType: (s.iconType || s.element) as Requirement["iconType"],
          }));
          setRequirements(mapped);
          setIsFallback(false);
        } else {
          setRequirements(mockRequirements);
          setIsFallback(true);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        console.warn("Could not fetch requirements, using fallback:", err);
        setRequirements(mockRequirements);
        setIsFallback(true);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeZone, analysis]);

  return (
    <motion.div
      variants={reduce ? undefined : staggerContainer}
      initial="hidden"
      animate="visible"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-8)",
        paddingBottom: "var(--space-8)"
      }}
    >
      <motion.div variants={reduce ? undefined : fadeUp} style={{ maxWidth: 800 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
          <h2 style={{ fontSize: "var(--text-2xl)", margin: 0 }}>Design Requirements</h2>
          {isLoading && (
            <Loader size={16} color="var(--primary)" style={{ animation: "spin 1s linear infinite" }} />
          )}
          {isFallback ? (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--muted)",
                background: "var(--border)",
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              demo data
            </span>
          ) : (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--primary)",
                background: "rgba(var(--primary-rgb), 0.1)",
                border: "1px solid rgba(var(--primary-rgb), 0.25)",
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {activeZone.replace("_", " ")}
            </span>
          )}
        </div>
        <p style={{ color: "var(--muted)", margin: 0, fontSize: "var(--text-md)", lineHeight: 1.6 }}>
          Based on the detected climate zone, here are the core architectural recommendations to ensure maximum thermal comfort and energy efficiency.
        </p>
      </motion.div>

      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
          gap: "var(--space-6)" 
        }}
      >
        {requirements.map((req) => (
          <RequirementCard key={req.id} req={req} />
        ))}
      </div>
    </motion.div>
  );
}

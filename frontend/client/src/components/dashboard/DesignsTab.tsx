import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Leaf, DollarSign, Shield, Heart, Eye, Cuboid, Trophy, Loader } from "lucide-react";
import { mockDesigns, DesignScores } from "../../mock/designs";
import type { DesignModel } from "../../services/analyzeService";
import { rankDesigns } from "../../services/api";
import { fadeUp, staggerContainer } from "../../motion/variants";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useLocationContext } from "../../context/LocationContext";
import { useClimateZone } from "../../theme/ClimateThemeProvider";
import { mapToThemeZone } from "../../utils/climateMapping";

type WeightKey = keyof DesignScores;

const CRITERIA = [
  { key: "comfort" as WeightKey, label: "Comfort", icon: Heart, color: "#EF4444" },
  { key: "cost" as WeightKey, label: "Cost Efficiency", icon: DollarSign, color: "#10B981" },
  { key: "safety" as WeightKey, label: "Safety & Strength", icon: Shield, color: "#3B82F6" },
  { key: "sustainability" as WeightKey, label: "Sustainability", icon: Leaf, color: "#F59E0B" },
];

const PRESETS = [
  { label: "Balanced", weights: { comfort: 25, cost: 25, safety: 25, sustainability: 25 } },
  { label: "Low Cost", weights: { comfort: 15, cost: 55, safety: 15, sustainability: 15 } },
  { label: "Safety First", weights: { comfort: 15, cost: 15, safety: 55, sustainability: 15 } },
  { label: "Eco Friendly", weights: { comfort: 20, cost: 10, safety: 10, sustainability: 60 } },
];

function CountUpScore({ score }: { score: number }) {
  const [display, setDisplay] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      setDisplay(score);
      return;
    }
    const duration = 800; // ms
    let start: number | null = null;
    const initial = display;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(initial + (score - initial) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score, reduce]); // initial is captured in closure, effect runs when score changes

  return <span>{display}</span>;
}

/** Map backend classification string -> zone code for design API */
function classificationToZone(cls?: string | null): string {
  if (!cls) return "COMPOSITE";
  const map: Record<string, string> = {
    "Cold": "COLD",
    "Cold-Humid": "COLD",
    "Hot-Dry": "HOT_DRY",
    "Hot-Humid": "WARM_HUMID",
    "Moderate": "TEMPERATE",
    "Variable": "COMPOSITE",
    "HOT_DRY": "HOT_DRY",
    "WARM_HUMID": "WARM_HUMID",
    "COLD": "COLD",
    "TEMPERATE": "TEMPERATE",
    "COMPOSITE": "COMPOSITE",
  };
  return map[cls] ?? mapToThemeZone(cls) ?? "COMPOSITE";
}

export default function DesignsTab() {
  const { analysis } = useLocationContext();
  const { zone: themeZone } = useClimateZone();
  const [weights, setWeights] = useState<DesignScores>({
    comfort: 25,
    cost: 25,
    safety: 25,
    sustainability: 25,
  });
  const [apiDesigns, setApiDesigns] = useState<DesignModel[] | null>(null);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  const reduce = useReducedMotion();

  // Derive zone from latest analysis result or theme
  const zone = analysis
    ? classificationToZone(analysis.analysis.classification)
    : themeZone !== "NEUTRAL"
    ? themeZone
    : "COMPOSITE";

  // Debounce ref to call API with 300ms debounce on slider or preset change
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!zone) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setIsLoadingDesigns(true);
      rankDesigns(zone, weights, 4)
        .then((res) => setApiDesigns(res.designs))
        .catch((err) => {
          console.warn("Design ranking API unavailable, using local mock:", err);
          setApiDesigns(null);
        })
        .finally(() => setIsLoadingDesigns(false));
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [zone, weights]);

  const handleWeightChange = (key: WeightKey, newValue: number) => {
    const clampedVal = Math.max(0, Math.min(100, newValue));
    setWeights(prev => {
      const next = { ...prev, [key]: clampedVal };
      const remainder = 100 - clampedVal;
      const otherKeys = CRITERIA.map(c => c.key).filter(k => k !== key);
      const otherSum = otherKeys.reduce((s, k) => s + (prev[k] ?? 0), 0);
      
      let allocated = 0;
      for (let i = 0; i < otherKeys.length - 1; i++) {
        const k = otherKeys[i];
        const portion = otherSum > 0 ? (prev[k] ?? 0) / otherSum : 1 / otherKeys.length;
        const val = Math.max(0, Math.min(remainder - allocated, Math.round(remainder * portion)));
        next[k] = val;
        allocated += val;
      }
      next[otherKeys[otherKeys.length - 1]] = Math.max(0, remainder - allocated);

      // Final strict sum safeguard to ensure exactly 100%
      const total = Object.values(next).reduce((a, b) => a + b, 0);
      if (total !== 100) {
        next[otherKeys[otherKeys.length - 1]] += (100 - total);
      }
      return next;
    });
  };

  // Client-side weighted sum applied to mock designs (used when API is unavailable)
  const localRankedMock = useMemo(() => {
    return mockDesigns.map(design => {
      const score = 
        (design.scores.comfort * (weights.comfort / 100)) +
        (design.scores.cost * (weights.cost / 100)) +
        (design.scores.safety * (weights.safety / 100)) +
        (design.scores.sustainability * (weights.sustainability / 100));
      return { ...design, totalScore: Math.round(score) };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }, [weights]);

  // Use API response if available; backend already sorted by MCDM score
  const rankedDesigns = apiDesigns ?? localRankedMock;

  // Podium logic: 2nd, 1st, 3rd (only take top 3)
  const top3 = (rankedDesigns as Array<DesignModel & { totalScore: number }>)
    .map(d => ({ ...d, totalScore: d.totalScore ?? 0 }))
    .slice(0, 3);
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;
  // Map back to original rank for visual indicators
  const getRank = (id: string) => top3.findIndex(d => d.id === id) + 1;

  return (
    <motion.div
      variants={reduce ? undefined : staggerContainer}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)", paddingBottom: "var(--space-8)" }}
    >
      {/* Configuration Panel */}
      <motion.div variants={reduce ? undefined : fadeUp} className="card" style={{ padding: "var(--space-6)" }}>
        <h2 style={{ fontSize: "var(--text-xl)", margin: "0 0 var(--space-4)" }}>Optimization Priorities</h2>
        <p style={{ color: "var(--muted)", marginBottom: "var(--space-6)", fontSize: "var(--text-sm)" }}>
          Adjust the sliders to reflect your priorities. The total will always equal 100%. The AI will instantly re-rank the design options.
        </p>
        
        {/* Presets */}
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "var(--space-8)" }}>
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setWeights(preset.weights)}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.color = "var(--primary)"; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text)"; }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Sliders */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-6)" }}>
          {CRITERIA.map((crit) => {
            const Icon = crit.icon;
            return (
              <div key={crit.key} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
                    <Icon size={16} color={crit.color} />
                    {crit.label}
                  </div>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: crit.color }}>
                    {weights[crit.key]}%
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights[crit.key]}
                  onChange={(e) => handleWeightChange(crit.key, parseInt(e.target.value))}
                  style={{
                    width: "100%",
                    accentColor: crit.color,
                    cursor: "pointer"
                  }}
                />
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Podium Display */}
      <motion.div variants={reduce ? undefined : fadeUp} style={{ marginTop: "var(--space-4)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
          <h2 style={{ fontSize: "var(--text-2xl)", margin: 0, textAlign: "center" }}>Top Recommended Designs</h2>
          {isLoadingDesigns && (
            <Loader size={18} color="var(--muted)" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
          )}
          {apiDesigns && !isLoadingDesigns ? (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--primary)", fontWeight: 700, background: "rgba(var(--primary-rgb), 0.1)", border: "1px solid rgba(var(--primary-rgb), 0.25)", borderRadius: "var(--radius-full)", padding: "2px 10px" }}>
              LIVE
            </span>
          ) : !isLoadingDesigns ? (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)", fontWeight: 700, background: "var(--border)", borderRadius: "var(--radius-full)", padding: "2px 10px", textTransform: "uppercase" }}>
              demo data
            </span>
          ) : null}
        </div>
        
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "flex-end", 
          gap: "var(--space-4)", 
          minHeight: 450,
          flexWrap: "wrap" 
        }}>
          {podiumOrder.map((design) => {
            const rank = getRank(design.id);
            const isFirst = rank === 1;
            
            return (
              <motion.div
                layout={!reduce}
                key={design.id}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 50 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="card"
                style={{
                  width: 320,
                  padding: "var(--space-6)",
                  position: "relative",
                  border: isFirst ? "2px solid var(--primary)" : "1px solid var(--border)",
                  boxShadow: isFirst ? "0 20px 40px rgba(99, 102, 241, 0.15)" : "var(--shadow-sm)",
                  transformOrigin: "bottom",
                  zIndex: isFirst ? 10 : 1,
                  // Taller for 1st place
                  minHeight: isFirst ? 420 : 380,
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                {/* Rank Badge */}
                <div style={{
                  position: "absolute",
                  top: -16,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: isFirst ? "var(--primary)" : "var(--surface)",
                  color: isFirst ? "#fff" : "var(--text)",
                  border: isFirst ? "none" : "1px solid var(--border)",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "var(--text-md)",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                }}>
                  {isFirst ? <Trophy size={16} /> : `#${rank}`}
                </div>

                <div style={{ textAlign: "center", marginTop: "var(--space-2)", marginBottom: "var(--space-4)" }}>
                  <h3 style={{ fontSize: "var(--text-xl)", margin: "0 0 var(--space-2)" }}>{design.name}</h3>
                  <div style={{ fontSize: "3rem", fontWeight: 900, color: "var(--text)", lineHeight: 1, letterSpacing: "-0.04em" }}>
                    <CountUpScore score={design.totalScore} />
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Total Match</div>
                </div>

                {/* Score Bars */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
                  {CRITERIA.map(crit => (
                    <div key={crit.key} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                      <crit.icon size={14} color={crit.color} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                        <motion.div 
                          initial={reduce ? { width: `${design.scores[crit.key]}%` } : { width: 0 }}
                          animate={{ width: `${design.scores[crit.key]}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          style={{ height: "100%", background: crit.color, borderRadius: 3 }}
                        />
                      </div>
                      <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text)", width: 24, textAlign: "right" }}>
                        {design.scores[crit.key]}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reasons */}
                <div style={{ flex: 1 }}>
                  <ul style={{ margin: 0, paddingLeft: "var(--space-4)", fontSize: "var(--text-sm)", color: "var(--muted)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                    {design.reasons.slice(0, 3).map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-6)" }}>
                  <button style={{
                    flex: 1, background: "var(--bg)", border: "1px solid var(--border)", padding: "var(--space-2)", borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)", cursor: "pointer", color: "var(--text)"
                  }}>
                    <Eye size={16} /> 2D
                  </button>
                  <button style={{
                    flex: 1, background: isFirst ? "var(--primary)" : "var(--bg)", border: isFirst ? "none" : "1px solid var(--border)", color: isFirst ? "#fff" : "var(--text)", padding: "var(--space-2)", borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)", cursor: "pointer"
                  }}>
                    <Cuboid size={16} /> 3D
                  </button>
                </div>

              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

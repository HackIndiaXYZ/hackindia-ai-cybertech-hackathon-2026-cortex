/**
 * RecommendedDesignsSection.tsx
 * ------------------------------
 * Fetches and displays multi-target ML design recommendations via POST /api/designs/recommend.
 *
 * Features:
 * - Fetches when selected location changes via LocationContext.
 * - Interactive Ranking Priorities panel with 4 sliders (Comfort, Cost, Safety, Sustainability).
 * - Sliders strictly sum to 100% via proportional redistribution.
 * - Preset chips loaded from backend GET /api/design/presets (Balanced, Low cost, Safety first, Eco friendly).
 * - 300 ms debounce when updating weights to avoid spamming the ML recommender endpoint.
 * - Loading skeleton on initial load, seamless in-place updates during slider tuning.
 * - Dedicated error state with Retry button on network/model errors (including HTTP 503).
 * - Strictly NO fallback to static mock designs.
 * - Rich card layout with Framer Motion layout reordering and CountUpScore:
 *   - Rank badges (#1 trophy, #2, #3)
 *   - Animated total match score
 *   - 4 criteria score progress bars (comfort, cost, safety, sustainability)
 *   - Factual bioclimatic reason bullet lines
 *   - 2D and 3D visualization buttons passing design.plan_archetype
 * - "ML" badge with tooltip and model provenance subtitle.
 * - Fully respects prefers-reduced-motion.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Eye,
  Cuboid,
  Trophy,
  RefreshCw,
  AlertCircle,
  Heart,
  DollarSign,
  Shield,
  Leaf,
  Layers,
  Sliders,
  Loader2,
  Check,
} from "lucide-react";
import {
  analyzeService,
  type MLDesignRecommendResponse,
} from "../../services/analyzeService";
import { useLocationContext } from "../../context/LocationContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";

export interface RecommendedDesignsSectionProps {
  onViewPlan?: (archetype: string) => void;
  onViewShelter?: (archetype: string) => void;
}

export interface CriterionWeights {
  comfort: number;
  cost: number;
  safety: number;
  sustainability: number;
}

type WeightKey = keyof CriterionWeights;

const CRITERIA = [
  { key: "comfort" as WeightKey, label: "Comfort", icon: Heart, color: "#EF4444" },
  { key: "cost" as WeightKey, label: "Cost Efficiency", icon: DollarSign, color: "#10B981" },
  { key: "safety" as WeightKey, label: "Safety & Strength", icon: Shield, color: "#3B82F6" },
  { key: "sustainability" as WeightKey, label: "Sustainability", icon: Leaf, color: "#F59E0B" },
];

interface PresetItem {
  id: string;
  label: string;
  description?: string;
  weights: CriterionWeights;
}

const DEFAULT_PRESETS: PresetItem[] = [
  {
    id: "Balanced",
    label: "Balanced",
    description: "Equally distributed weights across all criteria.",
    weights: { comfort: 25, cost: 25, safety: 25, sustainability: 25 },
  },
  {
    id: "Low cost",
    label: "Low Cost",
    description: "Maximizes affordability and economic efficiency.",
    weights: { comfort: 15, cost: 55, safety: 15, sustainability: 15 },
  },
  {
    id: "Safety first",
    label: "Safety First",
    description: "Focuses on structural robustness and extreme weather protection.",
    weights: { comfort: 15, cost: 15, safety: 55, sustainability: 15 },
  },
  {
    id: "Eco friendly",
    label: "Eco Friendly",
    description: "Prioritizes minimal carbon and renewable circular materials.",
    weights: { comfort: 20, cost: 10, safety: 10, sustainability: 60 },
  },
];

function CountUpScore({ score }: { score: number }) {
  const [display, setDisplay] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      setDisplay(Math.round(score));
      return;
    }
    const duration = 650;
    let start: number | null = null;
    const initial = display;
    const target = Math.round(score);

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(initial + (target - initial) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    const req = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(req);
  }, [score, reduce]);

  return <span>{display}</span>;
}

function LoadingSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "var(--space-6)",
      }}
    >
      {[1, 2, 3].map((idx) => (
        <div
          key={idx}
          className="card"
          style={{
            padding: "var(--space-6)",
            borderRadius: "var(--radius-xl)",
            border: "1.5px solid var(--border)",
            background: "rgba(var(--surface-rgb), 0.5)",
            minHeight: 380,
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--border)", opacity: 0.6 }} />
            <div style={{ width: 80, height: 20, borderRadius: "var(--radius-full)", background: "var(--border)", opacity: 0.6 }} />
          </div>
          <div style={{ width: "70%", height: 24, borderRadius: "var(--radius-md)", background: "var(--border)", opacity: 0.6, margin: "0 auto" }} />
          <div style={{ width: "40%", height: 48, borderRadius: "var(--radius-md)", background: "var(--border)", opacity: 0.6, margin: "0 auto" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
            {[1, 2, 3, 4].map((b) => (
              <div key={b} style={{ width: "100%", height: 8, borderRadius: 4, background: "var(--border)", opacity: 0.5 }} />
            ))}
          </div>
          <div style={{ width: "100%", height: 36, borderRadius: "var(--radius-lg)", background: "var(--border)", opacity: 0.5, marginTop: "auto" }} />
        </div>
      ))}
    </div>
  );
}

export default function RecommendedDesignsSection({
  onViewPlan,
  onViewShelter,
}: RecommendedDesignsSectionProps) {
  const { location, analysis } = useLocationContext();
  const reduce = useReducedMotion();

  const [response, setResponse] = useState<MLDesignRecommendResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Weights state & Presets
  const [weights, setWeights] = useState<CriterionWeights>({
    comfort: 25,
    cost: 25,
    safety: 25,
    sustainability: 25,
  });
  const [presets, setPresets] = useState<PresetItem[]>(DEFAULT_PRESETS);

  const abortRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lat = location?.lat ?? analysis?.location.latitude;
  const lon = location?.lon ?? analysis?.location.longitude;

  // Load presets from backend GET /api/design/presets on mount
  useEffect(() => {
    let isMounted = true;
    analyzeService
      .getDesignPresets()
      .then((data: any) => {
        if (!isMounted || !data?.presets) return;
        const loaded: PresetItem[] = Object.entries(data.presets).map(
          ([id, item]: [string, any]) => {
            const wp = item.weights_percent || {};
            const w = item.weights || {};
            return {
              id,
              label: item.label || id,
              description: item.description,
              weights: {
                comfort: wp.comfort ?? Math.round((w.comfort ?? 0.25) * 100),
                cost: wp.cost ?? Math.round((w.cost ?? 0.25) * 100),
                safety: wp.safety ?? Math.round((w.safety ?? 0.25) * 100),
                sustainability: wp.sustainability ?? Math.round((w.sustainability ?? 0.25) * 100),
              },
            };
          }
        );
        if (loaded.length > 0) {
          setPresets(loaded);
        }
      })
      .catch((err) => {
        console.warn("[RecommendedDesignsSection] Could not load backend presets, using defaults:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch ML recommendations
  const fetchRecommendations = useCallback(
    async (targetWeights: CriterionWeights, isInitial = false) => {
      if (lat == null || lon == null) return;

      if (abortRef.current) {
        abortRef.current.abort();
      }
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsRefetching(true);
      }
      setError(null);

      try {
        const res = await analyzeService.recommendDesigns(
          lat,
          lon,
          targetWeights,
          3,
          ctrl.signal
        );
        setResponse(res);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[RecommendedDesignsSection] ML recommendation error:", msg);
        setError(msg);
        if (isInitial) {
          setResponse(null);
        }
      } finally {
        setIsLoading(false);
        setIsRefetching(false);
      }
    },
    [lat, lon]
  );

  // Fetch on location coordinates change
  useEffect(() => {
    if (lat != null && lon != null) {
      fetchRecommendations(weights, true);
    }
    return () => {
      abortRef.current?.abort();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [lat, lon, fetchRecommendations]);

  // Handle weights update with 300 ms debounce
  const applyWeightsWithDebounce = (newWeights: CriterionWeights) => {
    setWeights(newWeights);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchRecommendations(newWeights, false);
    }, 300);
  };

  // Slider change handler ensuring exact 100% sum
  const handleSliderChange = (key: WeightKey, newValue: number) => {
    const clampedVal = Math.max(0, Math.min(100, isNaN(newValue) ? 0 : newValue));
    const remainder = 100 - clampedVal;
    const otherKeys = (["comfort", "cost", "safety", "sustainability"] as const).filter(
      (k) => k !== key
    );
    const otherSum = otherKeys.reduce((s, k) => s + (weights[k] ?? 0), 0);

    const next: CriterionWeights = { ...weights, [key]: clampedVal };
    let allocated = 0;
    for (let i = 0; i < otherKeys.length - 1; i++) {
      const k = otherKeys[i];
      const portion = otherSum > 0 ? (weights[k] ?? 0) / otherSum : 1 / otherKeys.length;
      const val = Math.max(0, Math.min(remainder - allocated, Math.round(remainder * portion)));
      next[k] = val;
      allocated += val;
    }
    const lastKey = otherKeys[otherKeys.length - 1];
    next[lastKey] = Math.max(0, remainder - allocated);

    // Final strict sum safeguard
    const total = next.comfort + next.cost + next.safety + next.sustainability;
    if (total !== 100) {
      next[lastKey] += 100 - total;
      if (next[lastKey] < 0) {
        next[lastKey] = 0;
      }
    }

    applyWeightsWithDebounce(next);
  };

  const isPresetActive = (pWeights: CriterionWeights) => {
    return (
      weights.comfort === pWeights.comfort &&
      weights.cost === pWeights.cost &&
      weights.safety === pWeights.safety &&
      weights.sustainability === pWeights.sustainability
    );
  };

  if (!lat || !lon) {
    return null;
  }

  const modelInfo = response?.model_info;

  return (
    <section aria-label="ML Recommended Vernacular Designs" style={{ marginBottom: "var(--space-8)" }}>
      <div className="card" style={{ padding: "var(--space-6)" }}>
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "var(--space-3)",
            marginBottom: "var(--space-6)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px" }}>
              <BrainCircuit size={22} style={{ color: "var(--primary)" }} />
              <h2 style={{ fontSize: "var(--text-2xl)", margin: 0, fontWeight: 800, letterSpacing: "-0.01em" }}>
                Recommended Vernacular Designs
              </h2>
              {/* ML Badge with Tooltip */}
              <span
                title="Scores predicted by a trained model; guidance only."
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                  background: "rgba(99,102,241,0.12)",
                  color: "#818cf8",
                  border: "1px solid rgba(99,102,241,0.3)",
                  cursor: "help",
                }}
              >
                <BrainCircuit size={11} />
                ML
              </span>
            </div>

            {/* Model Name & Version Subtitle */}
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "var(--text-xs)", lineHeight: 1.5 }}>
              {modelInfo ? (
                <>
                  Model: <strong style={{ color: "var(--text)" }}>{modelInfo.name}</strong> (v{modelInfo.version}) • Continuous multi-criteria surrogate scoring
                  {response?.location?.name ? ` for ${response.location.name}` : ""}
                </>
              ) : (
                "Continuous multi-criteria surrogate scoring across thermal comfort, cost, safety, and sustainability."
              )}
            </p>
          </div>
        </div>

        {/* Weight Sliders & Presets Tuning Box */}
        <div
          style={{
            background: "rgba(var(--surface-rgb), 0.55)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)",
            padding: "var(--space-4) var(--space-5)",
            marginBottom: "var(--space-6)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
        >
          {/* Controls Header & Presets Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "var(--space-3)",
              marginBottom: "var(--space-4)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Sliders size={16} style={{ color: "var(--primary)" }} />
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text)" }}>
                Optimization Priorities
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                  background: "rgba(var(--primary-rgb), 0.08)",
                  color: "var(--primary)",
                }}
              >
                Sum: {weights.comfort + weights.cost + weights.safety + weights.sustainability}%
              </span>

              {isRefetching && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--primary)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontWeight: 600,
                    marginLeft: 6,
                  }}
                >
                  <Loader2 size={12} className="animate-spin" />
                  Optimizing...
                </span>
              )}
            </div>

            {/* Presets Chips */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginRight: 2, fontWeight: 500 }}>
                Presets:
              </span>
              {presets.map((preset) => {
                const active = isPresetActive(preset.weights);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyWeightsWithDebounce(preset.weights)}
                    title={preset.description}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "var(--text-xs)",
                      fontWeight: active ? 700 : 500,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      background: active ? "rgba(var(--primary-rgb), 0.15)" : "var(--bg)",
                      color: active ? "var(--primary)" : "var(--text)",
                      border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                      boxShadow: active ? "0 2px 6px rgba(var(--primary-rgb), 0.2)" : "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {active && <Check size={11} />}
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4 Weight Sliders */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "var(--space-4)",
            }}
          >
            {CRITERIA.map((crit) => {
              const Icon = crit.icon;
              const val = weights[crit.key];
              return (
                <div
                  key={crit.key}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    background: "rgba(var(--surface-rgb), 0.35)",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid rgba(var(--border-rgb, 128,128,128), 0.15)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: "var(--text-xs)",
                        fontWeight: 600,
                        color: "var(--text)",
                      }}
                    >
                      <Icon size={14} style={{ color: crit.color }} />
                      {crit.label}
                    </span>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: crit.color }}>
                      {val}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={val}
                    onChange={(e) => handleSliderChange(crit.key, parseInt(e.target.value, 10))}
                    aria-label={`${crit.label} weight percentage`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={val}
                    style={{
                      width: "100%",
                      height: 5,
                      borderRadius: "var(--radius-full)",
                      accentColor: crit.color,
                      cursor: "pointer",
                      margin: "4px 0",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Loading State: full skeleton on initial load */}
        {isLoading && !response && <LoadingSkeleton />}

        {/* Error State with Retry Button */}
        {!isLoading && error && !response && (
          <div
            style={{
              padding: "var(--space-6)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              background: "rgba(239, 68, 68, 0.05)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "var(--space-3)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#EF4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertCircle size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: "0 0 4px", color: "var(--text)" }}>
                Unable to Load ML Recommendations
              </h3>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--muted)", maxWidth: 520 }}>
                {error}
              </p>
            </div>
            <button
              onClick={() => fetchRecommendations(weights, true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "var(--space-2) var(--space-4)",
                background: "var(--primary)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                cursor: "pointer",
                marginTop: "var(--space-2)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <RefreshCw size={13} />
              Retry Recommendation
            </button>
          </div>
        )}

        {/* Loaded Cards Grid: visible with Framer Motion reordering */}
        {response && response.designs.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "var(--space-6)",
              opacity: isRefetching ? 0.8 : 1,
              transition: "opacity 0.2s ease",
            }}
          >
            <AnimatePresence mode="popLayout">
              {response.designs.map((design) => {
                const isFirst = design.rank === 1;

                return (
                  <motion.div
                    key={design.id}
                    layout={!reduce}
                    initial={reduce ? undefined : { opacity: 0, scale: 0.96 }}
                    animate={reduce ? undefined : { opacity: 1, scale: 1 }}
                    exit={reduce ? undefined : { opacity: 0, scale: 0.95 }}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : {
                            layout: { type: "spring", stiffness: 340, damping: 28 },
                            opacity: { duration: 0.2 },
                          }
                    }
                    whileHover={reduce ? undefined : { y: -4, boxShadow: "0 16px 32px rgba(0,0,0,0.1)" }}
                    style={{
                      borderRadius: "var(--radius-xl)",
                      border: isFirst ? "2px solid var(--primary)" : "1.5px solid var(--border)",
                      background: "rgba(var(--surface-rgb), 0.8)",
                      padding: "var(--space-6)",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                    }}
                  >
                    {/* Header: Rank Badge & Archetype */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "var(--space-3)",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          background: isFirst ? "var(--primary)" : "var(--border)",
                          color: isFirst ? "#fff" : "var(--text)",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "var(--text-sm)",
                          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                        }}
                      >
                        {isFirst ? <Trophy size={16} /> : `#${design.rank}`}
                      </div>

                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "var(--radius-full)",
                          background: "rgba(var(--primary-rgb), 0.1)",
                          color: "var(--primary)",
                          border: "1px solid rgba(var(--primary-rgb), 0.2)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Layers size={11} />
                        {design.plan_archetype.replace("_", " ")}
                      </span>
                    </div>

                    {/* Design Title & Total Match Score */}
                    <div style={{ textAlign: "center", margin: "var(--space-2) 0 var(--space-4)" }}>
                      <h3
                        style={{
                          fontSize: "var(--text-lg)",
                          margin: "0 0 var(--space-2)",
                          fontWeight: 800,
                          color: "var(--text)",
                          minHeight: 48,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {design.name}
                      </h3>
                      <div
                        style={{
                          fontSize: "3rem",
                          fontWeight: 900,
                          color: "var(--text)",
                          lineHeight: 1,
                          letterSpacing: "-0.04em",
                        }}
                      >
                        <CountUpScore score={design.total} />
                      </div>
                      <div
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "var(--muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontWeight: 600,
                          marginTop: 4,
                        }}
                      >
                        Total Match
                      </div>
                    </div>

                    {/* Criteria Score Bars */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "var(--space-3)",
                        marginBottom: "var(--space-4)",
                      }}
                    >
                      {CRITERIA.map((crit) => {
                        const val = design.scores[crit.key] ?? 0;
                        return (
                          <div key={crit.key} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "var(--space-2)",
                                width: 120,
                                flexShrink: 0,
                                fontSize: "var(--text-xs)",
                                color: "var(--muted)",
                              }}
                            >
                              <crit.icon size={13} style={{ color: crit.color }} />
                              <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                {crit.label}
                              </span>
                            </div>
                            <div
                              style={{
                                flex: 1,
                                height: 7,
                                background: "var(--border)",
                                borderRadius: "var(--radius-full)",
                                overflow: "hidden",
                              }}
                            >
                              <motion.div
                                initial={reduce ? false : { width: 0 }}
                                animate={{ width: `${Math.min(100, Math.max(0, val))}%` }}
                                transition={{ duration: reduce ? 0 : 0.45 }}
                                style={{
                                  height: "100%",
                                  background: crit.color,
                                  borderRadius: "var(--radius-full)",
                                }}
                              />
                            </div>
                            <span
                              style={{
                                width: 28,
                                textAlign: "right",
                                fontSize: "var(--text-xs)",
                                fontWeight: 700,
                                color: "var(--text)",
                              }}
                            >
                              {Math.round(val)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Reasons / Bioclimatic Insights */}
                    {design.reasons && design.reasons.length > 0 && (
                      <div
                        style={{
                          background: "var(--bg)",
                          borderRadius: "var(--radius-md)",
                          padding: "var(--space-3) var(--space-4)",
                          marginBottom: "var(--space-5)",
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "var(--muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginBottom: 6,
                          }}
                        >
                          Bioclimatic Rationale
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: "var(--text-xs)", color: "var(--text)", lineHeight: 1.5 }}>
                          {design.reasons.map((r, rIdx) => (
                            <li key={rIdx} style={{ marginBottom: 3 }}>
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 2D & 3D Action Buttons */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "var(--space-3)",
                        marginTop: "auto",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onViewPlan?.(design.plan_archetype)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "var(--space-2)",
                          padding: "var(--space-2) var(--space-3)",
                          background: "var(--surface)",
                          color: "var(--text)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-lg)",
                          fontSize: "var(--text-xs)",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--primary)";
                          e.currentTarget.style.color = "var(--primary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--border)";
                          e.currentTarget.style.color = "var(--text)";
                        }}
                      >
                        <Eye size={15} />
                        <span>2D Plan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onViewShelter?.(design.plan_archetype)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "var(--space-2)",
                          padding: "var(--space-2) var(--space-3)",
                          background: isFirst ? "var(--primary)" : "var(--surface)",
                          color: isFirst ? "#fff" : "var(--text)",
                          border: isFirst ? "none" : "1px solid var(--border)",
                          borderRadius: "var(--radius-lg)",
                          fontSize: "var(--text-xs)",
                          fontWeight: 600,
                          cursor: "pointer",
                          boxShadow: isFirst ? "0 2px 6px rgba(var(--primary-rgb), 0.3)" : "none",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isFirst) {
                            e.currentTarget.style.borderColor = "var(--primary)";
                            e.currentTarget.style.color = "var(--primary)";
                          } else {
                            e.currentTarget.style.opacity = "0.9";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isFirst) {
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.color = "var(--text)";
                          } else {
                            e.currentTarget.style.opacity = "1";
                          }
                        }}
                      >
                        <Cuboid size={15} />
                        <span>3D Shelter</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Model Limitations Notice Footer */}
        <div
          style={{
            marginTop: "var(--space-6)",
            paddingTop: "var(--space-4)",
            borderTop: "1px dashed var(--border)",
            display: "flex",
            alignItems: "flex-start",
            gap: "var(--space-3)",
            color: "var(--muted)",
            fontSize: "var(--text-xs)",
            lineHeight: 1.5,
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2, color: "var(--muted)" }} />
          <div>
            <strong>Known Model Limitations:</strong> Training labels originate from rule-based heuristic scoring plus noise (<code>verified: false</code>). Catalogue architectural values are domain placeholders without real-world sensor validation. Recommendations serve as preliminary bioclimatic design guidance only.
          </div>
        </div>
      </div>
    </section>
  );
}

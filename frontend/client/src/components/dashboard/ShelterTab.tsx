import { useState, Suspense, useEffect, Component, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, staggerContainer } from "../../motion/variants";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useClimateZone } from "../../theme/ClimateThemeProvider";
import { useLocationContext } from "../../context/LocationContext";
import {
  Clock,
  Calendar,
  Sparkles,
  Layers,
  MapPin,
  CheckCircle2,
  Sliders,
  ChevronRight,
  SunMedium,
  Wind,
  Droplets,
  ThermometerSnowflake,
} from "lucide-react";
import {
  ActiveClimateArchetype,
  CLIMATE_SHELTER_CONFIGS,
  ClimateFeatureAnnotation,
  mapClassificationToArchetype,
} from "../../viz/climateShelterData";
import { getPlanForZone } from "../../mock/planData";
import { getSpec, type DesignSpecResponse } from "../../services/api";
import PlanSVG from "../../viz/PlanSVG";

// Direct import for instant 3D rendering
import ShelterCanvas from "../../viz/ShelterCanvas";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("WebGL / Canvas render error caught, falling back to 2D mock plan:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function CanvasSkeleton() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 560,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-4)",
          color: "#94a3b8",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.1)",
            borderTopColor: "var(--primary)",
            animation: "spin 1s linear infinite",
          }}
        />
        <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>
          Initializing 3D Climate Model Engine...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

export interface ShelterTabProps {
  selectedArchetype?: string | null;
}

export default function ShelterTab({ selectedArchetype }: ShelterTabProps = {}) {
  const reduce = useReducedMotion();
  const { zone: themeZone } = useClimateZone();
  const { analysis, location } = useLocationContext();

  // Climate classification from real backend response
  const detectedArchetype = mapClassificationToArchetype(
    analysis?.analysis.classification ?? (themeZone !== "NEUTRAL" ? themeZone : null),
    analysis?.flood.risk
  );

  // Check if selectedArchetype is valid in 3D configs
  const isRecognized3D = selectedArchetype
    ? Boolean(CLIMATE_SHELTER_CONFIGS[selectedArchetype.toUpperCase().replace(/[- ]/g, "_") as ActiveClimateArchetype])
    : true;

  // Allow user to toggle between auto detected and manual exploration
  const [selectedZone, setSelectedZone] = useState<ActiveClimateArchetype>(() => {
    if (selectedArchetype) {
      const key = selectedArchetype.toUpperCase().replace(/[- ]/g, "_") as ActiveClimateArchetype;
      if (CLIMATE_SHELTER_CONFIGS[key]) return key;
    }
    return detectedArchetype;
  });
  const [isAutoMode, setIsAutoMode] = useState(!selectedArchetype);

  // Sync with selectedArchetype prop when passed from 3D button
  useEffect(() => {
    if (selectedArchetype) {
      const key = selectedArchetype.toUpperCase().replace(/[- ]/g, "_") as ActiveClimateArchetype;
      if (CLIMATE_SHELTER_CONFIGS[key]) {
        setSelectedZone(key);
        setIsAutoMode(false);
      }
    }
  }, [selectedArchetype]);

  // Sync with backend analysis when it arrives (only if auto mode)
  useEffect(() => {
    if (isAutoMode) {
      setSelectedZone(detectedArchetype);
    }
  }, [detectedArchetype, isAutoMode]);

  const [time, setTime] = useState(12); // 12 PM
  const [month, setMonth] = useState(5); // June
  const [viewMode, setViewMode] = useState<"exterior" | "cutaway">("exterior");
  const [selectedFeature, setSelectedFeature] = useState<ClimateFeatureAnnotation | null>(null);

  // WebGL availability state
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);

  useEffect(() => {
    setWebGLSupported(isWebGLAvailable());
  }, []);

  // Shared parametric spec (same spec used by PlanSVG and ShelterCanvas)
  const [liveSpec, setLiveSpec] = useState<DesignSpecResponse | null>(null);
  const [isLoadingSpec, setIsLoadingSpec] = useState(false);
  const fallbackSpec = getPlanForZone(selectedZone);
  const planSpec = liveSpec ?? fallbackSpec;

  useEffect(() => {
    let isCancelled = false;
    setIsLoadingSpec(true);
    getSpec(selectedZone, undefined, { w: 14.0, l: 16.0, bedrooms: 2 })
      .then((res) => {
        if (!isCancelled) setLiveSpec(res);
      })
      .catch((err) => {
        console.warn("Could not fetch design spec for 3D model, using mock fallback:", err);
        if (!isCancelled) setLiveSpec(null);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingSpec(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedZone]);

  const activeConfig = CLIMATE_SHELTER_CONFIGS[selectedZone] || CLIMATE_SHELTER_CONFIGS.TEMPERATE;

  // Format time (e.g. 13.5 -> 1:30 PM)
  const formatTime = (t: number) => {
    const hrs = Math.floor(t);
    const mins = Math.round((t - hrs) * 60);
    const ampm = hrs >= 12 ? "PM" : "AM";
    const displayHrs = hrs % 12 === 0 ? 12 : hrs % 12;
    return `${displayHrs}:${mins.toString().padStart(2, "0")} ${ampm}`;
  };

  const locationTitle =
    analysis?.location.name || location?.name || "Selected Geographical Location";

  return (
    <motion.div
      variants={reduce ? undefined : staggerContainer}
      initial="hidden"
      animate="visible"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-6)",
        paddingBottom: "var(--space-8)",
      }}
    >
      {/* ---------------- Top Status / Climate Report Integration Header ---------------- */}
      <motion.div
        variants={reduce ? undefined : fadeUp}
        className="card"
        style={{
          padding: "var(--space-6)",
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.04) 0%, rgba(200, 85, 61, 0.04) 100%)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "var(--space-4)",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                background: "rgba(16, 185, 129, 0.12)",
                color: "#059669",
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                marginBottom: "var(--space-2)",
              }}
            >
              <Sparkles size={14} />
              CLIMATE REPORT 3D ADAPTATION ACTIVE
              {isLoadingSpec && (
                <span style={{ opacity: 0.7 }}>• Loading Spec…</span>
              )}
              {!isLoadingSpec && liveSpec && (
                <span style={{ opacity: 0.85 }}>• LIVE SPEC</span>
              )}
            </div>

            <h2 style={{ fontSize: "var(--text-2xl)", margin: "0 0 var(--space-2)", fontWeight: 800 }}>
              {activeConfig.name}
            </h2>
            <p style={{ color: "var(--muted)", margin: 0, fontSize: "var(--text-sm)", maxWidth: 650 }}>
              {activeConfig.subtitle}
            </p>

            {selectedArchetype && !isRecognized3D && (
              <div
                style={{
                  marginTop: "var(--space-3)",
                  padding: "var(--space-2) var(--space-3)",
                  background: "rgba(245, 158, 11, 0.1)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--text-xs)",
                  color: "#D97706",
                }}
              >
                Specific 3D interactive model is not available for archetype "<strong>{selectedArchetype}</strong>". Displaying nearest default model ({activeConfig.name}).
              </div>
            )}
          </div>

          {/* Location & Climate Badge */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2)",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                fontSize: "var(--text-sm)",
                color: "var(--text)",
                fontWeight: 600,
              }}
            >
              <MapPin size={16} color="var(--primary)" />
              {locationTitle}
            </div>

            {analysis && (
              <div
                style={{
                  display: "flex",
                  gap: "var(--space-3)",
                  fontSize: "var(--text-xs)",
                  color: "var(--muted)",
                  background: "var(--surface)",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                }}
              >
                <span>
                  Temp: <strong>{analysis.weather.temperature ?? "--"}°C</strong>
                </span>
                <span>•</span>
                <span>
                  Flood Risk: <strong>{analysis.flood.risk}</strong>
                </span>
                <span>•</span>
                <span>
                  Class: <strong>{analysis.analysis.classification}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Archetype Quick Selector */}
        <div
          style={{
            marginTop: "var(--space-5)",
            paddingTop: "var(--space-4)",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "var(--space-3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Sliders size={16} color="var(--muted)" />
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
              Climate Archetype:
            </span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
            {(
              [
                { id: "COLD", label: "Cold Alpine", icon: ThermometerSnowflake },
                { id: "HOT_DRY", label: "Hot-Dry Courtyard", icon: SunMedium },
                { id: "WARM_HUMID", label: "Warm-Humid Stilted", icon: Droplets },
                { id: "TEMPERATE", label: "Temperate Bio-Solar", icon: Wind },
                { id: "COMPOSITE", label: "Composite Hybrid", icon: Sparkles },
              ] as const
            ).map((opt) => {
              const isSelected = selectedZone === opt.id;
              const isDetected = detectedArchetype === opt.id;
              const Icon = opt.icon;

              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSelectedZone(opt.id);
                    setIsAutoMode(opt.id === detectedArchetype);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    padding: "6px 12px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                    background: isSelected ? "var(--primary)" : "var(--surface)",
                    color: isSelected ? "#ffffff" : "var(--text)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Icon size={14} />
                  <span>{opt.label}</span>
                  {isDetected && (
                    <span
                      style={{
                        fontSize: "9px",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        background: isSelected ? "rgba(255,255,255,0.25)" : "rgba(16, 185, 129, 0.2)",
                        color: isSelected ? "#ffffff" : "#059669",
                        fontWeight: 700,
                      }}
                    >
                      DETECTED
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ---------------- 3D Canvas + Real-Time Controls ---------------- */}
      <motion.div variants={reduce ? undefined : fadeUp} className="card" style={{ padding: "var(--space-6)" }}>
        {/* View mode & solar time controls */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-4)",
            marginBottom: "var(--space-4)",
          }}
        >
          {/* View Mode Toggle */}
          <div
            style={{
              display: "flex",
              background: "var(--bg)",
              padding: "3px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => setViewMode("exterior")}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                cursor: "pointer",
                background: viewMode === "exterior" ? "var(--surface)" : "transparent",
                color: viewMode === "exterior" ? "var(--text)" : "var(--muted)",
                boxShadow: viewMode === "exterior" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              Exterior Shell
            </button>
            <button
              onClick={() => setViewMode("cutaway")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "6px 14px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                cursor: "pointer",
                background: viewMode === "cutaway" ? "var(--surface)" : "transparent",
                color: viewMode === "cutaway" ? "var(--primary)" : "var(--muted)",
                boxShadow: viewMode === "cutaway" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              <Layers size={13} />
              Lift Roof (Interior Cutaway)
            </button>
          </div>

          {/* Interactive Hint */}
          <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)" }}>
            Tip: <strong>Click & drag</strong> to orbit 360° • <strong>Scroll</strong> to zoom • Click pins to inspect
          </span>
        </div>

        {/* 3D Canvas Box */}
        <div
          style={{
            height: 560,
            width: "100%",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            border: "1px solid var(--border)",
            position: "relative",
            background: "#0f172a",
          }}
        >
          {webGLSupported ? (
            <CanvasErrorBoundary
              fallback={
                <div style={{ width: "100%", height: "100%", padding: "var(--space-4)", background: "#f8fafc" }}>
                  <p style={{ color: "var(--muted)", fontSize: "var(--text-xs)", marginBottom: "var(--space-2)", textAlign: "center" }}>
                    WebGL unavailable — showing 2D plan view
                  </p>
                  <PlanSVG spec={planSpec} />
                </div>
              }
            >
              <Suspense fallback={<CanvasSkeleton />}>
                <ShelterCanvas
                  climateZone={selectedZone}
                  timeOfDay={time}
                  month={month}
                  viewMode={viewMode}
                  onSelectFeature={(feat) => setSelectedFeature(feat)}
                  spec={planSpec}
                />
              </Suspense>
            </CanvasErrorBoundary>
          ) : (
            <div style={{ width: "100%", height: "100%", padding: "var(--space-4)", background: "#f8fafc" }}>
              <p style={{ color: "var(--muted)", fontSize: "var(--text-xs)", marginBottom: "var(--space-2)", textAlign: "center" }}>
                WebGL not supported in this browser — showing 2D plan view
              </p>
              <PlanSVG spec={planSpec} />
            </div>
          )}

          {/* Active 3D Feature Detail Box Overlay */}
          <AnimatePresence>
            {selectedFeature && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                style={{
                  position: "absolute",
                  bottom: "var(--space-4)",
                  left: "var(--space-4)",
                  right: "var(--space-4)",
                  maxWidth: 420,
                  background: "rgba(15, 23, 42, 0.92)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(245, 158, 11, 0.5)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-4)",
                  color: "#ffffff",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
                  zIndex: 20,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "#F59E0B",
                      color: "#0f172a",
                    }}
                  >
                    {selectedFeature.tag}
                  </span>
                  <button
                    onClick={() => setSelectedFeature(null)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    ✕
                  </button>
                </div>
                <h4 style={{ margin: "0 0 4px", fontSize: "var(--text-sm)", fontWeight: 700 }}>
                  {selectedFeature.title}
                </h4>
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "#cbd5e1", lineHeight: 1.5 }}>
                  {selectedFeature.description}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sliders: Time & Month */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-6)",
            marginTop: "var(--space-5)",
            padding: "var(--space-4)",
            background: "var(--bg)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          {/* Time of Day */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--space-2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                }}
              >
                <Clock size={16} color="var(--primary)" /> Solar Angle / Time of Day
              </div>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--primary)" }}>
                {formatTime(time)}
              </span>
            </div>
            <input
              type="range"
              min="6"
              max="18"
              step="0.25"
              value={time}
              onChange={(e) => setTime(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "var(--primary)" }}
            />
          </div>

          {/* Month */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--space-2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                }}
              >
                <Calendar size={16} color="var(--primary)" /> Seasonal Solar Declination
              </div>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--primary)" }}>
                {MONTHS[Math.floor(month)]}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="11"
              step="0.1"
              value={month}
              onChange={(e) => setMonth(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "var(--primary)" }}
            />
          </div>
        </div>
      </motion.div>

      {/* ---------------- Architectural Strategies Breakdown Cards ---------------- */}
      <motion.div variants={reduce ? undefined : fadeUp} className="card" style={{ padding: "var(--space-6)" }}>
        <h3 style={{ fontSize: "var(--text-lg)", margin: "0 0 var(--space-2)", fontWeight: 700 }}>
          Climate-Adaptive Architectural Strategies
        </h3>
        <p style={{ color: "var(--muted)", margin: "0 0 var(--space-4)", fontSize: "var(--text-sm)" }}>
          These design solutions are physically embedded into the 3D model above to protect against localized environmental stress.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
          {activeConfig.architecturalStrategies.map((strat, idx) => (
            <div
              key={idx}
              style={{
                padding: "var(--space-4)",
                borderRadius: "var(--radius-md)",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "var(--space-3)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
                  <CheckCircle2 size={16} color="var(--primary)" />
                  <h4 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 700 }}>{strat.title}</h4>
                </div>
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--muted)", lineHeight: 1.5 }}>
                  {strat.description}
                </p>
              </div>

              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#059669",
                  background: "rgba(16, 185, 129, 0.08)",
                  padding: "4px 8px",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <ChevronRight size={12} />
                {strat.impact}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

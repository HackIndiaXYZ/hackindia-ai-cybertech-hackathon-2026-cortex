import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, AlertCircle, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { AnalysisResponse } from "../../services/analyzeService";
import { mapBackendClassificationToZone } from "../../utils/climateMapping";
import { VERNACULAR_DESIGNS, getFallbackSvg } from "../../data/vernacularDesigns";
import { useReducedMotion } from "../../hooks/useReducedMotion";

interface RecommendedDesignsSectionProps {
  analysis: AnalysisResponse | null;
  isLoading: boolean;
  analysisError: string | null;
}

export default function RecommendedDesignsSection({
  analysis,
  isLoading,
  analysisError,
}: RecommendedDesignsSectionProps) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  // Loading state
  if (isLoading) {
    return (
      <div
        className="card"
        style={{
          padding: "var(--space-6)",
          marginBottom: "var(--space-8)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-4)",
          background: "rgba(var(--surface-rgb), 0.6)",
        }}
      >
        <Loader2 size={24} style={{ color: "var(--primary)", animation: "spin 1s linear infinite" }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text)" }}>
            Discovering Vernacular Strategies...
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)" }}>
            Analyzing microclimate to recommend time-tested architectural typologies.
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (analysisError && !analysis) {
    return (
      <div
        className="card"
        style={{
          padding: "var(--space-5)",
          marginBottom: "var(--space-8)",
          border: "1px solid rgba(239, 68, 68, 0.25)",
          background: "rgba(239, 68, 68, 0.05)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
        }}
      >
        <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: "var(--text-sm)", color: "#EF4444" }}>
          Backend analysis unavailable. Could not load climate-adapted vernacular recommendations.
        </div>
      </div>
    );
  }

  // No analysis yet
  if (!analysis) {
    return null;
  }

  const classification = analysis.analysis.classification;
  const mappedZone = mapBackendClassificationToZone(classification);

  // Insufficient data or unmapped classification
  if (!mappedZone) {
    return (
      <div
        className="card"
        style={{
          padding: "var(--space-6)",
          marginBottom: "var(--space-8)",
          background: "rgba(var(--surface-rgb), 0.6)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
          <BookOpen size={20} style={{ color: "var(--primary)" }} />
          <h2 style={{ fontSize: "var(--text-xl)", margin: 0 }}>Recommended Vernacular Designs</h2>
        </div>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "var(--text-sm)", lineHeight: 1.5 }}>
          Is location ka climate: <strong>{classification || "Insufficient Data"}</strong>. Is classification ke liye specific traditional design match nahi mil paya.
        </p>
      </div>
    );
  }

  // Matching designs (max 3)
  const matchedDesigns = VERNACULAR_DESIGNS.filter((d) => d.climateZone === mappedZone).slice(0, 3);

  return (
    <section
      aria-label="Recommended Vernacular Designs"
      style={{
        marginBottom: "var(--space-8)",
      }}
    >
      <div className="card" style={{ padding: "var(--space-6)" }}>
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "var(--space-3)",
            marginBottom: "var(--space-5)",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                marginBottom: "var(--space-1)",
              }}
            >
              <Sparkles size={20} style={{ color: "var(--primary)" }} />
              <h2 style={{ fontSize: "var(--text-2xl)", margin: 0, letterSpacing: "-0.01em" }}>
                Recommended Vernacular Designs
              </h2>
            </div>
            <p
              style={{
                margin: 0,
                color: "var(--muted)",
                fontSize: "var(--text-sm)",
                lineHeight: 1.5,
              }}
            >
              Is location ka climate: <strong style={{ color: "var(--text)" }}>{classification}</strong> ({mappedZone}). Ye traditional designs is zone me kaam karte hain.
            </p>
          </div>

          <button
            onClick={() => navigate(`/library?zone=${encodeURIComponent(mappedZone)}`)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--primary)",
              padding: "var(--space-2) var(--space-4)",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <BookOpen size={14} />
            Browse Full Library
          </button>
        </div>

        {/* Designs Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "var(--space-5)",
          }}
        >
          {matchedDesigns.map((design) => (
            <motion.div
              key={design.id}
              whileHover={reduce ? undefined : { y: -4, boxShadow: "0 16px 32px rgba(0,0,0,0.1)" }}
              style={{
                borderRadius: "var(--radius-xl)",
                border: "1.5px solid var(--border)",
                background: "rgba(var(--surface-rgb), 0.8)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                transition: "all 0.2s ease",
              }}
            >
              {/* Image */}
              <div
                style={{
                  height: 160,
                  width: "100%",
                  overflow: "hidden",
                  position: "relative",
                  background: "rgba(0,0,0,0.05)",
                }}
              >
                <img
                  src={design.image}
                  alt={design.name}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = getFallbackSvg(design.climateZone, design.name);
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    background: "rgba(0,0,0,0.72)",
                    backdropFilter: "blur(6px)",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "var(--radius-full)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {design.climateZone}
                </span>
              </div>

              {/* Body */}
              <div
                style={{
                  padding: "var(--space-4)",
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                }}
              >
                <h3
                  style={{
                    fontSize: "var(--text-base)",
                    margin: "0 0 var(--space-1)",
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  {design.name}
                </h3>
                <p
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--muted)",
                    margin: "0 0 var(--space-3)",
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {design.shortDescription}
                </p>

                {/* Key features bullets */}
                <div style={{ marginBottom: "var(--space-4)", marginTop: "auto" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--muted)",
                      marginBottom: 4,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Key Passive Strategies:
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {design.keyPassiveFeatures.slice(0, 2).map((feat, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: "12px",
                          color: "var(--text)",
                        }}
                      >
                        <CheckCircle2 size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* View in Library button */}
                <button
                  onClick={() =>
                    navigate(
                      `/library?zone=${encodeURIComponent(mappedZone)}&design=${encodeURIComponent(design.id)}`
                    )
                  }
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "var(--space-2) var(--space-3)",
                    background: "var(--primary)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "var(--radius-lg)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "transform 0.15s, opacity 0.15s",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  <span>View in Library</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

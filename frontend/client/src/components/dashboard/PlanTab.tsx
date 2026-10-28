import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "../../motion/variants";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import PlanSVG from "../../viz/PlanSVG";
import { Download, Share2, Layers, ShieldAlert, Loader } from "lucide-react";
import { useToast } from "../Toast";
import { useLocationContext } from "../../context/LocationContext";
import { useClimateZone } from "../../theme/ClimateThemeProvider";
import { mapBackendClassificationToZone } from "../../utils/climateMapping";
import { getPlanForZone } from "../../mock/planData";
import { exportDxfFile } from "../../utils/dxfExport";
import { getSpec, DesignSpecResponse } from "../../services/api";

export interface PlanTabProps {
  selectedArchetype?: string | null;
}

export default function PlanTab({ selectedArchetype }: PlanTabProps = {}) {
  const reduce = useReducedMotion();
  const { showToast } = useToast();
  const { analysis, location } = useLocationContext();
  const { zone: themeZone } = useClimateZone();

  // Resolve active climate zone: prefer selectedArchetype if passed from 2D button,
  // fallback to backend classification, fallback to themeZone, fallback to COMPOSITE
  const backendZone = mapBackendClassificationToZone(analysis?.analysis?.classification);
  const activeZone = (
    selectedArchetype
      ? selectedArchetype.toUpperCase().replace(/[- ]/g, "_")
      : (backendZone ?? (themeZone !== "NEUTRAL" ? themeZone : "COMPOSITE"))
  );

  const fallbackSpec = getPlanForZone(activeZone);

  // Check if archetype is recognized in standard plan sets
  const isRecognizedArchetype = ["HOT_DRY", "WARM_HUMID", "COLD", "COMPOSITE", "TEMPERATE", "NEUTRAL"].includes(activeZone);

  const [liveSpec, setLiveSpec] = useState<DesignSpecResponse | null>(null);
  const [isLoadingSpec, setIsLoadingSpec] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setIsLoadingSpec(true);
    getSpec(activeZone, undefined, { w: 14.0, l: 16.0, bedrooms: 2 })
      .then((spec) => {
        if (!isCancelled) setLiveSpec(spec);
      })
      .catch((err) => {
        console.warn("Could not fetch live design spec, using local fallback:", err);
        if (!isCancelled) setLiveSpec(null);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingSpec(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeZone]);

  const planSpec = liveSpec ?? fallbackSpec;

  const zoneBadgeLabels: Record<string, { label: string; desc: string }> = {
    HOT_DRY: {
      label: "Hot & Dry Plan",
      desc: "Central courtyard design with high thermal mass, deep shading, and minimal external openings.",
    },
    "HOT DRY": {
      label: "Hot & Dry Plan",
      desc: "Central courtyard design with high thermal mass, deep shading, and minimal external openings.",
    },
    WARM_HUMID: {
      label: "Warm & Humid Plan",
      desc: "Cross-ventilation layout with linear room arrangement, wide verandahs, and elevated living zones.",
    },
    "WARM HUMID": {
      label: "Warm & Humid Plan",
      desc: "Cross-ventilation layout with linear room arrangement, wide verandahs, and elevated living zones.",
    },
    COLD: {
      label: "Cold Climate Plan",
      desc: "Compact southern solar envelope with northern buffer zones, insulated envelope, and windbreaks.",
    },
    COMPOSITE: {
      label: "Composite Plan",
      desc: "Balanced courtyard and seasonal living zones with adaptable openings for extreme temperature shifts.",
    },
    TEMPERATE: {
      label: "Temperate Plan",
      desc: "Generous east-west daylighting with open-plan indoor-outdoor integration and natural breeze capture.",
    },
  };

  const zoneInfo = zoneBadgeLabels[activeZone] ?? {
    label: `${activeZone} Plan`,
    desc: "Optimised room arrangement based on passive solar principles and microclimate analysis.",
  };

  const handleExportDXF = () => {
    try {
      exportDxfFile(planSpec, activeZone);
      const safeZone = activeZone.toLowerCase().replace(/[^a-z0-9]/g, "-");
      showToast(`Exported shelter-plan-${safeZone}.dxf successfully!`, "success");
    } catch (err) {
      console.error("DXF export failed:", err);
      showToast("Failed to generate DXF file.", "error");
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Share link copied to clipboard!", "success");
      } else {
        showToast("Clipboard unavailable in this browser.", "info");
      }
    } catch {
      showToast("Could not copy link.", "error");
    }
  };

  return (
    <motion.div
      variants={reduce ? undefined : staggerContainer}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)", paddingBottom: "var(--space-8)" }}
    >
      <motion.div variants={reduce ? undefined : fadeUp} className="card" style={{ padding: "var(--space-6)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "var(--space-6)",
            flexWrap: "wrap",
            gap: "var(--space-4)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)", flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "var(--text-xl)", margin: 0 }}>2D Spatial Layout</h2>
              <span
                style={{
                  background: "rgba(var(--primary-rgb), 0.12)",
                  color: "var(--primary)",
                  border: "1px solid rgba(var(--primary-rgb), 0.25)",
                  padding: "2px 10px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "12px",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Layers size={13} />
                {zoneInfo.label}
              </span>
              <span
                style={{
                  background: "rgba(245, 158, 11, 0.12)",
                  color: "#D97706",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "11px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                title="This architectural layout is a bioclimatic concept and not a stamped structural plan."
              >
                <ShieldAlert size={12} />
                Concept Only
              </span>
              {isLoadingSpec ? (
                <span
                  style={{
                    background: "rgba(var(--primary-rgb), 0.10)",
                    color: "var(--primary)",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "11px",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Loader size={12} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                  Updating...
                </span>
              ) : liveSpec ? (
                <span
                  style={{
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "#10B981",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}
                >
                  LIVE API
                </span>
              ) : (
                <span
                  style={{
                    background: "var(--border)",
                    color: "var(--muted)",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  demo data
                </span>
              )}
            </div>
            <p style={{ color: "var(--muted)", margin: 0, fontSize: "var(--text-sm)", maxWidth: 680 }}>
              {zoneInfo.desc} {location?.name ? `Adapted for ${location.name}.` : ""}
            </p>
          </div>

          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <button
              onClick={handleShare}
              style={{
                background: "var(--surface, #fff)",
                border: "1px solid var(--border)",
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                cursor: "pointer",
                color: "var(--text)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <Share2 size={16} /> Share
            </button>
            <button
              onClick={handleExportDXF}
              style={{
                background: "var(--primary)",
                border: "none",
                color: "#fff",
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(var(--primary-rgb), 0.3)",
              }}
            >
              <Download size={16} /> Export DXF
            </button>
          </div>
        </div>

        {/* Archetype notice if unknown */}
        {selectedArchetype && !isRecognizedArchetype && (
          <div
            style={{
              padding: "var(--space-3) var(--space-4)",
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "var(--radius-lg)",
              marginBottom: "var(--space-4)",
              fontSize: "var(--text-sm)",
              color: "#D97706",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ShieldAlert size={16} />
            <span>
              Specific 2D architectural drawing is not available for archetype "<strong>{selectedArchetype}</strong>". Displaying the standard baseline layout.
            </span>
          </div>
        )}

        {/* The SVG Container */}
        <div
          style={{
            background: "var(--bg)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            overflow: "hidden",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.02)",
            position: "relative",
          }}
        >
          <PlanSVG spec={planSpec} />
        </div>
      </motion.div>
    </motion.div>
  );
}

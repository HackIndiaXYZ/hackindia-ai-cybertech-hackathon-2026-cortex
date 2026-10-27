import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, AlertCircle, Info, Database, CheckCircle2 } from "lucide-react";
import { mockZoneRisk, type ZoneRiskData } from "../../mock/zoneRisk";
import { getZone, getRisk, type ZoneApiResponse, type ThermalRiskResponse } from "../../services/api";
import { useClimateZone } from "../../theme/ClimateThemeProvider";
import { staggerContainer, fadeUp } from "../../motion/variants";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useLocationContext } from "../../context/LocationContext";
import { mapToThemeZone } from "../../utils/climateMapping";

function CircularProgress({ value, label, color }: { value: number; label: string; color: string }) {
  const reduce = useReducedMotion();
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)" }}>
      <div style={{ position: "relative", width: 120, height: 120 }}>
        {/* Outer Glow */}
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle, ${color}20 0%, transparent 70%)` }} />
        
        <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)", position: "relative", zIndex: 1 }}>
          {/* Background Track */}
          <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--border)" strokeWidth="10" />
          {/* Animated Fill */}
          <motion.circle 
            cx="60" cy="60" r={radius} fill="none" 
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={reduce ? { strokeDashoffset: circumference - (value / 100) * circumference } : { strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: circumference - (value / 100) * circumference }}
            transition={{ duration: 1.8, ease: "easeOut", delay: 0.2 }}
            viewport={{ once: true }}
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <div style={{ fontWeight: 800, fontSize: "2rem", lineHeight: 1, color: "var(--text)" }}>{value}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", fontWeight: 600 }}>%</div>
        </div>
      </div>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--text)", fontWeight: 600, letterSpacing: "0.02em" }}>{label}</span>
    </div>
  );
}

function SemiCircleGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const reduce = useReducedMotion();
  const rotation = (value / 100) * 180 - 90; // -90 to +90 degrees

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)", width: 160 }}>
      <div style={{ position: "relative", width: 160, height: 80, overflow: "visible" }}>
        {/* Glow */}
        <div style={{ position: "absolute", bottom: 0, left: 20, right: 20, height: 60, background: `radial-gradient(ellipse at bottom, ${color}30 0%, transparent 70%)` }} />
        
        <svg width="160" height="80" viewBox="0 0 160 80" style={{ overflow: "visible" }}>
          {/* Background Track */}
          <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="var(--border)" strokeWidth="16" strokeLinecap="round" />
          {/* Colored Overlay (Faded) */}
          <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" opacity={0.2} />
        </svg>
        
        {/* Animated Needle */}
        <motion.div
          initial={reduce ? { rotate: rotation } : { rotate: -90 }}
          whileInView={{ rotate: rotation }}
          transition={{ type: "spring", stiffness: 50, damping: 12, delay: 0.3 }}
          viewport={{ once: true }}
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            width: 6,
            height: 65,
            background: "var(--text)",
            transformOrigin: "bottom center",
            marginLeft: -3,
            borderRadius: "6px 6px 0 0",
            boxShadow: "0 0 8px rgba(0,0,0,0.2)"
          }}
        />
        
        {/* Needle Base/Pivot */}
        <div style={{
          position: "absolute",
          bottom: -8,
          left: "50%",
          width: 24,
          height: 24,
          background: "var(--surface, #fff)",
          border: "4px solid var(--text)",
          borderRadius: "50%",
          marginLeft: -12,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }} />
      </div>
      <div style={{ textAlign: "center", marginTop: 12 }}>
        <div style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--text)" }}>{value}</div>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      </div>
    </div>
  );
}

export default function ZoneRiskTab() {
  const { analysis, location } = useLocationContext();
  const { setZone } = useClimateZone();
  const reduce = useReducedMotion();
  const [whyExpanded, setWhyExpanded] = useState(false);
  const [stampSettled, setStampSettled] = useState(false);

  const [riskData, setRiskData] = useState<ThermalRiskResponse | null>(null);
  const [zoneData, setZoneData] = useState<ZoneApiResponse | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const lat = analysis?.location?.latitude ?? location?.lat ?? 28.6139;
  const lon = analysis?.location?.longitude ?? location?.lon ?? 77.2090;

  const loadData = useCallback(() => {
    let isCancelled = false;

    Promise.allSettled([
      getZone(lat, lon),
      getRisk(lat, lon),
    ]).then(([zoneRes, riskRes]) => {
      if (isCancelled) return;

      if (zoneRes.status === "fulfilled") {
        setZoneData(zoneRes.value);
        setIsFallback(false);
        // Automatically switch theme when zone arrives
        setZone(mapToThemeZone(zoneRes.value.zone));
      } else {
        console.warn("Could not fetch 5-zone classification, using fallback:", zoneRes.reason);
        setIsFallback(true);
      }

      if (riskRes.status === "fulfilled") {
        setRiskData(riskRes.value);
      } else {
        console.warn("Could not fetch thermal risk assessment, using fallback:", riskRes.reason);
        setIsFallback(true);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [lat, lon, setZone]);

  useEffect(() => {
    const cleanup = loadData();
    return cleanup;
  }, [loadData]);

  // Build unified display data from live zone & risk or mock fallback
  const resolvedZone = zoneData?.zone ?? (analysis ? mapToThemeZone(analysis.analysis.classification) : mockZoneRisk.zone);

  const data: ZoneRiskData = riskData
    ? {
        zone: resolvedZone,
        confidence: riskData.confidence,
        heatStress: riskData.heatStress,
        coldStress: riskData.coldStress,
        whyNumbers: riskData.whyNumbers,
        explanation: riskData.explanation,
        ruleBasedZone: zoneData?.zone ?? riskData.ruleBasedZone,
        mlZone: riskData.mlZone,
      }
    : {
        ...mockZoneRisk,
        zone: resolvedZone,
        ruleBasedZone: resolvedZone,
        mlZone: resolvedZone,
        explanation: analysis
          ? `${analysis.analysis.summary} Flood risk: ${analysis.flood.risk}.`
          : mockZoneRisk.explanation,
        whyNumbers: analysis
          ? {
              avgSummerTemp: analysis.weather.temperature ?? mockZoneRisk.whyNumbers.avgSummerTemp,
              avgWinterTemp: mockZoneRisk.whyNumbers.avgWinterTemp,
              annualRainfall: mockZoneRisk.whyNumbers.annualRainfall,
            }
          : mockZoneRisk.whyNumbers,
      };

  // Trigger theme change AFTER the stamp settles, or immediately if reduced motion
  useEffect(() => {
    if (reduce) {
      setZone(mapToThemeZone(data.zone));
      setStampSettled(true);
    }
  }, [reduce, data.zone, setZone]);

  const zoneColors: Record<string, string> = {
    HOT_DRY: "#C8553D",
    WARM_HUMID: "#0F766E",
    COMPOSITE: "#F59E0B",
    TEMPERATE: "#22C55E",
    COLD: "#3B5B92",
  };
  const zColor = zoneColors[data.zone] || "#94A3B8";

  return (
    <motion.div
      variants={reduce ? undefined : staggerContainer}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)", paddingBottom: "var(--space-8)" }}
    >
      {/* Top Banner - Zone Stamp */}
      <div className="card" style={{ 
        display: "flex", flexDirection: "column", alignItems: "center", 
        padding: "var(--space-10) var(--space-6)", textAlign: "center", 
        overflow: "hidden", position: "relative",
        background: `linear-gradient(135deg, var(--surface) 0%, ${zColor}10 100%)`
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-6)" }}>
          <span style={{ color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "var(--text-sm)" }}>
            Identified Climate Zone
          </span>
          {isFallback ? (
            <span
              style={{
                background: "rgba(245, 158, 11, 0.12)",
                color: "#D97706",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                fontSize: "11px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Database size={11} />
              demo data
            </span>
          ) : (
            <span
              style={{
                background: "rgba(16, 185, 129, 0.12)",
                color: "#10B981",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.03em",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <CheckCircle2 size={12} />
              LIVE CLASSIFICATION
            </span>
          )}
        </div>
        
        <motion.div
          initial={reduce ? { scale: 1, opacity: 1 } : { scale: 3, opacity: 0, rotate: -15 }}
          animate={reduce ? {} : { scale: 1, opacity: 1, rotate: [-15, 5, -2, 0] }}
          transition={{ 
            duration: 0.8, 
            times: [0, 0.6, 0.8, 1],
            ease: "circOut"
          }}
          onAnimationComplete={() => {
            if (!reduce) {
              setZone(mapToThemeZone(data.zone));
              setStampSettled(true);
            }
          }}
          style={{
            border: `6px solid ${zColor}`,
            color: zColor,
            padding: "var(--space-4) var(--space-10)",
            borderRadius: "var(--radius-xl)",
            fontSize: "2.5rem",
            fontWeight: 900,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: "var(--space-6)",
            background: "rgba(255,255,255,0.8)",
            backdropFilter: "blur(4px)",
            boxShadow: stampSettled ? `0 8px 32px ${zColor}40` : "none",
            transformOrigin: "center"
          }}
        >
          {data.zone.replace("_", " & ")}
        </motion.div>
        
        <p style={{ color: "var(--text)", maxWidth: 640, fontSize: "var(--text-lg)", lineHeight: 1.6, margin: "0 0 var(--space-4)" }}>
          This zone determines your building's primary thermal strategy, material choices, and roof structure.
        </p>

        {/* Reason Line from getZone */}
        {zoneData?.reason && (
          <motion.div
            variants={reduce ? undefined : fadeUp}
            style={{
              padding: "var(--space-3) var(--space-5)",
              background: "rgba(0,0,0,0.03)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              maxWidth: 680,
              textAlign: "center",
              marginTop: "var(--space-2)",
            }}
          >
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text)", lineHeight: 1.5 }}>
              <b>Classification Rule:</b> {zoneData.reason}
            </span>
          </motion.div>
        )}

        {/* Matched Values Grid from getZone */}
        {zoneData?.values && (
          <motion.div
            variants={reduce ? undefined : fadeUp}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "var(--space-3)",
              marginTop: "var(--space-6)",
              width: "100%",
              maxWidth: 680,
            }}
          >
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600 }}>Hottest Max</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#EF4444" }}>{zoneData.values.hottest_month_max}°C</div>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600 }}>Coldest Min</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#3B82F6" }}>{zoneData.values.coldest_month_min}°C</div>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600 }}>Coldest Mean</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#6366F1" }}>{zoneData.values.coldest_month_mean}°C</div>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600 }}>Summer Humidity</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#10B981" }}>{zoneData.values.hot_season_humidity}%</div>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600 }}>Annual Rain</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0EA5E9" }}>{zoneData.values.annual_rain} mm</div>
            </div>
          </motion.div>
        )}

        {/* ML vs Rule Note */}
        {data.mlZone !== data.ruleBasedZone && (
          <motion.div 
            variants={reduce ? undefined : fadeUp}
            style={{ 
              marginTop: "var(--space-6)", padding: "var(--space-3) var(--space-5)", 
              background: "var(--surface)", border: "1px solid #F59E0B", color: "#B45309", borderRadius: "var(--radius-full)",
              display: "flex", alignItems: "center", gap: "var(--space-3)", fontSize: "var(--text-sm)",
              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.15)"
            }}
          >
            <AlertCircle size={18} color="#F59E0B" />
            <span>Rule-based heuristics suggest <b>{data.ruleBasedZone.replace("_", " & ")}</b>, but ML predicted <b>{data.zone.replace("_", " & ")}</b>.</span>
          </motion.div>
        )}
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-6)" }}>
        {/* Confidence Ring */}
        <motion.div variants={reduce ? undefined : fadeUp} className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "var(--space-8)" }}>
          <h3 style={{ marginBottom: "var(--space-8)", textAlign: "center" }}>Prediction Confidence</h3>
          <CircularProgress value={data.confidence} label="ML Confidence" color="var(--primary, #6366F1)" />
        </motion.div>

        {/* Risk Meters */}
        <motion.div variants={reduce ? undefined : fadeUp} className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "var(--space-8)" }}>
          <h3 style={{ marginBottom: "var(--space-8)", textAlign: "center" }}>Thermal Risk Profile</h3>
          <div style={{ display: "flex", gap: "var(--space-8)", flexWrap: "wrap", justifyContent: "center" }}>
            <SemiCircleGauge value={data.heatStress} label="Heat Stress" color="#EF4444" />
            <SemiCircleGauge value={data.coldStress} label="Cold Stress" color="#3B82F6" />
          </div>
        </motion.div>
      </div>

      {/* Expandable Why Panel */}
      <motion.div variants={reduce ? undefined : fadeUp} className="card" style={{ overflow: "hidden" }}>
        <button
          onClick={() => setWhyExpanded(!whyExpanded)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "var(--space-6) var(--space-8)", background: whyExpanded ? "rgba(0,0,0,0.02)" : "transparent", border: "none", cursor: "pointer",
            textAlign: "left", transition: "background 0.2s"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontSize: "var(--text-lg)", fontWeight: 600 }}>
            <div style={{ background: "var(--primary)20", padding: 8, borderRadius: "50%", display: "flex" }}>
              <Info size={24} color="var(--primary)" />
            </div>
            Why was this zone selected?
          </div>
          {whyExpanded ? <ChevronUp size={24} color="var(--muted)" /> : <ChevronDown size={24} color="var(--muted)" />}
        </button>

        <AnimatePresence>
          {whyExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div style={{ padding: "var(--space-2) var(--space-8) var(--space-8)", borderTop: "1px solid var(--border)" }}>
                <p style={{ marginTop: "var(--space-6)", fontSize: "var(--text-md)", lineHeight: 1.7, color: "var(--text)" }}>
                  {data.explanation}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)", marginTop: "var(--space-8)" }}>
                  <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "var(--space-5)", borderRadius: "var(--radius-lg)" }}>
                    <div style={{ color: "#991B1B", fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Avg Summer Temp</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "#EF4444" }}>{data.whyNumbers.avgSummerTemp}°C</div>
                  </div>
                  <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", padding: "var(--space-5)", borderRadius: "var(--radius-lg)" }}>
                    <div style={{ color: "#1E40AF", fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Avg Winter Temp</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "#3B82F6" }}>{data.whyNumbers.avgWinterTemp}°C</div>
                  </div>
                  <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "var(--space-5)", borderRadius: "var(--radius-lg)" }}>
                    <div style={{ color: "#065F46", fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Annual Rainfall</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "#10B981" }}>{data.whyNumbers.annualRainfall} mm</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}


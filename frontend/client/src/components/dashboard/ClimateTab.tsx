import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { mockClimateData, ClimateMonth } from "../../mock/climate";
import { staggerContainer, fadeUp } from "../../motion/variants";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { Thermometer, Droplets, AlertTriangle, RefreshCw, Database } from "lucide-react";
import { getClimate } from "../../services/api";
import { useLocationContext } from "../../context/LocationContext";

function CustomClimateChart({ data }: { data: ClimateMonth[] }) {
  const reduce = useReducedMotion();
  const maxRain = Math.ceil(Math.max(...data.map((d) => d.rain)) / 50) * 50 || 100;
  const maxTemp = Math.ceil(Math.max(...data.map((d) => d.temp)) / 10) * 10 || 40;
  
  const chartWidth = 1000;
  const chartHeight = 300;
  
  const svgPoints = data.map((d, i) => {
    const x = (i + 0.5) * (chartWidth / data.length);
    const y = chartHeight - (d.temp / maxTemp) * chartHeight;
    return { x, y };
  });

  const polylinePoints = svgPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div style={{ position: "relative", width: "100%", height: 350, display: "flex" }}>
      {/* Y-Axis Left (Temp) */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: chartHeight, paddingRight: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--muted)", textAlign: "right", width: 40, marginTop: 10 }}>
        <span>{maxTemp}&deg;</span>
        <span>{maxTemp / 2}&deg;</span>
        <span>0&deg;</span>
      </div>

      <div style={{ flex: 1, position: "relative", height: chartHeight, marginTop: 10 }}>
        {/* Horizontal Grid Lines */}
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ position: "absolute", top: `${(i / 2) * 100}%`, left: 0, right: 0, height: 1, background: "var(--border)", opacity: 0.5 }} />
        ))}
        
        {/* Bars (Rain) */}
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: "100%", position: "absolute", inset: 0 }}>
          {data.map((d, i) => {
            const hPct = (d.rain / maxRain) * 100;
            return (
              <div key={d.month} style={{ width: "6%", height: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                <motion.div
                  initial={reduce ? { height: `${hPct}%` } : { height: 0 }}
                  whileInView={{ height: `${hPct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
                  style={{
                    width: "100%",
                    background: "linear-gradient(to top, rgba(59, 130, 246, 0.4), rgba(59, 130, 246, 0.8))",
                    borderRadius: "4px 4px 0 0",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Line (Temp) */}
        <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
          <motion.polyline
            points={polylinePoints}
            fill="none"
            stroke="#EF4444"
            strokeWidth="4"
            initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            style={{ filter: "drop-shadow(0 4px 6px rgba(239, 68, 68, 0.3))" }}
          />
          {svgPoints.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="6"
              fill="#EF4444"
              stroke="var(--surface, #fff)"
              strokeWidth="2"
              initial={reduce ? { scale: 1 } : { scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: (i / data.length) * 1.5, type: "spring" }}
            />
          ))}
        </svg>

        {/* X-Axis Labels */}
        <div style={{ display: "flex", justifyContent: "space-around", position: "absolute", bottom: -30, left: 0, right: 0 }}>
          {data.map((d) => (
            <div key={d.month} style={{ width: "6%", textAlign: "center", fontSize: "var(--text-xs)", color: "var(--muted)", fontWeight: 500 }}>
              {d.month}
            </div>
          ))}
        </div>
      </div>

      {/* Y-Axis Right (Rain) */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: chartHeight, paddingLeft: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--muted)", width: 40, marginTop: 10 }}>
        <span>{maxRain}</span>
        <span>{maxRain / 2}</span>
        <span>0</span>
      </div>
    </div>
  );
}

function ClimateSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <div className="card" style={{ padding: "var(--space-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-6)" }}>
          <div style={{ width: 180, height: 24, background: "var(--border)", borderRadius: "var(--radius-sm)", opacity: 0.6 }} />
          <div style={{ width: 140, height: 20, background: "var(--border)", borderRadius: "var(--radius-sm)", opacity: 0.4 }} />
        </div>
        <div style={{ height: 320, background: "rgba(0,0,0,0.03)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "flex-end", gap: 16, padding: "var(--space-6)" }}>
          {[40, 55, 70, 85, 95, 80, 65, 60, 50, 45, 35, 30].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, background: "var(--border)", opacity: 0.4, borderRadius: "4px 4px 0 0" }} />
          ))}
        </div>
      </div>
      <div className="card" style={{ padding: "var(--space-6)" }}>
        <div style={{ width: 160, height: 24, background: "var(--border)", borderRadius: "var(--radius-sm)", opacity: 0.6, marginBottom: "var(--space-4)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ height: 40, background: "rgba(0,0,0,0.03)", borderRadius: "var(--radius-md)", opacity: 0.5 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ClimateTab() {
  const { analysis, location } = useLocationContext();
  const reduce = useReducedMotion();

  const [climateData, setClimateData] = useState<ClimateMonth[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState<boolean>(false);

  // Derive coordinates (prefer analysis location, then picker location, fallback to Delhi baseline)
  const lat = analysis?.location?.latitude ?? location?.lat ?? 28.6139;
  const lon = analysis?.location?.longitude ?? location?.lon ?? 77.2090;

  const loadClimateData = useCallback(() => {
    setIsLoading(true);
    setError(null);

    getClimate(lat, lon)
      .then((res) => {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const mapped: ClimateMonth[] = res.monthly_summary.map((m) => {
          const avg = m.avg_temp_mean ?? (m.avg_temp_max && m.avg_temp_min ? (m.avg_temp_max + m.avg_temp_min) / 2 : 20);
          return {
            month: monthNames[m.month - 1] ?? m.month_name.slice(0, 3),
            temp: Math.round(avg),
            minTemp: Math.round(m.avg_temp_min ?? avg - 5),
            maxTemp: Math.round(m.avg_temp_max ?? avg + 5),
            rain: Math.round(m.avg_rainfall ?? 0),
            humidity: Math.round(m.avg_humidity ?? 50),
          };
        });
        setClimateData(mapped);
        setIsFallback(false);
      })
      .catch((err) => {
        console.warn("Could not fetch live historical climate, falling back to mock:", err);
        setError("Live historical climate archive currently unavailable.");
        setClimateData(mockClimateData);
        setIsFallback(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [lat, lon]);

  useEffect(() => {
    loadClimateData();
  }, [loadClimateData]);

  if (isLoading && !climateData) {
    return <ClimateSkeleton />;
  }

  const data = climateData ?? mockClimateData;

  const tableRowVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <motion.div
      variants={reduce ? undefined : staggerContainer}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}
    >
      {/* Friendly Error banner if request failed but demo fallback is displayed */}
      {error && (
        <motion.div
          variants={reduce ? undefined : fadeUp}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--space-3) var(--space-4)",
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "var(--radius-md)",
            color: "#B45309",
            fontSize: "var(--text-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <AlertTriangle size={16} />
            <span>{error} Showing baseline reference data.</span>
          </div>
          <button
            onClick={loadClimateData}
            style={{
              background: "transparent",
              border: "1px solid #B45309",
              color: "#B45309",
              padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <RefreshCw size={12} /> Retry
          </button>
        </motion.div>
      )}

      {/* Chart Section */}
      <motion.div variants={reduce ? undefined : fadeUp} className="card" style={{ padding: "var(--space-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)", flexWrap: "wrap", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <h3 style={{ margin: 0 }}>Annual Climate Averages</h3>
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
                }}
              >
                HISTORICAL ARCHIVE
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "var(--text-sm)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--muted)" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#EF4444" }} />
              Avg Temp (&deg;C)
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--muted)" }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: "#3B82F6" }} />
              Rainfall (mm)
            </div>
          </div>
        </div>
        
        <CustomClimateChart data={data} />
        
        <div style={{ height: 20 }} /> {/* Spacer for X-axis */}
      </motion.div>

      {/* Table Section */}
      <motion.div variants={reduce ? undefined : fadeUp} className="card" style={{ padding: "var(--space-6)", overflowX: "auto" }}>
        <h3 style={{ marginBottom: "var(--space-4)" }}>Monthly Data Table</h3>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px", minWidth: 600 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--muted)", fontSize: "var(--text-sm)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <th style={{ padding: "0 var(--space-4) var(--space-2)", fontWeight: 600 }}>Month</th>
              <th style={{ padding: "0 var(--space-4) var(--space-2)", fontWeight: 600 }}>Avg Temp</th>
              <th style={{ padding: "0 var(--space-4) var(--space-2)", fontWeight: 600 }}>Min/Max Temp</th>
              <th style={{ padding: "0 var(--space-4) var(--space-2)", fontWeight: 600 }}>Rainfall</th>
              <th style={{ padding: "0 var(--space-4) var(--space-2)", fontWeight: 600 }}>Humidity</th>
            </tr>
          </thead>
          <motion.tbody
            variants={reduce ? undefined : {
              hidden: {},
              visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } }
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {data.map((row) => (
              <motion.tr 
                key={row.month} 
                variants={reduce ? undefined : tableRowVariants}
                style={{ background: "rgba(0,0,0,0.02)" }}
              >
                <td style={{ padding: "var(--space-3) var(--space-4)", fontWeight: 700, borderRadius: "var(--radius-md) 0 0 var(--radius-md)" }}>{row.month}</td>
                <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Thermometer size={16} color="#EF4444" />
                    <span style={{ fontWeight: 600 }}>{row.temp}&deg;C</span>
                  </div>
                </td>
                <td style={{ padding: "var(--space-3) var(--space-4)", color: "var(--muted)" }}>{row.minTemp}&deg; / {row.maxTemp}&deg;</td>
                <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Droplets size={16} color="#3B82F6" />
                    <span style={{ fontWeight: 600, color: "#3B82F6" }}>{row.rain} mm</span>
                  </div>
                </td>
                <td style={{ padding: "var(--space-3) var(--space-4)", borderRadius: "0 var(--radius-md) var(--radius-md) 0" }}>{row.humidity}%</td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </motion.div>
    </motion.div>
  );
}


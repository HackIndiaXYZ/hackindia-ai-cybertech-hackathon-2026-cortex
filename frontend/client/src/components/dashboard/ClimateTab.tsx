import { motion } from "framer-motion";
import { mockClimateData, ClimateMonth } from "../../mock/climate";
import { staggerContainer, fadeUp } from "../../motion/variants";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { Thermometer, Droplets } from "lucide-react";

function CustomClimateChart({ data }: { data: ClimateMonth[] }) {
  const reduce = useReducedMotion();
  const maxRain = Math.ceil(Math.max(...data.map((d) => d.rain)) / 50) * 50 || 100;
  const maxTemp = Math.ceil(Math.max(...data.map((d) => d.temp)) / 10) * 10 || 40;
  
  // Create line path points
  
  
  // We actually need a smoother bezier curve or just use precise pixel coordinates
  // It's easier to build SVG with viewbox 1000 300 for precise drawing.
  const chartWidth = 1000;
  const chartHeight = 300;
  
  const svgPoints = data.map((d, i) => {
    const x = (i + 0.5) * (chartWidth / data.length);
    const y = chartHeight - (d.temp / maxTemp) * chartHeight;
    return { x, y };
  });

  // Catmull-Rom or simple Bezier can be used, but straight lines with curve is easier with Recharts. 
  // Let's use simple SVG polyline for the line.
  const polylinePoints = svgPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div style={{ position: "relative", width: "100%", height: 350, display: "flex" }}>
      {/* Y-Axis Left (Temp) */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: chartHeight, paddingRight: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--muted)", textAlign: "right", width: 40, marginTop: 10 }}>
        <span>{maxTemp}�</span>
        <span>{maxTemp / 2}�</span>
        <span>0�</span>
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

export default function ClimateTab() {
  const data = mockClimateData;
  const reduce = useReducedMotion();

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
      {/* Chart Section */}
      <motion.div variants={reduce ? undefined : fadeUp} className="card" style={{ padding: "var(--space-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
          <h3 style={{ margin: 0 }}>Annual Climate Averages</h3>
          <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "var(--text-sm)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--muted)" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#EF4444" }} />
              Avg Temp (�C)
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
                    <span style={{ fontWeight: 600 }}>{row.temp}�C</span>
                  </div>
                </td>
                <td style={{ padding: "var(--space-3) var(--space-4)", color: "var(--muted)" }}>{row.minTemp}� / {row.maxTemp}�</td>
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


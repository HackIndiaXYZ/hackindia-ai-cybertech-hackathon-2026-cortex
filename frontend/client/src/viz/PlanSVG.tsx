import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlanSpec, mockPlanSpec } from "../mock/planData";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface PlanSVGProps {
  spec?: PlanSpec;
}

export default function PlanSVG({ spec = mockPlanSpec }: PlanSVGProps) {
  const reduce = useReducedMotion();
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  // Scale: 1 meter = 10 units in SVG space
  const S = 10;
  
  // Plot dimensions
  const plotW = spec.plotSize.w * S;
  const plotL = spec.plotSize.l * S;
  
  // ViewBox with ample padding for North arrow, legend, etc.
  const paddingX = 40;
  const paddingY = 60;
  const vbW = plotW + paddingX * 2;
  const vbH = plotL + paddingY * 2;
  const vb = `-${paddingX} -${paddingY - 20} ${vbW} ${vbH}`;

  const roomColors: Record<string, string> = {
    living: "rgba(251, 191, 36, 0.15)", // Amber
    bedroom: "rgba(59, 130, 246, 0.1)", // Blue
    kitchen: "rgba(239, 68, 68, 0.1)",  // Red
    bathroom: "rgba(16, 185, 129, 0.15)", // Green
    courtyard: "rgba(203, 213, 225, 0.3)", // Slate (open)
    corridor: "rgba(0,0,0,0.05)",
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 500 }}>
      {/* HTML Tooltip Overlay */}
      <AnimatePresence>
        {hoveredRoom && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "var(--surface, #fff)",
              padding: "var(--space-4)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              border: "1px solid var(--border)",
              maxWidth: 220,
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            {(() => {
              const r = spec.rooms.find((r) => r.id === hoveredRoom);
              if (!r) return null;
              return (
                <>
                  <div style={{ fontWeight: 700, fontSize: "var(--text-sm)", marginBottom: "var(--space-1)" }}>{r.name}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-2)" }}>{r.type}</div>
                  <div style={{ fontSize: "var(--text-sm)", lineHeight: 1.5 }}>{r.details}</div>
                  <div style={{ marginTop: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--primary)", fontWeight: 600 }}>
                    Size: {r.w}m × {r.l}m
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      <svg width="100%" height="100%" viewBox={vb} style={{ display: "block" }}>
        
        {/* Plot Boundary */}
        <rect
          x={0} y={0} width={plotW} height={plotL}
          fill="none" stroke="var(--border)" strokeWidth={1} strokeDasharray="4 4"
        />

        {/* Rooms Group */}
        <g>
          {spec.rooms.map((r, i) => (
            <g 
              key={r.id} 
              onMouseEnter={() => setHoveredRoom(r.id)}
              onMouseLeave={() => setHoveredRoom(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Room Fill Fade In */}
              <motion.rect
                x={r.x * S} y={r.y * S}
                width={r.w * S} height={r.l * S}
                fill={roomColors[r.type] || "transparent"}
                initial={reduce ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 + i * 0.15 }}
              />
              
              {/* Wall Line Drawing */}
              <motion.rect
                x={r.x * S} y={r.y * S}
                width={r.w * S} height={r.l * S}
                fill="none"
                stroke="var(--text)"
                strokeWidth={r.type === "courtyard" ? 1 : 2}
                strokeDasharray={r.type === "courtyard" ? "2 2" : "none"}
                initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut", delay: i * 0.1 }}
              />

              {/* Room Label */}
              <motion.text
                x={r.x * S + (r.w * S) / 2}
                y={r.y * S + (r.l * S) / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={4}
                fontWeight={600}
                fill="var(--text)"
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.5 + i * 0.1 }}
                style={{ pointerEvents: "none" }}
              >
                {r.name}
              </motion.text>
            </g>
          ))}
        </g>

        {/* Windows and Doors (Pop in after walls) */}
        <g>
          {spec.rooms.flatMap((r) => [
            ...r.windows.map((w, j) => (
              <motion.g
                key={`win-${r.id}-${j}`}
                initial={reduce ? { scale: 1 } : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 2.2 + j * 0.05 }}
                style={{ originX: `${(w.x + (w.orientation === "horizontal" ? w.width / 2 : 0)) * S}px`, originY: `${(w.y + (w.orientation === "vertical" ? w.width / 2 : 0)) * S}px` }}
              >
                {/* A window is a cyan rect over the wall */}
                <rect
                  x={(w.orientation === "horizontal" ? w.x : w.x - 0.1) * S}
                  y={(w.orientation === "vertical" ? w.y : w.y - 0.1) * S}
                  width={(w.orientation === "horizontal" ? w.width : 0.2) * S}
                  height={(w.orientation === "vertical" ? w.width : 0.2) * S}
                  fill="#06B6D4" // Cyan
                  opacity={0.7}
                />
              </motion.g>
            )),
            ...r.doors.map((d, k) => (
              <motion.g
                key={`door-${r.id}-${k}`}
                initial={reduce ? { scale: 1 } : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 2.5 + k * 0.05 }}
                style={{ originX: `${(d.x + (d.orientation === "horizontal" ? d.width / 2 : 0)) * S}px`, originY: `${(d.y + (d.orientation === "vertical" ? d.width / 2 : 0)) * S}px` }}
              >
                {/* A door is a white gap with a swing arc */}
                <rect
                  x={(d.orientation === "horizontal" ? d.x : d.x - 0.15) * S}
                  y={(d.orientation === "vertical" ? d.y : d.y - 0.15) * S}
                  width={(d.orientation === "horizontal" ? d.width : 0.3) * S}
                  height={(d.orientation === "vertical" ? d.width : 0.3) * S}
                  fill="var(--surface, #fff)" // Cuts out the wall
                />
                {/* Door leaf (the solid line) */}
                <line
                  x1={d.x * S} y1={d.y * S}
                  x2={(d.orientation === "horizontal" ? d.x : d.x - d.width) * S}
                  y2={(d.orientation === "vertical" ? d.y : d.y - d.width) * S}
                  stroke="var(--text)"
                  strokeWidth={1}
                />
                {/* Swing arc (dashed) */}
                <path
                  d={`M ${(d.orientation === "horizontal" ? d.x + d.width : d.x) * S} ${(d.orientation === "vertical" ? d.y + d.width : d.y) * S} A ${d.width * S} ${d.width * S} 0 0 1 ${(d.orientation === "horizontal" ? d.x : d.x - d.width) * S} ${(d.orientation === "vertical" ? d.y : d.y - d.width) * S}`}
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth={0.5}
                  strokeDasharray="1 1"
                />
              </motion.g>
            ))
          ])}
        </g>

        {/* North Arrow */}
        <motion.g
          initial={reduce ? { rotate: spec.orientation, opacity: 1 } : { rotate: 0, opacity: 0 }}
          animate={{ rotate: spec.orientation, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5, type: "spring" }}
          style={{ originX: `${-15}px`, originY: `${-10}px` }}
        >
          {/* Compass circle */}
          <circle cx={-15} cy={-10} r={6} fill="none" stroke="var(--border)" strokeWidth={0.5} />
          {/* Arrow */}
          <path d="M -15 -17 L -12 -8 L -15 -10 L -18 -8 Z" fill="var(--primary, #6366F1)" />
          <text x={-15} y={-19} fontSize={3} fontWeight={700} fill="var(--primary, #6366F1)" textAnchor="middle">N</text>
        </motion.g>

        {/* Scale Bar */}
        <g transform={`translate(${plotW - 20}, ${plotL + 15})`}>
          <line x1={0} y1={0} x2={20} y2={0} stroke="var(--text)" strokeWidth={0.5} />
          <line x1={0} y1={-1} x2={0} y2={1} stroke="var(--text)" strokeWidth={0.5} />
          <line x1={10} y1={-1} x2={10} y2={1} stroke="var(--text)" strokeWidth={0.5} />
          <line x1={20} y1={-1} x2={20} y2={1} stroke="var(--text)" strokeWidth={0.5} />
          <text x={0} y={4} fontSize={2.5} fill="var(--muted)" textAnchor="middle">0</text>
          <text x={10} y={4} fontSize={2.5} fill="var(--muted)" textAnchor="middle">1m</text>
          <text x={20} y={4} fontSize={2.5} fill="var(--muted)" textAnchor="middle">2m</text>
        </g>

        {/* Legend */}
        <g transform={`translate(${-25}, ${plotL + 10})`}>
          <text x={0} y={0} fontSize={3} fontWeight={700} fill="var(--text)">Legend</text>
          
          <rect x={0} y={4} width={4} height={2} fill="var(--text)" />
          <text x={6} y={6} fontSize={2.5} fill="var(--muted)">Solid Wall</text>
          
          <rect x={0} y={9} width={4} height={2} fill="#06B6D4" opacity={0.7} />
          <text x={6} y={11} fontSize={2.5} fill="var(--muted)">Window</text>
          
          <path d="M 0 16 L 4 16 A 4 4 0 0 0 0 12 L 0 16" fill="none" stroke="var(--text)" strokeWidth={0.5} />
          <path d="M 0 12 L 4 16" fill="none" stroke="var(--muted)" strokeDasharray="1 1" strokeWidth={0.5} />
          <text x={6} y={16} fontSize={2.5} fill="var(--muted)">Door Swing</text>
        </g>

        {/* Disclaimer */}
        <text x={plotW / 2} y={plotL + 25} textAnchor="middle" fontSize={3} fill="var(--muted)" fontStyle="italic">
          * Concept drawing, not a structural plan. Dimensions are indicative.
        </text>

      </svg>
    </div>
  );
}

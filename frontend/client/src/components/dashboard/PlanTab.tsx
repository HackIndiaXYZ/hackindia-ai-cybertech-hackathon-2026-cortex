import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "../../motion/variants";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import PlanSVG from "../../viz/PlanSVG";
import { Download, Share2 } from "lucide-react";
import { useToast } from "../Toast";

export default function PlanTab() {
  const reduce = useReducedMotion();
  const { showToast } = useToast();

  return (
    <motion.div
      variants={reduce ? undefined : staggerContainer}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)", paddingBottom: "var(--space-8)" }}
    >
      <motion.div variants={reduce ? undefined : fadeUp} className="card" style={{ padding: "var(--space-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
          <div>
            <h2 style={{ fontSize: "var(--text-xl)", margin: "0 0 var(--space-2)" }}>2D Spatial Layout</h2>
            <p style={{ color: "var(--muted)", margin: 0, fontSize: "var(--text-sm)" }}>
              Optimised room arrangement based on passive solar principles and your climate zone.
            </p>
          </div>
          
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <button 
              onClick={() => showToast("Share link copied to clipboard!", "success")}
              style={{
              background: "var(--bg)", border: "1px solid var(--border)", padding: "var(--space-2) var(--space-3)", 
              borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)", fontWeight: 600, display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer", color: "var(--text)"
            }}>
              <Share2 size={16} /> Share
            </button>
            <button 
              onClick={() => showToast("Exporting DXF format...", "info")}
              style={{
              background: "var(--primary)", border: "none", color: "#fff", padding: "var(--space-2) var(--space-3)", 
              borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)", fontWeight: 600, display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer"
            }}>
              <Download size={16} /> Export DXF
            </button>
          </div>
        </div>

        {/* The SVG Container */}
        <div style={{ 
          background: "var(--bg)", 
          borderRadius: "var(--radius-lg)", 
          border: "1px solid var(--border)",
          overflow: "hidden", // in case of zooming
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.02)"
        }}>
          <PlanSVG />
        </div>
      </motion.div>
    </motion.div>
  );
}

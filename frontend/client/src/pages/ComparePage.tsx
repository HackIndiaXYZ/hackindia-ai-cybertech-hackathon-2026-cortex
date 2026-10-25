import { useState } from "react";
import { motion } from "framer-motion";
import { pageVariants, staggerContainer, fadeUp } from "../motion/variants";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { mockDesigns, DesignModel } from "../mock/designs";
import { Heart, DollarSign, Shield, Leaf, CheckCircle2 } from "lucide-react";

const CRITERIA = [
  { key: "comfort" as const, label: "Comfort", icon: Heart, color: "#EF4444" },
  { key: "cost" as const, label: "Cost Efficiency", icon: DollarSign, color: "#10B981" },
  { key: "safety" as const, label: "Safety & Strength", icon: Shield, color: "#3B82F6" },
  { key: "sustainability" as const, label: "Sustainability", icon: Leaf, color: "#F59E0B" },
];

function CompareColumn({ design, otherDesign }: { design: DesignModel, otherDesign: DesignModel }) {
  const reduce = useReducedMotion();
  
  return (
    <motion.div variants={reduce ? undefined : fadeUp} className="card" style={{ padding: "var(--space-8)", flex: 1, minWidth: 300 }}>
      <h2 style={{ fontSize: "var(--text-2xl)", margin: "0 0 var(--space-2)" }}>{design.name}</h2>
      <p style={{ color: "var(--muted)", margin: "0 0 var(--space-8)", fontSize: "var(--text-sm)" }}>{design.description}</p>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        {CRITERIA.map(crit => {
          const score = design.scores[crit.key];
          const otherScore = otherDesign.scores[crit.key];
          const isWinner = score > otherScore;
          
          return (
            <div key={crit.key} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
                  <crit.icon size={16} color={crit.color} />
                  {crit.label}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: isWinner ? crit.color : "var(--text)" }}>{score}</span>
                  {isWinner && <CheckCircle2 size={16} color={crit.color} />}
                </div>
              </div>
              
              <div style={{ height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                <motion.div
                  initial={reduce ? { width: `${score}%` } : { width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  style={{ height: "100%", background: isWinner ? crit.color : "var(--muted)", borderRadius: 4 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "var(--space-8)", paddingTop: "var(--space-6)", borderTop: "1px solid var(--border)" }}>
        <h4 style={{ fontSize: "var(--text-sm)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: "var(--space-4)" }}>Key Characteristics</h4>
        <ul style={{ margin: 0, paddingLeft: "var(--space-4)", fontSize: "var(--text-sm)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {design.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export default function ComparePage() {
  const reduce = useReducedMotion();
  const [idxA, setIdxA] = useState(0);
  const [idxB, setIdxB] = useState(1);
  
  const designA = mockDesigns[idxA];
  const designB = mockDesigns[idxB];

  return (
    <motion.main
      variants={reduce ? undefined : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 1200, margin: "0 auto", paddingBottom: "100px" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-8)", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <h1 style={{ fontSize: "var(--text-3xl)", margin: 0 }}>Compare Designs</h1>
        
        <div style={{ display: "flex", gap: "var(--space-4)" }}>
          <select 
            value={idxA} 
            onChange={e => setIdxA(parseInt(e.target.value))}
            style={{ padding: "var(--space-2) var(--space-4)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg)", cursor: "pointer", fontWeight: 600 }}
          >
            {mockDesigns.map((d, i) => <option key={d.id} value={i} disabled={i === idxB}>{d.name}</option>)}
          </select>
          <span style={{ display: "flex", alignItems: "center", fontWeight: 700, color: "var(--muted)" }}>VS</span>
          <select 
            value={idxB} 
            onChange={e => setIdxB(parseInt(e.target.value))}
            style={{ padding: "var(--space-2) var(--space-4)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg)", cursor: "pointer", fontWeight: 600 }}
          >
            {mockDesigns.map((d, i) => <option key={d.id} value={i} disabled={i === idxA}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <motion.div 
        variants={reduce ? undefined : staggerContainer} 
        initial="hidden" 
        animate="visible"
        style={{ display: "flex", gap: "var(--space-8)", flexWrap: "wrap" }}
      >
        <CompareColumn design={designA} otherDesign={designB} />
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ 
            width: 40, height: 40, borderRadius: "50%", background: "var(--border)", color: "var(--muted)", 
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-sm)" 
          }}>
            VS
          </div>
        </div>

        <CompareColumn design={designB} otherDesign={designA} />
      </motion.div>
    </motion.main>
  );
}

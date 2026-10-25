import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants } from "../motion/variants";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { Flame, Snowflake, Waves, CloudLightning, Check } from "lucide-react";

type EmergencyType = "heatwave" | "coldwave" | "flood" | "storm";

const EMERGENCY_DATA: Record<EmergencyType, { title: string, icon: any, color: string, items: string[] }> = {
  heatwave: {
    title: "Heatwave Protocol",
    icon: Flame,
    color: "#EF4444",
    items: [
      "Deploy exterior shading (louvers/shutters) on East & West windows.",
      "Close all windows and blinds during peak daytime hours (10 AM - 4 PM).",
      "Open high vents or clerestory windows for stack ventilation at night.",
      "Activate misting systems in the courtyard (if available).",
      "Minimize use of heat-generating appliances indoors."
    ]
  },
  coldwave: {
    title: "Cold Wave Protocol",
    icon: Snowflake,
    color: "#3B82F6",
    items: [
      "Ensure all windows, doors, and vents are tightly sealed.",
      "Open South-facing blinds during the day to maximize solar gain.",
      "Close heavy insulated curtains immediately after sunset.",
      "Check that pipes in uninsulated areas are wrapped.",
      "Ensure backup heating systems have fuel/power."
    ]
  },
  flood: {
    title: "Flood Protocol",
    icon: Waves,
    color: "#06B6D4",
    items: [
      "Deploy sandbags or flood barriers at all ground-level entry points.",
      "Relocate critical equipment and valuables to the upper floor.",
      "Turn off main power and gas at the breaker/valve if water enters.",
      "Ensure drainage channels and gutters are completely clear of debris.",
      "Seal all lower-level vents and air bricks."
    ]
  },
  storm: {
    title: "Severe Storm Protocol",
    icon: CloudLightning,
    color: "#8B5CF6",
    items: [
      "Secure or bring inside all loose outdoor furniture and items.",
      "Close and latch all storm shutters over windows.",
      "Check roof ties and ensure no loose shingles or tiles.",
      "Prepare emergency power backup and battery banks.",
      "Stay in the innermost room away from large glazing."
    ]
  }
};

const TABS: EmergencyType[] = ["heatwave", "coldwave", "flood", "storm"];

function ProgressRing({ progress, color }: { progress: number, color: string }) {
  const reduce = useReducedMotion();
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div style={{ position: "relative", width: 80, height: 80 }}>
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="40" cy="40" r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />
        <motion.circle
          cx="40" cy="40" r={radius} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference}
          animate={reduce ? { strokeDashoffset: offset } : { strokeDashoffset: offset }}
          transition={{ duration: 0.8, type: "spring", bounce: 0 }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "var(--text-md)", fontWeight: 800, color: "var(--text)" }}>{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

export default function EmergencyPage() {
  const reduce = useReducedMotion();
  const [activeTab, setActiveTab] = useState<EmergencyType>("heatwave");
  
  // Track checked state per tab
  const [checkedItems, setCheckedItems] = useState<Record<EmergencyType, Set<number>>>({
    heatwave: new Set(),
    coldwave: new Set(),
    flood: new Set(),
    storm: new Set()
  });

  const toggleItem = (index: number) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev[activeTab]);
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      return { ...prev, [activeTab]: newSet };
    });
  };

  const data = EMERGENCY_DATA[activeTab];
  const progress = (checkedItems[activeTab].size / data.items.length) * 100;

  return (
    <motion.main
      variants={reduce ? undefined : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 1000, margin: "0 auto", paddingBottom: "100px", minHeight: "100vh" }}
    >
      <div style={{ marginBottom: "var(--space-8)" }}>
        <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 var(--space-2)" }}>Emergency Preparedness</h1>
        <p style={{ color: "var(--muted)", margin: 0 }}>Follow these calm, verified protocols to ensure structural integrity and thermal survival during extreme climate events.</p>
      </div>

      <div style={{ display: "flex", gap: "var(--space-2)", borderBottom: "1px solid var(--border)", marginBottom: "var(--space-8)", overflowX: "auto" }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab;
          const { icon: Icon, color, title } = EMERGENCY_DATA[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                display: "flex", alignItems: "center", gap: "var(--space-2)",
                padding: "var(--space-4) var(--space-6)",
                background: "transparent",
                border: "none",
                borderBottom: isActive ? `3px solid ${color}` : "3px solid transparent",
                color: isActive ? color : "var(--muted)",
                fontWeight: isActive ? 700 : 600,
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap"
              }}
            >
              <Icon size={18} />
              {title.split(" ")[0]}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          style={{ display: "flex", gap: "var(--space-8)", flexWrap: "wrap", alignItems: "flex-start" }}
        >
          {/* Progress Card */}
          <div className="card" style={{ padding: "var(--space-6)", display: "flex", alignItems: "center", gap: "var(--space-6)", minWidth: 300, background: `linear-gradient(135deg, var(--surface) 0%, ${data.color}10 100%)` }}>
            <ProgressRing progress={progress} color={data.color} />
            <div>
              <h2 style={{ margin: "0 0 var(--space-1)", fontSize: "var(--text-xl)", color: "var(--text)" }}>Readiness Level</h2>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "var(--text-sm)" }}>
                {checkedItems[activeTab].size} of {data.items.length} tasks completed
              </p>
            </div>
          </div>

          {/* Checklist */}
          <div style={{ flex: 1, minWidth: 300, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {data.items.map((item, index) => {
              const isChecked = checkedItems[activeTab].has(index);
              return (
                <motion.button
                  key={index}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  onClick={() => toggleItem(index)}
                  className="card"
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "var(--space-4)",
                    padding: "var(--space-5)",
                    border: isChecked ? `1px solid ${data.color}50` : "1px solid var(--border)",
                    background: isChecked ? `${data.color}08` : "var(--surface)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ 
                    width: 24, height: 24, borderRadius: "50%", 
                    border: isChecked ? `2px solid ${data.color}` : "2px solid var(--muted)",
                    background: isChecked ? data.color : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                    transition: "all 0.2s"
                  }}>
                    {isChecked && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                        <Check size={14} color="#fff" strokeWidth={3} />
                      </motion.div>
                    )}
                  </div>
                  <span style={{ 
                    fontSize: "var(--text-md)", 
                    color: isChecked ? "var(--muted)" : "var(--text)", 
                    textDecoration: isChecked ? "line-through" : "none",
                    lineHeight: 1.5,
                    transition: "color 0.2s"
                  }}>
                    {item}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.main>
  );
}

import { motion } from "framer-motion";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { Ghost, AlertOctagon } from "lucide-react";

interface EmptyStateProps {
  type?: "empty" | "error";
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export default function EmptyState({ type = "empty", title, description, actionText, onAction }: EmptyStateProps) {
  const reduce = useReducedMotion();
  const Icon = type === "empty" ? Ghost : AlertOctagon;
  const color = type === "empty" ? "var(--muted)" : "#EF4444";

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-10) var(--space-6)",
        textAlign: "center",
        background: "rgba(var(--surface-rgb), 0.5)",
        border: "2px dashed var(--border)",
        borderRadius: "var(--radius-lg)",
        minHeight: 300
      }}
    >
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: `var(--bg)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "var(--space-4)",
        color: color,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
      }}>
        <Icon size={40} />
      </div>
      
      <h3 style={{ fontSize: "var(--text-xl)", margin: "0 0 var(--space-2)", color: "var(--text)" }}>{title}</h3>
      <p style={{ color: "var(--muted)", maxWidth: 400, margin: "0 0 var(--space-6)", fontSize: "var(--text-md)" }}>
        {description}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          style={{
            background: type === "error" ? "#EF4444" : "var(--primary)",
            color: "#fff",
            border: "none",
            padding: "var(--space-3) var(--space-6)",
            borderRadius: "var(--radius-full)",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}
        >
          {actionText}
        </button>
      )}
    </motion.div>
  );
}

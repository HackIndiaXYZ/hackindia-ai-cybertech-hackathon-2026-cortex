/**
 * ZoneDebugSwitcher
 * -----------------------------------------------------------------
 * A small floating debug button (bottom-right corner) that expands
 * into a compact zone picker panel so you can test each climate
 * theme without needing DevTools.
 *
 * Uses Lucide icons and UTF-8 encoding.
 * -----------------------------------------------------------------
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { Sliders, Check } from "lucide-react";
import { useClimateZone } from "../theme/ClimateThemeProvider";
import type { ZoneOrNeutral } from "../types";

const ZONES: { id: ZoneOrNeutral; label: string; emoji: string; desc: string }[] = [
  { id: "NEUTRAL",    label: "Neutral",     emoji: "🌐", desc: "Default / loading" },
  { id: "HOT_DRY",    label: "Hot & Dry",   emoji: "🌵", desc: "Desert · Arid" },
  { id: "WARM_HUMID", label: "Warm Humid",  emoji: "🌴", desc: "Tropical · Coastal" },
  { id: "COMPOSITE",  label: "Composite",   emoji: "🌆", desc: "Mixed seasonal" },
  { id: "TEMPERATE",  label: "Temperate",   emoji: "🍃", desc: "Mild four-season" },
  { id: "COLD",       label: "Cold",        emoji: "❄️", desc: "Sub-arctic · Alpine" },
];

const ZONE_ACCENT: Record<ZoneOrNeutral, string> = {
  NEUTRAL:    "#0F766E",
  HOT_DRY:    "#C8553D",
  WARM_HUMID: "#38BDF8",
  COMPOSITE:  "#F59E0B",
  TEMPERATE:  "#22C55E",
  COLD:       "#BFE3F5",
};

export default function ZoneDebugSwitcher() {
  const { zone, setZone } = useClimateZone();
  const [open, setOpen]     = useState(false);
  const panelRef            = useRef<HTMLDivElement>(null);
  const toggleRef           = useRef<HTMLButtonElement>(null);

  /* Close on Escape */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      setOpen(false);
      toggleRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  /* Close when clicking outside */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) &&
          e.target !== toggleRef.current) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const accent = ZONE_ACCENT[zone] ?? "#0F766E";

  return (
    <div
      style={{
        position:   "fixed",
        bottom:     "var(--space-8, 2rem)",
        right:      "var(--space-6, 1.5rem)",
        zIndex:     9999,
        display:    "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap:        "var(--space-2, 0.5rem)",
        fontFamily: "var(--font-body, system-ui, sans-serif)",
      }}
      role="region"
      aria-label="Climate zone debug switcher"
    >
      {/* -- Zone panel -- */}
      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label="Select climate zone"
          style={{
            background:     "rgba(8, 12, 20, 0.94)",
            backdropFilter: "blur(18px) saturate(160%)",
            WebkitBackdropFilter: "blur(18px) saturate(160%)",
            borderRadius:   16,
            border:         `1px solid ${accent}55`,
            padding:        "12px 10px 10px",
            display:        "flex",
            flexDirection:  "column",
            gap:            4,
            minWidth:       210,
            boxShadow:      `0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px ${accent}22`,
            animation:      "dbg-slide-in 160ms ease",
          }}
        >
          {/* Label row */}
          <div
            style={{
              display:        "flex",
              alignItems:     "center",
              gap:            6,
              padding:        "2px 10px 8px",
              fontSize:       11,
              fontWeight:     700,
              letterSpacing:  "0.08em",
              textTransform:  "uppercase",
              color:          accent,
              borderBottom:   `1px solid rgba(255,255,255,0.1)`,
              marginBottom:   4,
            }}
          >
            <Sliders size={13} />
            <span>Theme Zone Switcher</span>
          </div>

          {ZONES.map(({ id, label, emoji, desc }) => {
            const isActive = zone === id;
            const ac = ZONE_ACCENT[id];
            return (
              <button
                key={id}
                role="menuitem"
                id={`zone-debug-${id}`}
                onClick={() => { setZone(id); setOpen(false); }}
                aria-pressed={isActive}
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  gap:            9,
                  padding:        "8px 10px",
                  borderRadius:   10,
                  border:         isActive ? `1px solid ${ac}66` : "1px solid transparent",
                  background:     isActive ? `${ac}22` : "transparent",
                  color:          isActive ? "#fff" : "rgba(255,255,255,0.75)",
                  fontSize:       13,
                  fontWeight:     isActive ? 600 : 400,
                  cursor:         "pointer",
                  textAlign:      "left",
                  transition:     "background 150ms ease, border-color 150ms ease, color 150ms ease",
                  width:          "100%",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.75)";
                  }
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 16, flexShrink: 0 }}>{emoji}</span>
                <span style={{ display: "flex", flexDirection: "column", gap: 0, flex: 1 }}>
                  <span>{label}</span>
                  <span style={{ fontSize: 10, opacity: 0.55, fontWeight: 400, lineHeight: 1.3 }}>{desc}</span>
                </span>
                {isActive && (
                  <Check size={14} color={ac} style={{ flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* -- Toggle button -- */}
      <button
        ref={toggleRef}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close zone switcher" : "Open zone switcher (debug)"}
        aria-expanded={open}
        aria-haspopup="menu"
        title="Debug: switch climate zone"
        id="zone-debug-toggle"
        style={{
          width:              42,
          height:             42,
          borderRadius:       "50%",
          border:             `1.5px solid ${accent}88`,
          background:         "rgba(8, 12, 20, 0.88)",
          backdropFilter:     "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          color:              accent,
          cursor:             "pointer",
          display:            "flex",
          alignItems:         "center",
          justifyContent:     "center",
          boxShadow:          `0 2px 14px rgba(0,0,0,0.45), 0 0 0 1px ${accent}33`,
          transition:         "opacity 200ms ease, transform 180ms ease, box-shadow 200ms ease",
          opacity:            open ? 1 : 0.75,
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          btn.style.opacity = "1";
          btn.style.boxShadow = `0 4px 20px rgba(0,0,0,0.55), 0 0 0 2px ${accent}66`;
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          btn.style.opacity = open ? "1" : "0.75";
          btn.style.boxShadow = `0 2px 14px rgba(0,0,0,0.45), 0 0 0 1px ${accent}33`;
        }}
      >
        <Sliders size={20} />
      </button>

      {/* Slide-in keyframe — injected once */}
      <style>{`
        @keyframes dbg-slide-in {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        #zone-debug-toggle:focus-visible {
          outline: 2px solid ${accent};
          outline-offset: 3px;
        }
        [id^="zone-debug-"]:focus-visible {
          outline: 2px solid ${accent};
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}

/**
 * LocationSearch
 * ------------------------------------------------------------------
 * Glass search card with:
 *  - Place autocomplete (mock data)
 *  - "Use my location" button with pulsing GPS icon
 *  - "Pick on map" link
 *  - Keyboard navigable dropdown
 * ------------------------------------------------------------------
 */
import { useState, useRef, useEffect, useId } from "react";
import { Search, MapPin, Navigation, Map, X, ArrowRight } from "lucide-react";
import { MOCK_LOCATIONS } from "../mock/locations";
import type { ZoneOrNeutral } from "../types";
import { useClimateZone } from "../theme/ClimateThemeProvider";
import { useNavigate } from "react-router-dom";

const ZONE_LABELS: Record<ZoneOrNeutral, string> = {
  NEUTRAL:    "Unknown",
  HOT_DRY:    "Hot & Dry",
  WARM_HUMID: "Warm & Humid",
  COMPOSITE:  "Composite",
  TEMPERATE:  "Temperate",
  COLD:       "Cold",
};

const ZONE_EMOJIS: Record<ZoneOrNeutral, string> = {
  NEUTRAL:    "??",
  HOT_DRY:    "??",
  WARM_HUMID: "??",
  COMPOSITE:  "??",
  TEMPERATE:  "??",
  COLD:       "??",
};

export default function LocationSearch() {
  const [query,      setQuery]      = useState("");
  const [results,    setResults]    = useState<typeof MOCK_LOCATIONS>([]);
  const [open,       setOpen]       = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [cursor,     setCursor]     = useState(-1);
  const [selected,   setSelected]   = useState<(typeof MOCK_LOCATIONS)[0] | null>(null);

  const inputRef   = useRef<HTMLInputElement>(null);
  const listRef    = useRef<HTMLUListElement>(null);
  const wrapRef    = useRef<HTMLDivElement>(null);
  const listboxId  = useId();
  const { setZone } = useClimateZone();
  const navigate   = useNavigate();

  /* -- Filter mock results -- */
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(() => {
      const q = query.toLowerCase();
      setResults(MOCK_LOCATIONS.filter((l) => l.name.toLowerCase().includes(q)).slice(0, 7));
      setOpen(true);
      setLoading(false);
      setCursor(-1);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  /* -- Close on click-outside -- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* -- Keyboard navigation -- */
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      if (cursor >= 0) pick(results[cursor]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setCursor(-1);
    }
  };

  const pick = (loc: (typeof MOCK_LOCATIONS)[0]) => {
    setSelected(loc);
    setQuery(loc.name);
    setOpen(false);
    setZone(loc.zone);
  };

  const clear = () => {
    setQuery("");
    setSelected(null);
    setZone("NEUTRAL");
    inputRef.current?.focus();
  };

  const useGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        // Mock: pick a random HOT_DRY location
        window.setTimeout(() => {
          const loc = MOCK_LOCATIONS[0];
          pick(loc);
          setGpsLoading(false);
        }, 800);
      },
      () => setGpsLoading(false),
    );
  };

  const goToDashboard = () => {
    if (selected) navigate("/dashboard");
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <div
        style={{
          background: "rgba(255, 255, 255, 0.14)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.28)",
          borderRadius: "var(--radius-2xl)",
          padding: "var(--space-5) var(--space-5)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.2) inset",
        }}
      >
        {/* -- Search input row -- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            background: "rgba(255,255,255,0.85)",
            borderRadius: "var(--radius-xl)",
            padding: "var(--space-3) var(--space-4)",
            border: "1.5px solid rgba(255,255,255,0.6)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          {loading ? (
            <LoadingSpinner />
          ) : (
            <Search size={18} style={{ color: "var(--primary)", flexShrink: 0 }} aria-hidden="true" />
          )}
          <input
            ref={inputRef}
            id="location-search"
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={cursor >= 0 ? `loc-opt-${cursor}` : undefined}
            autoComplete="off"
            placeholder="Search your city, region or country…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => { if (results.length > 0) setOpen(true); }}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "var(--text-base)",
              color: "#1A2E2B",
              fontFamily: "var(--font-body)",
              minWidth: 0,
            }}
          />
          {query && (
            <button
              onClick={clear}
              aria-label="Clear search"
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "#9CA3AF",
                display: "flex",
                padding: 2,
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* -- Dropdown results -- */}
        {open && results.length > 0 && (
          <ul
            id={listboxId}
            ref={listRef}
            role="listbox"
            aria-label="Location suggestions"
            style={{
              listStyle: "none",
              margin: "var(--space-2) 0 0",
              padding: 0,
              background: "rgba(255,255,255,0.96)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(0,0,0,0.06)",
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            }}
          >
            {results.map((loc, i) => (
              <li
                key={loc.id}
                id={`loc-opt-${i}`}
                role="option"
                aria-selected={cursor === i}
                onMouseDown={() => pick(loc)}
                onMouseEnter={() => setCursor(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  padding: "var(--space-3) var(--space-4)",
                  cursor: "pointer",
                  background: cursor === i ? "rgba(15,118,110,0.07)" : "transparent",
                  transition: "background 120ms ease",
                  borderBottom: i < results.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                }}
              >
                <MapPin size={15} style={{ color: "var(--primary)", flexShrink: 0 }} aria-hidden="true" />
                <span style={{ flex: 1, fontSize: "var(--text-sm)", color: "#1A2E2B", fontFamily: "var(--font-body)" }}>
                  {loc.name}
                </span>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--muted)",
                    background: "rgba(0,0,0,0.05)",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span aria-hidden="true">{ZONE_EMOJIS[loc.zone]}</span>
                  {ZONE_LABELS[loc.zone]}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* -- Selected zone badge -- */}
        {selected && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "var(--space-4)",
              padding: "var(--space-3) var(--space-4)",
              background: "rgba(255,255,255,0.18)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <span style={{ fontSize: 20 }} aria-hidden="true">{ZONE_EMOJIS[selected.zone]}</span>
              <div>
                <div style={{ fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Detected Zone</div>
                <div style={{ fontSize: "var(--text-sm)", color: "#fff", fontWeight: 700 }}>{ZONE_LABELS[selected.zone]}</div>
              </div>
            </div>
            <button
              onClick={goToDashboard}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                background: "var(--primary)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius-full)",
                padding: "var(--space-2) var(--space-4)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                transition: "opacity 150ms ease, transform 150ms ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              View Designs <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* -- Action row -- */}
        <div
          style={{
            display: "flex",
            gap: "var(--space-3)",
            marginTop: "var(--space-4)",
            flexWrap: "wrap",
          }}
        >
          {/* Use my location */}
          <button
            onClick={useGPS}
            disabled={gpsLoading}
            aria-label="Use my current location"
            style={{
              flex: 1,
              minWidth: 140,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--space-2)",
              background: "rgba(255,255,255,0.20)",
              border: "1px solid rgba(255,255,255,0.35)",
              borderRadius: "var(--radius-lg)",
              color: "#fff",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              padding: "var(--space-3) var(--space-4)",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              transition: "background 200ms ease, transform 150ms ease",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.30)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.20)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <span
              style={{
                display: "flex",
                animation: gpsLoading ? "gps-pulse 1.2s ease-in-out infinite" : "gps-ping 2s ease-in-out infinite",
              }}
              aria-hidden="true"
            >
              <Navigation size={16} />
            </span>
            {gpsLoading ? "Locating…" : "Use my location"}
          </button>

          {/* Pick on map */}
          <a
            href="/dashboard"
            style={{
              flex: 1,
              minWidth: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--space-2)",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: "var(--radius-lg)",
              color: "rgba(255,255,255,0.85)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              padding: "var(--space-3) var(--space-4)",
              textDecoration: "none",
              fontFamily: "var(--font-body)",
              transition: "background 200ms ease, color 200ms ease, transform 150ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.10)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <Map size={15} aria-hidden="true" /> Pick on map
          </a>
        </div>
      </div>

      {/* GPS / pulse keyframes injected once */}
      <style>{`
        @keyframes gps-ping {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.25); opacity: 0.7; }
        }
        @keyframes gps-pulse {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25%       { transform: scale(1.2) rotate(-10deg); }
          75%       { transform: scale(0.9) rotate(10deg); }
        }
      `}</style>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}>
      <circle cx={9} cy={9} r={7} stroke="var(--primary)" strokeWidth={2} strokeDasharray="30 14" strokeLinecap="round" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

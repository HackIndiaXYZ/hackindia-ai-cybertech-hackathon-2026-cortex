import { useState, useRef, useEffect, useCallback, useId } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  LayersControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  Search,
  MapPin,
  Navigation,
  AlertCircle,
  Loader2,
  Thermometer,
  Droplets,
  Waves,
  LayoutDashboard,
  RefreshCw,
  X,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

import { useLocationContext } from "../context/LocationContext";
import { useReducedMotion } from "../hooks/useReducedMotion";

// ---------------------------------------------------------------------------
// Custom pin icon
// ---------------------------------------------------------------------------
const createCustomIcon = (isBouncing: boolean) =>
  L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div class="marker-wrapper">
        <div class="marker-pin ${isBouncing ? "animate-bounce-drop" : ""}">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#C8553D" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        ${isBouncing ? '<div class="marker-ripple"></div>' : ""}
      </div>
    `,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
  });

// ---------------------------------------------------------------------------
// Sub-component: fires map.invalidateSize() on mount so the map fills its div
// ---------------------------------------------------------------------------
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

// ---------------------------------------------------------------------------
// Sub-component: map click → drop pin only (no navigate)
// ---------------------------------------------------------------------------
function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ---------------------------------------------------------------------------
// Sub-component: fly map to a coordinate imperatively
// ---------------------------------------------------------------------------
function FlyController({
  target,
}: {
  target: [number, number] | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, Math.max(map.getZoom(), 10), { duration: 1.4 });
    }
  }, [map, target]);
  return null;
}

// ---------------------------------------------------------------------------
// Nominatim search — real geocoding
// ---------------------------------------------------------------------------
interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: { country?: string; state?: string };
}

async function nominatimSearch(
  query: string,
  signal: AbortSignal
): Promise<NominatimResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}&addressdetails=1&limit=5`;
  const res = await fetch(url, {
    signal,
    headers: { "Accept-Language": "en" },
  });
  if (!res.ok) throw new Error("Nominatim error");
  return res.json();
}

// ---------------------------------------------------------------------------
// Flood risk colour
// ---------------------------------------------------------------------------
function floodColor(risk: string): string {
  switch (risk?.toLowerCase()) {
    case "high":
      return "#EF4444";
    case "moderate":
      return "#F59E0B";
    default:
      return "#22C55E";
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function LocationPicker() {
  // Search state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Map state
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [bouncing, setBouncing] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  // GPS
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [permissionDeniedGuide, setPermissionDeniedGuide] = useState(false);

  const { runAnalysis, resetAnalysis, analysis, isLoading, analysisError } =
    useLocationContext();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const listboxId = useId();

  // ---------------------------------------------------------------------------
  // Click-outside closes dropdown
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ---------------------------------------------------------------------------
  // Nominatim search with debounce + abort
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      if (searchAbortRef.current) searchAbortRef.current.abort();
      const ctrl = new AbortController();
      searchAbortRef.current = ctrl;
      setIsSearching(true);
      try {
        const res = await nominatimSearch(query, ctrl.signal);
        setSearchResults(res);
        setShowDropdown(true);
      } catch {
        // Ignore abort or network errors silently
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const triggerBounce = useCallback(() => {
    if (reduceMotion) return;
    setBouncing(false);
    setTimeout(() => setBouncing(true), 10);
  }, [reduceMotion]);

  const dropPin = useCallback(
    (lat: number, lon: number) => {
      setSelectedPos([lat, lon]);
      setFlyTarget([lat, lon]);
      triggerBounce();
      resetAnalysis();
      runAnalysis(lat, lon); // fire-and-forget — context handles abort
    },
    [triggerBounce, resetAnalysis, runAnalysis]
  );

  // ---------------------------------------------------------------------------
  // Map click handler (pin only, no navigate)
  // ---------------------------------------------------------------------------
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      dropPin(lat, lng);
    },
    [dropPin]
  );

  // ---------------------------------------------------------------------------
  // Search result selection
  // ---------------------------------------------------------------------------
  const handleSelectResult = useCallback(
    (r: NominatimResult) => {
      const lat = parseFloat(r.lat);
      const lon = parseFloat(r.lon);
      // Show a short clean name
      const shortName = r.display_name.split(",")[0];
      setQuery(shortName);
      setShowDropdown(false);
      dropPin(lat, lon);
    },
    [dropPin]
  );

  // ---------------------------------------------------------------------------
  // GPS & Automatic Location Fallback
  // ---------------------------------------------------------------------------
  const fallbackToIPLocation = useCallback(
    async (reasonMessage: string) => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (res.ok) {
          const data = await res.json();
          if (data.latitude && data.longitude) {
            const cityName = [data.city, data.region, data.country_name].filter(Boolean).join(", ");
            setQuery(cityName || `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`);
            dropPin(data.latitude, data.longitude);
            setGpsError(
              `Location auto-detected via IP: ${cityName || "Current Area"}. (Map par click karke exact pin adjust kar sakte hain)`
            );
            return true;
          }
        }
      } catch {
        // Fallback silently if network is offline
      }
      setGpsError(reasonMessage);
      return false;
    },
    [dropPin]
  );

  const requestGPS = useCallback(async () => {
    setGpsError(null);
    setPermissionDeniedGuide(false);
    setIsLocating(true);

    if (!navigator.geolocation) {
      await fallbackToIPLocation("Geolocation is not supported by your browser.");
      setIsLocating(false);
      return;
    }

    // Proactively check permission state if Permissions API is supported
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const status = await navigator.permissions.query({ name: "geolocation" });
        if (status.state === "denied") {
          setPermissionDeniedGuide(true);
          await fallbackToIPLocation("Browser me Location permission Blocked hai.");
          setIsLocating(false);
          return;
        }
      }
    } catch {
      // Ignore if permissions API is unsupported
    }

    // Call browser geolocation
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setIsLocating(false);
        setQuery(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        dropPin(latitude, longitude);
      },
      async (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionDeniedGuide(true);
        }
        await fallbackToIPLocation(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied in browser."
            : "GPS location timed out or unavailable."
        );
        setIsLocating(false);
      },
      {
        enableHighAccuracy: false, // Ensures fast Wi-Fi / IP resolution without requiring satellite GPS hardware
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  }, [dropPin, fallbackToIPLocation]);

  // ---------------------------------------------------------------------------
  // Framer variants
  // ---------------------------------------------------------------------------
  const listVariants = {
    hidden: { opacity: 0, scaleY: 0.9, transformOrigin: "top" },
    visible: { opacity: 1, scaleY: 1, transition: { staggerChildren: 0.06, duration: 0.2 } },
    exit: { opacity: 0, scaleY: 0.9, transition: { duration: 0.12 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: -8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: 8, scale: 0.97, transition: { duration: 0.2 } },
  };

  const showCard = !!selectedPos;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        width: "100%",
        maxWidth: 680,
        margin: "0 auto",
      }}
    >
      <style>{`
        /* ─── Marker CSS ─── */
        .marker-wrapper { position: relative; width: 28px; height: 40px; }
        .marker-pin { position: absolute; z-index: 2; transform-origin: bottom center; }
        .animate-bounce-drop {
          animation: bounce-drop 0.8s cubic-bezier(0.28, 0.84, 0.42, 1) forwards;
        }
        @keyframes bounce-drop {
          0%   { transform: translateY(-40px); opacity: 0; }
          40%  { transform: translateY(0);     opacity: 1; }
          60%  { transform: translateY(-12px); }
          80%  { transform: translateY(0); }
          90%  { transform: translateY(-4px); }
          100% { transform: translateY(0); }
        }
        .marker-ripple {
          position: absolute; bottom: -8px; left: -4px;
          width: 36px; height: 16px;
          background: rgba(200,85,61,0.6); border-radius: 50%;
          z-index: 1; opacity: 0;
          animation: ripple-expand 1.2s ease-out 0.3s forwards;
        }
        @keyframes ripple-expand {
          0%   { transform: scale(0.2); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0;   }
        }
        /* ─── Leaflet reset inside flex ─── */
        .leaflet-container {
          width: 100%; height: 100%;
          border-radius: var(--radius-xl);
          background: #eef2f5;
        }
        /* ─── Spinner ─── */
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .lp-spin { animation: spin 1s linear infinite; }
        /* ─── Layers control overrides ─── */
        .leaflet-control-layers {
          border-radius: var(--radius-lg) !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important;
          border: 1px solid rgba(0,0,0,0.08) !important;
          font-size: 13px;
        }
      `}</style>

      {/* ── GPS Status & Permission Guidance ── */}
      <AnimatePresence>
        {gpsError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2)",
              background: permissionDeniedGuide ? "rgba(245, 158, 11, 0.08)" : "rgba(16, 185, 129, 0.08)",
              color: permissionDeniedGuide ? "#B45309" : "#047857",
              padding: "var(--space-3) var(--space-4)",
              borderRadius: "var(--radius-lg)",
              border: `1px solid ${permissionDeniedGuide ? "rgba(245, 158, 11, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
              fontSize: "var(--text-sm)",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2)" }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, lineHeight: 1.45 }}>{gpsError}</div>
              <button
                onClick={() => {
                  setGpsError(null);
                  setPermissionDeniedGuide(false);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "inherit",
                  fontSize: "14px",
                  padding: 0,
                  opacity: 0.7,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {permissionDeniedGuide && (
              <div
                style={{
                  marginTop: "4px",
                  paddingTop: "6px",
                  borderTop: "1px dashed rgba(245, 158, 11, 0.3)",
                  fontSize: "var(--text-xs)",
                  color: "#92400E",
                  lineHeight: 1.5,
                }}
              >
                <strong>Permission Allow Kaise Karein?</strong><br />
                1. Browser ke URL bar me (left side par jahan <code>localhost:5173</code> likha hai) <strong>🔒 Lock ya Tune icon</strong> par click karein.<br />
                2. <strong>Location</strong> setting ko <strong>Allow</strong> karein aur page reload karein.<br />
                3. Ya phir aap neeche diye gaye <strong>Interactive Map par direct click</strong> karke bhi koi bhi location select kar sakte hain!
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search box (Nominatim) ── */}
      <div ref={wrapRef} style={{ position: "relative" }}>
        <div
          style={{
            display: "flex", alignItems: "center", gap: "var(--space-3)",
            background: "#fff",
            borderRadius: "var(--radius-xl)",
            padding: "var(--space-3) var(--space-4)",
            border: "1.5px solid rgba(0,0,0,0.1)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            zIndex: 1000, position: "relative",
          }}
        >
          {isLocating || isSearching ? (
            <Loader2 size={18} color="var(--primary)" className="lp-spin" />
          ) : (
            <Search size={18} color="var(--primary)" />
          )}

          <input
            type="text"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={listboxId}
            aria-autocomplete="list"
            placeholder="Search city, region, country…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
            style={{
              flex: 1, border: "none", outline: "none",
              background: "transparent",
              fontSize: "var(--text-base)",
              fontFamily: "var(--font-body)",
            }}
          />

          <button
            onClick={requestGPS}
            title="Use my location"
            style={{
              background: "rgba(200,85,61,0.1)", border: "none",
              padding: "var(--space-2)", borderRadius: "var(--radius-md)",
              cursor: "pointer", color: "#C8553D", display: "flex",
            }}
          >
            <Navigation size={18} />
          </button>
        </div>

        {/* ── Search dropdown ── */}
        <AnimatePresence>
          {showDropdown && searchResults.length > 0 && (
            <motion.ul
              id={listboxId}
              variants={listVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                position: "absolute", top: "100%", left: 0, right: 0,
                marginTop: "var(--space-2)",
                background: "#fff", borderRadius: "var(--radius-lg)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                listStyle: "none", padding: "var(--space-2) 0", margin: 0,
                zIndex: 1001, border: "1px solid rgba(0,0,0,0.05)",
                maxHeight: 280, overflowY: "auto",
              }}
            >
              {searchResults.map((r, i) => {
                const shortName = r.display_name.split(",")[0];
                const sub = r.display_name.split(",").slice(1, 3).join(",").trim();
                return (
                  <motion.li
                    key={`${r.lat}-${r.lon}-${i}`}
                    variants={itemVariants}
                    onClick={() => handleSelectResult(r)}
                    style={{
                      padding: "var(--space-3) var(--space-4)", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "var(--space-3)",
                      borderBottom: i < searchResults.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <MapPin size={16} color="#C8553D" />
                    <div>
                      <div style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>{shortName}</div>
                      {sub && (
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)" }}>{sub}</div>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* ── Map ── */}
      <div
        style={{
          height: 380, width: "100%",
          borderRadius: "var(--radius-xl)", overflow: "hidden",
          border: "1.5px solid rgba(0,0,0,0.1)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          position: "relative", zIndex: 1,
        }}
      >
        <MapContainer
          center={[22.5, 79]}
          zoom={5}
          minZoom={3}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <MapResizer />
          <MapClickHandler onMapClick={handleMapClick} />
          <FlyController target={flyTarget} />

          <LayersControl position="topright">
            {/* ── Street (Default) ── */}
            <LayersControl.BaseLayer checked name="Street">
              <TileLayer
                attribution="Tiles &copy; Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
            </LayersControl.BaseLayer>

            {/* ── Satellite ── */}
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                attribution="Tiles &copy; Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
            </LayersControl.BaseLayer>

            {/* ── Terrain ── */}
            <LayersControl.BaseLayer name="Terrain">
              <TileLayer
                attribution="Tiles &copy; Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {selectedPos && (
            <Marker position={selectedPos} icon={createCustomIcon(bouncing)} />
          )}
        </MapContainer>

        {/* Info hint */}
        {!selectedPos && (
          <div
            style={{
              position: "absolute", bottom: 16, left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(6px)",
              padding: "4px 14px", borderRadius: 20,
              fontSize: 12, fontWeight: 500, color: "#555",
              display: "flex", alignItems: "center", gap: 6,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              zIndex: 1000, pointerEvents: "none",
            }}
          >
            <MapPin size={13} /> Click anywhere on the map to drop a pin
          </div>
        )}
      </div>

      {/* ── Analysis Card (shown once pin is placed) ── */}
      <AnimatePresence>
        {showCard && (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              background: "#fff",
              borderRadius: "var(--radius-xl)",
              border: "1.5px solid rgba(0,0,0,0.08)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.07)",
              overflow: "hidden",
            }}
          >
            {/* Loading state */}
            {isLoading && (
              <div
                style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: "var(--space-3)",
                  padding: "var(--space-6)",
                }}
              >
                <Loader2
                  size={32}
                  style={{ color: "#C8553D", animation: "spin 1s linear infinite" }}
                />
                <span style={{ fontWeight: 600, color: "#C8553D", fontSize: "var(--text-sm)" }}>
                  Analysing environment…
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)" }}>
                  {selectedPos ? `${selectedPos[0].toFixed(4)}, ${selectedPos[1].toFixed(4)}` : ""}
                </span>
              </div>
            )}

            {/* Error state */}
            {analysisError && !isLoading && (
              <div
                style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: "var(--space-3)",
                  padding: "var(--space-6)",
                }}
              >
                <AlertCircle size={28} style={{ color: "#EF4444" }} />
                <span style={{ fontSize: "var(--text-sm)", color: "#EF4444", textAlign: "center", maxWidth: 320 }}>
                  {analysisError.includes("fetch") || analysisError.includes("Failed")
                    ? "Could not reach the backend. Make sure the server is running."
                    : analysisError}
                </span>
                <button
                  onClick={() => selectedPos && runAnalysis(selectedPos[0], selectedPos[1])}
                  style={{
                    display: "flex", alignItems: "center", gap: "var(--space-2)",
                    background: "#EF4444", color: "#fff",
                    border: "none", borderRadius: "var(--radius-lg)",
                    padding: "var(--space-2) var(--space-4)",
                    cursor: "pointer", fontWeight: 600, fontSize: "var(--text-sm)",
                  }}
                >
                  <RefreshCw size={15} /> Retry
                </button>
              </div>
            )}

            {/* Success state */}
            {analysis && !isLoading && (
              <div style={{ padding: "var(--space-5)" }}>
                {/* Location header */}
                <div
                  style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "var(--space-4)",
                    flexWrap: "wrap", gap: "var(--space-2)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <MapPin size={18} style={{ color: "#C8553D", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "var(--text-base)" }}>
                        {analysis.location.name ?? "Unknown Location"}
                      </div>
                      {analysis.location.country && (
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)" }}>
                          {analysis.location.country}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Classification badge */}
                  <span
                    style={{
                      background: "#C8553D", color: "#fff",
                      padding: "3px 12px", borderRadius: 20,
                      fontSize: 12, fontWeight: 700,
                      boxShadow: "0 2px 8px rgba(200,85,61,0.3)",
                    }}
                  >
                    {analysis.analysis.classification}
                  </span>
                </div>

                {/* Stats row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "var(--space-3)",
                    marginBottom: "var(--space-4)",
                  }}
                >
                  {[
                    {
                      icon: <Thermometer size={16} style={{ color: "#C8553D" }} />,
                      label: "Temperature",
                      value: analysis.weather.temperature != null
                        ? `${analysis.weather.temperature}°C`
                        : "N/A",
                    },
                    {
                      icon: <Droplets size={16} style={{ color: "#3B82F6" }} />,
                      label: "Humidity",
                      value: analysis.weather.humidity != null
                        ? `${analysis.weather.humidity}%`
                        : "N/A",
                    },
                    {
                      icon: <Waves size={16} style={{ color: floodColor(analysis.flood.risk) }} />,
                      label: "Flood Risk",
                      value: analysis.flood.risk,
                      valueColor: floodColor(analysis.flood.risk),
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      style={{
                        background: "rgba(0,0,0,0.025)",
                        borderRadius: "var(--radius-lg)",
                        padding: "var(--space-3)",
                        display: "flex", flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        {stat.icon}
                        <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>
                          {stat.label}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "var(--text-sm)", fontWeight: 700,
                          color: stat.valueColor ?? "var(--text)",
                        }}
                      >
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* View Full Dashboard button */}
                <button
                  onClick={() => navigate("/dashboard")}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: "var(--space-2)",
                    background: isLoading ? "rgba(200,85,61,0.4)" : "#C8553D",
                    color: "#fff", border: "none",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-3) var(--space-4)",
                    fontSize: "var(--text-sm)", fontWeight: 700,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    transition: "background 0.2s, transform 0.15s",
                    boxShadow: isLoading ? "none" : "0 4px 12px rgba(200,85,61,0.3)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  <LayoutDashboard size={16} />
                  View Full Dashboard
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants } from "../motion/variants";
import { useReducedMotion } from "../hooks/useReducedMotion";
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  MapPin,
  Search,
  AlertTriangle,
  Building2,
  Check,
} from "lucide-react";
import {
  VERNACULAR_DESIGNS,
  ClimateZone,
  getFallbackSvg,
} from "../data/vernacularDesigns";
import {
  getAllSearchableLocations,
  resolveLocationClimate,
  SearchableLocation,
  ClimateLookupResult,
} from "../data/locationClimateZones";
import {
  evaluateSuitability,
  rankDesignsBySuitability,
  SuitabilityResult,
} from "../utils/suitability";
import {
  getHinglishDescription,
  getHinglishWhyItWorks,
  getHinglishKeyFeatures,
  toHinglishReason,
  toHinglishLimitation,
} from "../data/vernacularHinglish";

const FILTER_OPTIONS: Array<"All" | ClimateZone> = [
  "All",
  "HOT DRY",
  "WARM HUMID",
  "COMPOSITE",
  "TEMPERATE",
  "COLD",
];

const STORAGE_KEY = "sheltersense_vernacular_location";

export default function LibraryPage() {
  const reduce = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const zoneParam = searchParams.get("zone");
  const designParam = searchParams.get("design");

  // Sync state with URL params
  const [filter, setFilter] = useState<"All" | ClimateZone>(() => {
    if (zoneParam && FILTER_OPTIONS.includes(zoneParam as ClimateZone)) {
      return zoneParam as ClimateZone;
    }
    return "All";
  });

  const [selectedId, setSelectedId] = useState<string | null>(designParam || null);
  const [highlightedId, setHighlightedId] = useState<string | null>(designParam || null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Searchable location selector state (persisted in localStorage, no default hardcoding)
  const [selectedLocation, setSelectedLocation] = useState<SearchableLocation | { name: string; lat?: number; lon?: number } | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save selection to localStorage
  const handleSelectLocation = (loc: SearchableLocation | null) => {
    setSelectedLocation(loc);
    setIsDropdownOpen(false);
    setSearchQuery("");
    try {
      if (loc) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  };

  // Resolved climate zone information for the selected location
  const resolvedLocation: ClimateLookupResult = useMemo(() => {
    if (!selectedLocation) {
      return {
        zone: null,
        source: null,
        nearestCity: null,
        isFallback: false,
        unclassified: true,
        message: "No location selected",
      };
    }
    return resolveLocationClimate(selectedLocation);
  }, [selectedLocation]);

  // All searchable locations for the autocomplete dropdown
  const searchableList = useMemo(() => getAllSearchableLocations(), []);

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return searchableList.slice(0, 8);
    const q = searchQuery.toLowerCase().trim();
    return searchableList
      .filter(
        (loc) =>
          loc.name.toLowerCase().includes(q) ||
          loc.cityName.toLowerCase().includes(q) ||
          loc.district.toLowerCase().includes(q) ||
          loc.state.toLowerCase().includes(q) ||
          (loc.zone && loc.zone.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [searchQuery, searchableList]);

  // When URL query params change (e.g. from deep link)
  useEffect(() => {
    if (zoneParam && FILTER_OPTIONS.includes(zoneParam as ClimateZone)) {
      setFilter(zoneParam as ClimateZone);
    }
    if (designParam) {
      setHighlightedId(designParam);
      const targetCard = cardRefs.current[designParam];
      if (targetCard) {
        setTimeout(() => {
          targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 150);
      }
    }
  }, [zoneParam, designParam]);

  const handleFilterChange = (newFilter: "All" | ClimateZone) => {
    setFilter(newFilter);
    const newParams = new URLSearchParams(searchParams);
    if (newFilter === "All") {
      newParams.delete("zone");
    } else {
      newParams.set("zone", newFilter);
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleSelectCard = (id: string) => {
    setSelectedId(id);
    setHighlightedId(id);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("design", id);
    setSearchParams(newParams, { replace: true });
  };

  const handleCloseModal = () => {
    setSelectedId(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("design");
    setSearchParams(newParams, { replace: true });
  };

  // Rank designs dynamically based on selected location & target zone
  const rankedItems = useMemo(() => {
    if (!resolvedLocation.zone || resolvedLocation.unclassified) {
      return VERNACULAR_DESIGNS.map((d) => ({
        ...d,
        suitability: evaluateSuitability(d, null, selectedLocation?.name),
      }));
    }
    const locationDisplayName =
      (selectedLocation as any)?.cityName ||
      selectedLocation?.name ||
      resolvedLocation.name ||
      "";
    return rankDesignsBySuitability(
      VERNACULAR_DESIGNS,
      resolvedLocation.zone,
      locationDisplayName
    );
  }, [resolvedLocation, selectedLocation]);

  // Filter ranked items according to active pill filter
  const filteredItems = useMemo(() => {
    if (filter === "All") {
      return rankedItems;
    }
    return rankedItems.filter(
      (item) => item.climateZone === filter || item.originClimateZone === filter
    );
  }, [rankedItems, filter]);

  const selectedItem = rankedItems.find((i) => i.id === selectedId);

  // Status badge styling helper
  const getStatusBadgeStyle = (status: SuitabilityResult["status"]) => {
    switch (status) {
      case "Suitable":
        return {
          bg: "rgba(16, 185, 129, 0.14)",
          color: "#059669",
          border: "1px solid rgba(16, 185, 129, 0.35)",
        };
      case "Partially suitable":
        return {
          bg: "rgba(245, 158, 11, 0.14)",
          color: "#d97706",
          border: "1px solid rgba(245, 158, 11, 0.35)",
        };
      case "Not suitable":
        return {
          bg: "rgba(239, 68, 68, 0.12)",
          color: "#dc2626",
          border: "1px solid rgba(239, 68, 68, 0.3)",
        };
      case "Not yet evaluated":
        return {
          bg: "rgba(100, 116, 139, 0.14)",
          color: "#475569",
          border: "1px solid rgba(100, 116, 139, 0.3)",
        };
      default:
        return {
          bg: "rgba(148, 163, 184, 0.1)",
          color: "var(--muted)",
          border: "1px solid var(--border)",
        };
    }
  };

  return (
    <motion.main
      variants={reduce ? undefined : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        padding: "var(--space-8) var(--space-6)",
        maxWidth: 1200,
        margin: "0 auto",
        paddingBottom: "100px",
        minHeight: "100vh",
      }}
    >
      {/* Page Header & Location Selector */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "var(--space-6)",
          flexWrap: "wrap",
          gap: "var(--space-6)",
        }}
      >
        <div style={{ flex: "1 1 500px" }}>
          <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 var(--space-2)" }}>
            Vernacular Library
          </h1>
          <p style={{ color: "var(--muted)", margin: 0, maxWidth: 640, lineHeight: 1.5 }}>
            Time-tested, zero-carbon architectural patterns from climate extremes.
            Select your Indian city or district to compute passive climate suitability
            under NBC 2016 / ECBC building standards.
          </p>
        </div>

        {/* Searchable Indian City / District Selector */}
        <div
          ref={dropdownRef}
          style={{
            position: "relative",
            minWidth: 320,
            maxWidth: 420,
            width: "100%",
            zIndex: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--bg)",
              border: "1.5px solid var(--border)",
              borderRadius: "var(--radius-xl)",
              padding: "8px 14px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
              transition: "border-color 0.2s",
            }}
          >
            <MapPin size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search Indian city or district..."
              value={
                isDropdownOpen
                  ? searchQuery
                  : selectedLocation
                  ? selectedLocation.name
                  : ""
              }
              onFocus={() => {
                setIsDropdownOpen(true);
                setSearchQuery("");
              }}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--text)",
                outline: "none",
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                width: "100%",
              }}
              aria-label="Search Indian city or district"
            />
            {selectedLocation && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectLocation(null);
                }}
                title="Clear selected location"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--muted)",
                  padding: 2,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={16} />
              </button>
            )}
            <Search size={16} color="var(--muted)" style={{ flexShrink: 0 }} />
          </div>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: 6,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-xl)",
                  boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
                  maxHeight: 280,
                  overflowY: "auto",
                  padding: "6px 0",
                  zIndex: 50,
                }}
              >
                <div
                  style={{
                    padding: "4px 12px 6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--muted)",
                  }}
                >
                  Verified NBC 2016 / ECBC Locations
                </div>
                {filteredLocations.map((loc) => {
                  const isSelected = selectedLocation?.name === loc.name;
                  return (
                    <div
                      key={loc.id}
                      onClick={() => handleSelectLocation(loc)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleSelectLocation(loc);
                        }
                      }}
                      style={{
                        padding: "8px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        background: isSelected
                          ? "rgba(var(--primary-rgb, 15, 118, 110), 0.1)"
                          : "transparent",
                        fontSize: "var(--text-sm)",
                        color: "var(--text)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background =
                            "rgba(var(--shadow-color), 0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{loc.name}</div>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                          {loc.isVerified
                            ? `${loc.zone} Zone (NBC/ECBC)`
                            : "Unlisted district (nearest city fallback)"}
                        </div>
                      </div>
                      {isSelected && <Check size={16} color="var(--primary)" />}
                    </div>
                  );
                })}
                {filteredLocations.length === 0 && (
                  <div
                    style={{
                      padding: "12px 14px",
                      fontSize: "var(--text-sm)",
                      color: "var(--muted)",
                      textAlign: "center",
                    }}
                  >
                    No matching Indian district found.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active location summary banner */}
          <div style={{ marginTop: 8, fontSize: "12px", minHeight: 22 }}>
            {selectedLocation ? (
              resolvedLocation.zone ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--text)",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--primary)",
                    }}
                  />
                  <span>
                    <strong>{resolvedLocation.zone}</strong> zone
                  </span>
                  {resolvedLocation.isFallback && (
                    <span
                      style={{
                        color: "var(--muted)",
                        background: "rgba(var(--shadow-color), 0.05)",
                        padding: "1px 6px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "11px",
                      }}
                    >
                      {resolvedLocation.fallbackText ||
                        `Nearest listed city: ${resolvedLocation.nearestCity}`}
                    </span>
                  )}
                  {resolvedLocation.source && !resolvedLocation.isFallback && (
                    <span style={{ color: "var(--muted)", fontSize: "11px" }}>
                      ({resolvedLocation.source})
                    </span>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#d97706",
                  }}
                >
                  <AlertTriangle size={14} />
                  <span>Climate zone not classified (ranking skipped)</span>
                </div>
              )
            ) : (
              <span style={{ color: "var(--muted)" }}>
                No location selected (showing global vernacular catalogue)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--space-6)",
          flexWrap: "wrap",
          gap: "var(--space-3)",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "var(--space-4)",
        }}
      >
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          {FILTER_OPTIONS.map((z) => (
            <button
              key={z}
              onClick={() => handleFilterChange(z)}
              style={{
                background: filter === z ? "var(--primary)" : "var(--bg)",
                color: filter === z ? "#fff" : "var(--text)",
                border: filter === z ? "none" : "1.5px solid var(--border)",
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: filter === z ? "0 2px 10px rgba(0,0,0,0.12)" : "none",
              }}
            >
              {z === "All" ? "All Designs" : z}
            </button>
          ))}
        </div>

        {resolvedLocation.zone && (
          <div
            style={{
              fontSize: "12px",
              color: "var(--primary)",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Sparkles size={14} /> Ranked for {resolvedLocation.zone} Climate
          </div>
        )}
      </div>

      {/* Cards Grid */}
      <motion.div
        layout={!reduce}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
          gap: "var(--space-6)",
        }}
      >
        <AnimatePresence>
          {filteredItems.map((item) => {
            const isHighlighted = highlightedId === item.id;
            const suitability = item.suitability;
            const badgeStyle = getStatusBadgeStyle(suitability.status);

            return (
              <motion.div
                layoutId={!reduce ? `card-${item.id}` : undefined}
                key={item.id}
                ref={(el) => (cardRefs.current[item.id] = el)}
                id={`design-${item.id}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                whileHover={
                  reduce
                    ? undefined
                    : { y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }
                }
                onClick={() => handleSelectCard(item.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleSelectCard(item.id);
                }}
                role="button"
                tabIndex={0}
                aria-label={`View details for ${item.name}`}
                className="card"
                style={{
                  cursor: "pointer",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  padding: 0,
                  border: isHighlighted
                    ? "2px solid var(--primary)"
                    : "1px solid var(--border)",
                  boxShadow: isHighlighted
                    ? "0 0 20px rgba(var(--primary-rgb, 15, 118, 110), 0.35)"
                    : undefined,
                  transition: "border 0.3s ease, box-shadow 0.3s ease",
                }}
              >
                {/* Image with fallback and fixed aspect ratio */}
                <div
                  style={{
                    width: "100%",
                    height: 200,
                    overflow: "hidden",
                    background: "rgba(0,0,0,0.05)",
                    position: "relative",
                  }}
                >
                  <motion.img
                    layoutId={!reduce ? `image-${item.id}` : undefined}
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = getFallbackSvg(item.climateZone, item.name);
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  {suitability.status === "Suitable" && (
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        background: "#059669",
                        color: "#fff",
                        padding: "3px 10px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "11px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                      }}
                    >
                      <Sparkles size={12} /> Top Match
                    </div>
                  )}
                </div>

                {/* Content body */}
                <div
                  style={{
                    padding: "var(--space-5)",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                  }}
                >
                  {/* Two separate labels required by Section 5: */}
                  {/* Label 1: Origin Climate Zone */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "var(--space-2)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--primary)",
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      ORIGIN: {item.originClimateZone || item.climateZone}
                    </div>
                  </div>

                  <motion.h3
                    layoutId={!reduce ? `title-${item.id}` : undefined}
                    style={{ margin: "0 0 var(--space-2)", fontSize: "var(--text-lg)" }}
                  >
                    {item.name}
                  </motion.h3>

                  <p
                    style={{
                      margin: "0 0 var(--space-4)",
                      color: "var(--muted)",
                      fontSize: "var(--text-sm)",
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.shortDescription}
                  </p>

                  {/* Label 2: Suitability for Selected Location */}
                  <div
                    style={{
                      marginTop: "auto",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-lg)",
                      background: badgeStyle.bg,
                      border: badgeStyle.border,
                      marginBottom: "var(--space-3)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--muted)",
                        }}
                      >
                        Suitability for Selected Location
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          color: badgeStyle.color,
                        }}
                      >
                        {selectedLocation && resolvedLocation.zone
                          ? suitability.status
                          : "No location"}
                      </span>
                    </div>

                    {/* Short Reason / Limitation text */}
                    {selectedLocation && resolvedLocation.zone ? (
                      <div style={{ fontSize: "12px", lineHeight: 1.4 }}>
                        {suitability.status === "Not yet evaluated" ? (
                          <div style={{ color: badgeStyle.color, fontWeight: 500 }}>
                            {suitability.reasons[0] ||
                              `Not yet evaluated for ${
                                (selectedLocation as any)?.cityName ||
                                selectedLocation.name
                              }`}
                          </div>
                        ) : (
                          <>
                            {suitability.reasons.length > 0 && (
                              <div
                                style={{
                                  color: "var(--text)",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                  marginBottom: 2,
                                }}
                              >
                                <strong>Strength:</strong> {suitability.reasons[0]}
                              </div>
                            )}
                            {suitability.limitations.length > 0 && (
                              <div
                                style={{
                                  color: "var(--muted)",
                                  fontSize: "11px",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                <strong>Note:</strong> {suitability.limitations[0]}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                        Select an Indian city or district to calculate climate suitability.
                      </div>
                    )}
                  </div>

                  {/* Passive feature badges */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    {item.keyPassiveFeatures.slice(0, 2).map((feat, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "11px",
                          background: "rgba(var(--shadow-color), 0.06)",
                          color: "var(--text)",
                          padding: "2px 8px",
                          borderRadius: "var(--radius-md)",
                          fontWeight: 500,
                        }}
                      >
                        {feat}
                      </span>
                    ))}
                    {item.keyPassiveFeatures.length > 2 && (
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--muted)",
                          padding: "2px 4px",
                          fontWeight: 600,
                        }}
                      >
                        +{item.keyPassiveFeatures.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedId && selectedItem && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--space-4)",
            }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(6px)",
              }}
              aria-hidden="true"
            />

            {/* Modal Dialog */}
            <motion.div
              layoutId={!reduce ? `card-${selectedItem.id}` : undefined}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              className="card"
              style={{
                position: "relative",
                zIndex: 1001,
                width: "100%",
                maxWidth: 680,
                maxHeight: "90vh",
                overflowY: "auto",
                padding: 0,
                borderRadius: "var(--radius-2xl)",
              }}
            >
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                aria-label="Close modal"
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  background: "rgba(0,0,0,0.6)",
                  border: "none",
                  color: "#fff",
                  padding: 8,
                  borderRadius: "50%",
                  cursor: "pointer",
                  zIndex: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} />
              </button>

              {/* Modal Image */}
              <div
                style={{
                  width: "100%",
                  height: 280,
                  background: "rgba(0,0,0,0.08)",
                  position: "relative",
                }}
              >
                <motion.img
                  layoutId={!reduce ? `image-${selectedItem.id}` : undefined}
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  onError={(e) => {
                    e.currentTarget.src = getFallbackSvg(
                      selectedItem.climateZone,
                      selectedItem.name
                    );
                  }}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              {/* Modal Details */}
              <div style={{ padding: "var(--space-8)" }}>
                {/* Dual Labels Header in Modal */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: "var(--space-2)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--primary)",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    ORIGIN CLIMATE ZONE: {selectedItem.originClimateZone || selectedItem.climateZone}
                  </div>

                  {selectedLocation && resolvedLocation.zone && (
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "var(--radius-full)",
                        ...getStatusBadgeStyle(selectedItem.suitability.status),
                      }}
                    >
                      {selectedItem.suitability.status.toUpperCase()}
                      {selectedItem.suitability.status !== "Not yet evaluated"
                        ? ` (${selectedItem.suitability.score}%)`
                        : ""}
                    </div>
                  )}
                </div>

                <motion.h2
                  id="modal-title"
                  layoutId={!reduce ? `title-${selectedItem.id}` : undefined}
                  style={{
                    margin: "0 0 var(--space-4)",
                    fontSize: "var(--text-3xl)",
                    lineHeight: 1.2,
                  }}
                >
                  {selectedItem.name}
                </motion.h2>

                <p
                  style={{
                    margin: "0 0 var(--space-6)",
                    color: "var(--text)",
                    fontSize: "var(--text-base)",
                    lineHeight: 1.6,
                  }}
                >
                  {getHinglishDescription(selectedItem.id, selectedItem.description)}
                </p>

                {/* Suitability Analysis Section in Modal */}
                {selectedLocation && resolvedLocation.zone && (
                  <div
                    style={{
                      background: "rgba(var(--shadow-color), 0.03)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-xl)",
                      padding: "var(--space-5)",
                      marginBottom: "var(--space-6)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "var(--text-sm)",
                        color: "var(--text)",
                        marginBottom: "var(--space-2)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Building2 size={16} color="var(--primary)" />
                      {selectedLocation.name} ({resolvedLocation.zone} Zone) ke liye suitability
                    </div>

                    {selectedItem.suitability.status === "Not yet evaluated" ? (
                      <p
                        style={{
                          margin: 0,
                          fontSize: "var(--text-sm)",
                          color: "var(--muted)",
                          lineHeight: 1.5,
                        }}
                      >
                        {selectedLocation.name} ke liye abhi evaluation baaki hai jab tak passive features assess nahi hote.
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {selectedItem.suitability.reasons.map((r, i) => (
                          <div
                            key={i}
                            style={{
                              fontSize: "var(--text-sm)",
                              color: "var(--text)",
                              display: "flex",
                              gap: 8,
                            }}
                          >
                            <span style={{ color: "#059669" }}>✓</span>
                            <span>{toHinglishReason(r)}</span>
                          </div>
                        ))}
                        {selectedItem.suitability.limitations.map((l, i) => (
                          <div
                            key={i}
                            style={{
                              fontSize: "var(--text-sm)",
                              color: "var(--muted)",
                              display: "flex",
                              gap: 8,
                            }}
                          >
                            <span style={{ color: "#d97706" }}>⚠</span>
                            <span>{toHinglishLimitation(l)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Verifiable Passive Features Matrix */}
                <div style={{ marginBottom: "var(--space-6)" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "var(--text-sm)",
                      fontWeight: 700,
                      color: "var(--text)",
                      marginBottom: "var(--space-3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    <ShieldCheck size={16} color="var(--primary)" />
                    Passive Architectural Features jo kaam aate hain
                  </div>
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: "var(--space-2)",
                    }}
                  >
                    {getHinglishKeyFeatures(selectedItem.id, selectedItem.keyPassiveFeatures).map((feature, i) => (
                      <li
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          fontSize: "var(--text-sm)",
                          color: "var(--text)",
                          background: "rgba(var(--shadow-color), 0.04)",
                          padding: "8px 12px",
                          borderRadius: "var(--radius-lg)",
                        }}
                      >
                        <CheckCircle2
                          size={16}
                          color="var(--primary)"
                          style={{ flexShrink: 0, marginTop: 2 }}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Why It Works / Climate Physics Explanation */}
                <div
                  style={{
                    background: "rgba(var(--primary-rgb, 15, 118, 110), 0.07)",
                    border: "1.5px solid rgba(var(--primary-rgb, 15, 118, 110), 0.2)",
                    borderRadius: "var(--radius-xl)",
                    padding: "var(--space-5)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "var(--text-sm)",
                      color: "var(--primary)",
                      marginBottom: "var(--space-2)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>💡</span> Apne origin climate me ye kaise kaam karta hai
                  </div>
                  <p
                    style={{
                      margin: 0,
                      color: "var(--text)",
                      fontSize: "var(--text-sm)",
                      lineHeight: 1.6,
                    }}
                  >
                    {getHinglishWhyItWorks(selectedItem.id, selectedItem.whyItWorks)}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}

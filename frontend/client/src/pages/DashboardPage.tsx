import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { pageVariants } from "../motion/variants";
import { useReducedMotion } from "../hooks/useReducedMotion";
import {
  CloudSun,
  Thermometer,
  AlertTriangle,
  ClipboardList,
  LayoutTemplate,
  DraftingCompass,
  Box,
  MapPin,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocationContext } from "../context/LocationContext";

const miniPinIcon = L.divIcon({
  className: "mini-map-marker",
  html: `
    <div style="position:relative; width:24px; height:32px; display:flex; align-items:center; justify-content:center;">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 24" fill="#C8553D" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </div>
  `,
  iconSize: [24, 32],
  iconAnchor: [12, 32],
});
import WeatherTab from "../components/dashboard/WeatherTab";
import ClimateTab from "../components/dashboard/ClimateTab";
import ZoneRiskTab from "../components/dashboard/ZoneRiskTab";
import RequirementsTab from "../components/dashboard/RequirementsTab";
import DesignsTab from "../components/dashboard/DesignsTab";
import PlanTab from "../components/dashboard/PlanTab";
import ShelterTab from "../components/dashboard/ShelterTab";

const TABS = [
  { id: "weather", label: "Weather", icon: CloudSun },
  { id: "climate", label: "Climate", icon: Thermometer },
  { id: "zone", label: "Zone & Risk", icon: AlertTriangle },
  { id: "requirements", label: "Requirements", icon: ClipboardList },
  { id: "designs", label: "Designs", icon: LayoutTemplate },
  { id: "plan", label: "Plan 2D", icon: DraftingCompass },
  { id: "shelter", label: "Shelter 3D", icon: Box },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const { location, analysis, isLoading, analysisError } = useLocationContext();
  const reduce = useReducedMotion();

  const coords: [number, number] | null = location
    ? [location.lat, location.lon]
    : analysis?.location
    ? [analysis.location.latitude, analysis.location.longitude]
    : null;

  return (
    <motion.main
      variants={reduce ? undefined : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 1200, margin: "0 auto", paddingBottom: "100px" }} // paddingBottom for mobile bar
    >
      {/* BACK TO MAP */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            background: "#fff",
            border: "1.5px solid var(--border)",
            padding: "var(--space-2) var(--space-4)",
            borderRadius: "var(--radius-lg)",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--text)",
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--primary)";
            e.currentTarget.style.color = "var(--primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text)";
          }}
        >
          <ArrowLeft size={16} />
          Back to Map
        </button>
      </div>

      {/* MINI-MAP CARD */}
      {coords && (
        <div
          style={{
            height: 180,
            width: "100%",
            borderRadius: "var(--radius-xl)",
            overflow: "hidden",
            border: "1.5px solid var(--border)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            marginBottom: "var(--space-6)",
            position: "relative",
          }}
        >
          <MapContainer
            key={`${coords[0]}-${coords[1]}`}
            center={coords}
            zoom={10}
            scrollWheelZoom={false}
            dragging={false}
            zoomControl={false}
            attributionControl={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
            <Marker position={coords} icon={miniPinIcon} />
          </MapContainer>
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 12,
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(6px)",
              padding: "4px 12px",
              borderRadius: "var(--radius-full)",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <MapPin size={13} style={{ color: "var(--primary)" }} />
            {coords[0].toFixed(4)}, {coords[1].toFixed(4)}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-8)", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <MapPin size={28} style={{ color: "var(--primary)" }} aria-hidden="true" />
          <h1 style={{ fontSize: "var(--text-3xl)", margin: 0 }}>
            {location?.name || "No Location Selected"}
          </h1>
        </div>
        
        {/* Backend status badges */}
        {isLoading && (
          <motion.div
            initial={reduce ? {} : { scale: 0.8, opacity: 0 }}
            animate={reduce ? {} : { scale: 1, opacity: 1 }}
            style={{
              background: "var(--border)",
              color: "var(--muted)",
              padding: "var(--space-2) var(--space-4)",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
            }}
          >
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
            Analysing…
          </motion.div>
        )}
        {analysisError && !isLoading && (
          <motion.div
            initial={reduce ? {} : { scale: 0.8, opacity: 0 }}
            animate={reduce ? {} : { scale: 1, opacity: 1 }}
            style={{
              background: "rgba(239,68,68,0.1)",
              color: "#EF4444",
              padding: "var(--space-2) var(--space-4)",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              border: "1px solid rgba(239,68,68,0.3)",
            }}
          >
            ⚠ Backend unavailable
          </motion.div>
        )}
        {analysis && !isLoading && (
          <motion.div
            initial={reduce ? {} : { scale: 0.8, opacity: 0 }}
            animate={reduce ? {} : { scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            style={{
              background: "var(--primary)",
              color: "var(--bg)",
              padding: "var(--space-2) var(--space-4)",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-sm)",
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(var(--primary-rgb), 0.3)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span>{analysis.analysis.classification}</span>
            <span style={{ fontSize: "10px", opacity: 0.8 }}>Flood: {analysis.flood.risk}</span>
          </motion.div>
        )}
        {location && !analysis && !isLoading && !analysisError && (
          <motion.div
            initial={reduce ? {} : { scale: 0.8, opacity: 0 }}
            animate={reduce ? {} : { scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            style={{
              background: "var(--primary)",
              color: "var(--bg)",
              padding: "var(--space-2) var(--space-4)",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-sm)",
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(var(--primary-rgb), 0.3)"
            }}
          >
            Zone: Detecting...
          </motion.div>
        )}
      </div>

      {/* DESKTOP TAB BAR */}
      <div 
        className="desktop-tabs"
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          marginBottom: "var(--space-8)",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE
        }}
      >
        <style>{`.desktop-tabs::-webkit-scrollbar { display: none; }`}</style>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                position: "relative",
                padding: "var(--space-4) var(--space-6)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: isActive ? "var(--primary)" : "var(--muted)",
                fontWeight: isActive ? 600 : 500,
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                whiteSpace: "nowrap",
                transition: "color 0.2s"
              }}
            >
              <Icon size={18} />
              {tab.label}
              
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  style={{
                    position: "absolute",
                    bottom: -1,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: "var(--primary)",
                    borderRadius: "3px 3px 0 0"
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* MOBILE BOTTOM BAR */}
      <div
        className="mobile-tabs"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          padding: "var(--space-2) var(--space-4)",
          paddingBottom: "calc(var(--space-2) + env(safe-area-inset-bottom))",
          zIndex: 1000,
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <style>{`
          .mobile-tabs { display: none !important; }
          @media (max-width: 768px) {
            .mobile-tabs { display: flex !important; }
            .desktop-tabs { display: none !important; }
          }
        `}</style>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={`mob-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                background: "transparent",
                border: "none",
                color: isActive ? "var(--primary)" : "var(--muted)",
                minWidth: 60,
                padding: "var(--space-2)",
                position: "relative"
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: "10px", fontWeight: isActive ? 600 : 500 }}>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="mobileTabIndicator"
                  style={{
                    position: "absolute",
                    top: -4,
                    width: 4,
                    height: 4,
                    background: "var(--primary)",
                    borderRadius: "50%"
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT (INSTANT PERSISTENT PANELS — ZERO RELOAD) */}
      <div className="tab-content-container" style={{ position: "relative", minHeight: 400 }}>
        <div style={{ display: activeTab === "weather" ? "block" : "none" }}>
          <WeatherTab />
        </div>
        <div style={{ display: activeTab === "climate" ? "block" : "none" }}>
          <ClimateTab />
        </div>
        <div style={{ display: activeTab === "zone" ? "block" : "none" }}>
          <ZoneRiskTab />
        </div>
        <div style={{ display: activeTab === "requirements" ? "block" : "none" }}>
          <RequirementsTab />
        </div>
        <div style={{ display: activeTab === "designs" ? "block" : "none" }}>
          <DesignsTab />
        </div>
        <div style={{ display: activeTab === "plan" ? "block" : "none" }}>
          <PlanTab />
        </div>
        <div style={{ display: activeTab === "shelter" ? "block" : "none" }}>
          <ShelterTab />
        </div>
      </div>
    </motion.main>
  );
}


import { Link } from "react-router-dom";
import {
  Compass,
  ArrowUp,
  Shield,
  Layers,
  Wind,
  Sun,
  Droplets,
} from "lucide-react";
import { useClimateZone } from "../theme/ClimateThemeProvider";

export default function Footer() {
  const { zone } = useClimateZone();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      aria-label="Website Footer"
      style={{
        borderTop: "1px solid var(--border)",
        background: "rgba(var(--surface-rgb), 0.85)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        color: "var(--text)",
        position: "relative",
        zIndex: 10,
        marginTop: "auto",
      }}
    >
      {/* Main Footer Container */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "var(--space-12) var(--space-6) var(--space-8)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "var(--space-8)",
            marginBottom: "var(--space-10)",
          }}
        >
          {/* Column 1: Brand & Mission */}
          <div style={{ maxWidth: 320 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                marginBottom: "var(--space-3)",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-md)",
                  background: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <Compass size={18} strokeWidth={2.2} />
              </div>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: "var(--weight-extrabold)",
                  fontSize: "var(--text-xl)",
                  color: "var(--primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                ShelterSense
              </span>
            </div>

            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--muted)",
                lineHeight: 1.6,
                marginBottom: "var(--space-4)",
              }}
            >
              Climate-adaptive vernacular architecture engine. Synthesising local
              environmental intelligence with time-tested passive design strategies for resilient, zero-carbon habitats.
            </p>

            {/* Current Active Climate Zone Pill */}
            {zone && zone !== "NEUTRAL" && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                  background: "rgba(var(--primary-rgb, 15, 118, 110), 0.12)",
                  border: "1px solid rgba(var(--primary-rgb, 15, 118, 110), 0.25)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  color: "var(--primary)",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--primary)",
                  }}
                />
                Active Zone: {zone.replace(/_/g, " ")}
              </div>
            )}
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--primary)",
                marginBottom: "var(--space-4)",
              }}
            >
              Platform Navigation
            </h4>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              {[
                { to: "/", label: "Home Overview" },
                { to: "/dashboard", label: "Climate Dashboard" },
                { to: "/library", label: "Vernacular Library" },
                { to: "/compare", label: "Typology Compare" },
                { to: "/emergency", label: "Emergency Readiness" },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    style={{
                      fontSize: "var(--text-sm)",
                      color: "var(--muted)",
                      textDecoration: "none",
                      transition: "color 0.2s ease, transform 0.2s ease",
                      display: "inline-block",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--primary)";
                      e.currentTarget.style.transform = "translateX(2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--muted)";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Bioclimatic Standards */}
          <div>
            <h4
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--primary)",
                marginBottom: "var(--space-4)",
              }}
            >
              Building Standards & Data
            </h4>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              {[
                { label: "NBC 2016 Part 11 (Approach to Sustainability)", icon: Shield },
                { label: "ECBC 2017 & BEE Energy Guidelines", icon: Layers },
                { label: "Open-Meteo Weather APIs", icon: Wind },
                { label: "Copernicus GloFAS Flood Intelligence", icon: Droplets },
                { label: "Thermal Mass & Stack Ventilation", icon: Sun },
              ].map(({ label, icon: Icon }, idx) => (
                <li
                  key={idx}
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Icon size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Climate Zones */}
          <div>
            <h4
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--primary)",
                marginBottom: "var(--space-4)",
              }}
            >
              Indian Climate Zones
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              {[
                { name: "Composite", desc: "Extreme summer, cold winter, monsoons" },
                { name: "Hot-Dry", desc: "High solar radiation & diurnal swing" },
                { name: "Warm-Humid", desc: "High humidity, cross-ventilation focus" },
                { name: "Cold", desc: "Sub-zero winters, thermal envelope retention" },
                { name: "Temperate", desc: "Comfortable ambient year-round range" },
              ].map(({ name, desc }) => (
                <div key={name} style={{ fontSize: "var(--text-xs)" }}>
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>{name}: </span>
                  <span style={{ color: "var(--muted)" }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Sub-footer */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "var(--space-6)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "var(--space-4)",
            fontSize: "var(--text-xs)",
            color: "var(--muted)",
          }}
        >
          <div>
            © {currentYear} <strong>ShelterSense</strong> — Empowering resilient, vernacular-informed architecture.
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-6)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              Empirical Bioclimatic Simulation
            </span>

            {/* Back to top button */}
            <button
              onClick={scrollToTop}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(var(--shadow-color), 0.06)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-full)",
                padding: "4px 12px",
                color: "var(--text)",
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--primary)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(var(--shadow-color), 0.06)";
                e.currentTarget.style.color = "var(--text)";
              }}
              aria-label="Back to top"
            >
              <span>Back to top</span>
              <ArrowUp size={12} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

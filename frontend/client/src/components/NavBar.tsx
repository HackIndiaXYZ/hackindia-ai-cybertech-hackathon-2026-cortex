import { NavLink } from "react-router-dom";
import { Home, LayoutDashboard, GitCompare, Library, AlertTriangle, Moon, Sun } from "lucide-react";
import { useClimateZone } from "../theme/ClimateThemeProvider";

const links = [
  { to: "/",          label: "Home",      Icon: Home            },
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/compare",   label: "Compare",   Icon: GitCompare      },
  { to: "/library",   label: "Library",   Icon: Library         },
  { to: "/emergency", label: "Emergency", Icon: AlertTriangle   },
];

export default function NavBar() {
  const { isDarkMode, toggleDarkMode } = useClimateZone();

  return (
    <nav
      className="nav-bar"
      aria-label="Main navigation"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "var(--space-4) var(--space-8)",
        background: "rgba(var(--surface-rgb), 0.94)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Brand */}
      <span
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: "var(--weight-extrabold)",
          fontSize: "var(--text-lg)",
          color: "var(--primary)",
          marginRight: "auto",
          letterSpacing: "-0.02em",
        }}
      >
        ShelterSense
      </span>

      {/* Nav links */}
      {links.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          style={({ isActive }) => ({
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            padding: "var(--space-2) var(--space-3)",
            borderRadius: "var(--radius-full)",
            fontSize: "var(--text-sm)",
            fontWeight: isActive ? "var(--weight-semibold)" : "var(--weight-medium)",
            color: isActive ? "var(--primary)" : "var(--muted)",
            background: isActive ? "rgba(var(--shadow-color), 0.08)" : "transparent",
            textDecoration: "none",
            transition: "background 200ms ease, color 200ms ease",
          })}
        >
          <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
          <span className="nav-label">{label}</span>
        </NavLink>
      ))}

      {/* Dark Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          marginLeft: "var(--space-2)",
          borderRadius: "var(--radius-full)",
          background: isDarkMode ? "rgba(var(--shadow-color), 0.15)" : "rgba(var(--shadow-color), 0.05)",
          color: "var(--text)",
          border: "1px solid var(--border)",
          cursor: "pointer",
          transition: "all 0.2s ease"
        }}
      >
        {isDarkMode ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
      </button>
    </nav>
  );
}

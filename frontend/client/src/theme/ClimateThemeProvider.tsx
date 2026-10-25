import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { ZoneOrNeutral } from "../types";

/* ------------------------------------------------------------------ */
/*  Context shape                                                        */
/* ------------------------------------------------------------------ */
interface ClimateThemeContextValue {
  zone: ZoneOrNeutral;
  setZone: (z: ZoneOrNeutral) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ClimateThemeContext = createContext<ClimateThemeContextValue>({
  zone: "NEUTRAL",
  setZone: () => undefined,
  isDarkMode: false,
  toggleDarkMode: () => undefined,
});

/* ------------------------------------------------------------------ */
/*  Public hook                                                          */
/* ------------------------------------------------------------------ */
export function useClimateZone(): ClimateThemeContextValue {
  return useContext(ClimateThemeContext);
}

/* ------------------------------------------------------------------ */
/*  Provider                                                             */
/* ------------------------------------------------------------------ */
interface Props {
  children: ReactNode;
  initial?: ZoneOrNeutral;
}

export function ClimateThemeProvider({ children, initial = "NEUTRAL" }: Props) {
  const [zone, setZoneState] = useState<ZoneOrNeutral>(initial);
  
  // Initialize dark mode from system preference or local storage
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("shelter-dark-mode");
      if (saved) return saved === "true";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem("shelter-dark-mode", String(next));
      return next;
    });
  }, []);

  /** Sync zone -> data-zone and data-theme on <html> */
  const applyTheme = useCallback((z: ZoneOrNeutral, dark: boolean) => {
    const root = document.documentElement;

    if (z === "NEUTRAL") {
      root.removeAttribute("data-zone");
    } else {
      root.setAttribute("data-zone", z);
    }
    
    if (dark) {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }

  }, []);

  /* Apply on first render and subsequent changes */
  useEffect(() => {
    applyTheme(zone, isDarkMode);
  }, [zone, isDarkMode, applyTheme]);

  const setZone = useCallback((z: ZoneOrNeutral) => {
    setZoneState(z);
  }, []);

  return (
    <ClimateThemeContext.Provider value={{ zone, setZone, isDarkMode, toggleDarkMode }}>
      {children}
    </ClimateThemeContext.Provider>
  );
}

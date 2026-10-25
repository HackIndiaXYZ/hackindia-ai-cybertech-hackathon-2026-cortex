import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { GeocodedLocation } from "../services/locationService";
import { analyzeService, AnalysisResponse } from "../services/analyzeService";

interface LocationContextType {
  location: GeocodedLocation | null;
  setLocation: (loc: GeocodedLocation | null) => void;

  /** Full analysis result from the backend. Null until a location is analysed. */
  analysis: AnalysisResponse | null;
  /** True while the backend request is in-flight. */
  isLoading: boolean;
  /** Non-null when the last backend request failed. */
  analysisError: string | null;

  /**
   * Trigger a backend analysis for the given coordinates.
   * Cancels any previous in-flight request via AbortController.
   * Also updates `location` with a synthetic GeocodedLocation built from the
   * backend's reverse-geocoded name, so both context values stay in sync.
   */
  runAnalysis: (lat: number, lon: number) => Promise<void>;

  /** Clear analysis state (for new pin before result arrives). */
  resetAnalysis: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<GeocodedLocation | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Keep a ref to the current AbortController so we can cancel in-flight requests
  const abortRef = useRef<AbortController | null>(null);

  const resetAnalysis = useCallback(() => {
    setAnalysis(null);
    setAnalysisError(null);
  }, []);

  const runAnalysis = useCallback(async (lat: number, lon: number) => {
    // Cancel any previous in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setAnalysisError(null);
    setAnalysis(null);

    try {
      const result = await analyzeService.analyze(lat, lon, controller.signal);
      setAnalysis(result);

      // Sync the location context with what the backend resolved
      const resolvedLoc: GeocodedLocation = {
        name: result.location.name ?? `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        lat: result.location.latitude,
        lon: result.location.longitude,
        country: result.location.country ?? undefined,
      };
      setLocation(resolvedLoc);
    } catch (err: unknown) {
      // Ignore abort errors — they are intentional cancellations
      if (err instanceof DOMException && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : String(err);
      setAnalysisError(msg);
      console.error("[LocationContext] Analysis failed:", msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <LocationContext.Provider
      value={{ location, setLocation, analysis, isLoading, analysisError, runAnalysis, resetAnalysis }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocationContext must be used within a LocationProvider");
  }
  return context;
}

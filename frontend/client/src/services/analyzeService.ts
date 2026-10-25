/**
 * analyzeService.ts
 * -----------------
 * Calls the EcoShelter backend POST /api/analyze endpoint and returns
 * the unified AnalysisResponse.  All types mirror the Pydantic schema.
 */

export interface LocationInfo {
  latitude: number;
  longitude: number;
  name: string | null;
  country: string | null;
}

export interface WeatherInfo {
  temperature: number | null;
  humidity: number | null;
  wind_speed: number | null;
  rainfall: number | null;
  cloud_cover: number | null;
}

export interface FloodInfo {
  risk: string;
  status: string;
}

export interface AnalysisInfo {
  classification: string;
  conditions: string[];
  summary: string;
}

export interface AnalysisResponse {
  location: LocationInfo;
  weather: WeatherInfo;
  flood: FloodInfo;
  analysis: AnalysisInfo;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const analyzeService = {
  /**
   * Sends coordinates to the backend and returns the full analysis.
   * Throws on network/server errors so the caller can handle them.
   */
  async analyze(
    latitude: number,
    longitude: number,
    signal?: AbortSignal
  ): Promise<AnalysisResponse> {
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Backend returned ${response.status}: ${errorText}`
      );
    }

    return response.json() as Promise<AnalysisResponse>;
  },
};

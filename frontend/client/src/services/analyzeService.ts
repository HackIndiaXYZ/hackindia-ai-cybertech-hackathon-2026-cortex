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

export interface DailyForecastItem {
  date: string;           // "YYYY-MM-DD"
  temp_max: number | null;
  temp_min: number | null;
  weather_code: number | null;
  rain_probability: number | null;
}

export interface HourlyForecastItem {
  time: string;           // ISO-8601 local datetime
  temperature: number;
}

export interface WeatherInfo {
  temperature: number | null;
  humidity: number | null;
  wind_speed: number | null;
  rainfall: number | null;
  cloud_cover: number | null;
  daily_forecast: DailyForecastItem[] | null;
  hourly_forecast: HourlyForecastItem[] | null;
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

export interface ThermalStressDetail {
  level: string;
  score_0_100: number;
  reason: string;
}

export interface ThermalRiskResponse {
  heat: ThermalStressDetail;
  cold: ThermalStressDetail;
  zone: string;
  confidence: number;
  heatStress: number;
  coldStress: number;
  whyNumbers: {
    avgSummerTemp: number;
    avgWinterTemp: number;
    annualRainfall: number;
  };
  explanation: string;
  ruleBasedZone: string;
  mlZone: string;
  latitude?: number;
  longitude?: number;
  source?: string;
  verified?: boolean;
}

export interface MLDesignPrediction {
  id: string;
  name: string;
  origin_zone: string;
  predicted_score: number;
  match_level: string;
  confidence: number;
  strengths: string[];
  why_recommended: string;
  rank: number;
}

export interface MLRecommendResponse {
  predictions: MLDesignPrediction[];
  input_climate_features: Record<string, number>;
  model_metadata: {
    model_type: string;
    model_version: string;
    test_r2: number;
    test_mae: number;
    source: string;
    verified: boolean;
    honesty_notice: string;
  };
  source: string;
  verified: boolean;
  disclaimer: string;
}

export interface MLDesignScores {
  comfort: number;
  cost: number;
  safety: number;
  sustainability: number;
}

export interface MLRecommendedDesign {
  id: string;
  name: string;
  plan_archetype: string;
  scores: MLDesignScores;
  total: number;
  reasons: string[];
  rank: number;
}

export interface MLDesignRecommendResponse {
  location: LocationInfo;
  features_used: Record<string, number>;
  designs: MLRecommendedDesign[];
  weights_used: Record<string, number>;
  model_info: {
    name: string;
    version: string;
    source: string;
  };
}

// ---------------------------------------------------------------------------
// Design Ranking Types (matches frontend/client/src/mock/designs.ts contract)
// ---------------------------------------------------------------------------

export interface DesignScores {
  comfort: number;   // 0-100
  cost: number;      // 0-100 (inverted: cheaper = higher)
  safety: number;    // 0-100
  sustainability: number; // 0-100
}

export interface DesignModel {
  id: string;
  name: string;
  scores: DesignScores;
  totalScore?: number;
  description: string;
  reasons: string[];
  components?: Record<string, string>;
}

export interface DesignRankResponse {
  zone: string;
  weights_applied: Record<string, number>;
  designs: DesignModel[];
  total_candidates_evaluated: number;
  source?: string;
  verified?: boolean;
  placeholder_note?: string;
}

export interface StrategyItem {
  element: "layout" | "walls" | "roof" | "windows" | "shading" | "ventilation" | "orientation" | "landscape" | string;
  value: string;
  reason: string;
  id?: string;
  title?: string;
  recommendation?: string;
  iconType?: "layout" | "walls" | "roof" | "windows" | "shading" | "ventilation" | "orientation" | "landscape";
}

export interface WeatherTipItem {
  alert: string;
  hazard?: string;
  id: string;
  title: string;
  advice: string;
  tip?: string;
  reason: string;
  priority?: string;
}

export interface RequirementsApiResponse {
  zone: string;
  name?: string | null;
  zone_name?: string | null;
  description: string;
  strategies: StrategyItem[];
  tips: WeatherTipItem[];
  source?: string;
  verified?: boolean;
}

import type { PlanSpec } from "../mock/planData";

export interface DesignSpecResponse extends PlanSpec {
  zone: string;
  courtyard?: {
    present: boolean;
    type?: string;
    width?: number;
    length?: number;
    details?: string;
  };
  wall_thickness: number;
  roof_type: string;
  overhang: number;
  concept_only: boolean;
  notes?: string[];
  design_summary?: string;
  source?: string;
  verified?: boolean;
}

export interface MonthlyClimateSummaryItem {
  month: number;
  month_name: string;
  avg_temp_max?: number;
  avg_temp_min?: number;
  avg_temp_mean?: number;
  avg_humidity?: number;
  avg_rainfall?: number;
  avg_wind_speed?: number;
  avg_solar_radiation?: number;
}

export interface ClimateApiResponse {
  latitude: number;
  longitude: number;
  years_analyzed: number;
  start_date: string;
  end_date: string;
  data_quality: {
    total_days: number;
    missing_percent: number;
    interpolated_days: number;
    source?: string;
    verified?: boolean;
  };
  derived_metrics: {
    hottest_month: number;
    coldest_month: number;
    annual_rain: number;
    days_above_40: number;
    days_below_5: number;
    source?: string;
    verified?: boolean;
  };
  monthly_summary: MonthlyClimateSummaryItem[];
  cached?: boolean;
  source?: string;
  verified?: boolean;
}

export interface ZoneDiagnosticValues {
  hottest_month_max: number;
  coldest_month_min: number;
  coldest_month_mean: number;
  hot_season_humidity: number;
  annual_rain: number;
}

export interface ZoneApiResponse {
  zone: string;
  reason: string;
  values: ZoneDiagnosticValues;
  matched_rule: string;
  latitude: number;
  longitude: number;
  source?: string;
  verified?: boolean;
}

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ??
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ??
  (typeof import.meta !== "undefined" && import.meta.env?.PROD ? "" : "http://localhost:8000");

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

  /**
   * Calls POST /api/climate for multi-year historical climate analytics.
   */
  async getClimate(
    latitude: number,
    longitude: number,
    signal?: AbortSignal
  ): Promise<ClimateApiResponse> {
    const response = await fetch(`${API_BASE}/api/climate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Climate backend returned ${response.status}: ${errorText}`);
    }

    return response.json() as Promise<ClimateApiResponse>;
  },

  /**
   * Calls POST /api/zone for 5-zone bioclimatic classification.
   */
  async getZone(
    latitude: number,
    longitude: number,
    signal?: AbortSignal
  ): Promise<ZoneApiResponse> {
    const response = await fetch(`${API_BASE}/api/zone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Zone backend returned ${response.status}: ${errorText}`);
    }

    return response.json() as Promise<ZoneApiResponse>;
  },

  /**
   * Calls POST /api/risk to get rule-based thermal risk assessment.
   */
  async getRisk(
    latitude: number,
    longitude: number,
    signal?: AbortSignal
  ): Promise<ThermalRiskResponse> {
    const response = await fetch(`${API_BASE}/api/risk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Thermal risk backend returned ${response.status}: ${errorText}`);
    }

    return response.json() as Promise<ThermalRiskResponse>;
  },

  /**
   * Alias for getRisk to maintain backwards compatibility.
   */
  async getThermalRisk(
    latitude: number,
    longitude: number,
    signal?: AbortSignal
  ): Promise<ThermalRiskResponse> {
    return this.getRisk(latitude, longitude, signal);
  },

  /**
   * Calls POST /api/requirements with climate zone and optional severe weather alerts.
   */
  async getRequirements(
    zone: string,
    alerts?: string[],
    signal?: AbortSignal
  ): Promise<RequirementsApiResponse> {
    const response = await fetch(`${API_BASE}/api/requirements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zone, alerts }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Requirements backend returned ${response.status}: ${errorText}`);
    }

    return response.json() as Promise<RequirementsApiResponse>;
  },

  /**
   * Calls POST /api/design/rank with zone, weights, and top_n.
   * Returns ranked design alternatives matching frontend DesignModel.
   */
  async rankDesigns(
    zone: string,
    weights?: DesignScores,
    topN: number = 3,
    signal?: AbortSignal
  ): Promise<DesignRankResponse> {
    const response = await fetch(`${API_BASE}/api/design/rank`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zone, weights, top_n: topN }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Design ranking backend returned ${response.status}: ${errorText}`);
    }

    return response.json() as Promise<DesignRankResponse>;
  },

  /**
   * Calls POST /api/design/rank (backwards compatibility alias).
   */
  async getDesignRankings(
    zone: string,
    weights: DesignScores,
    top_n: number = 3,
    signal?: AbortSignal
  ): Promise<DesignRankResponse> {
    return this.rankDesigns(zone, weights, top_n, signal);
  },

  /**
   * Calls GET /api/design/presets for preconfigured optimization presets.
   */
  async getDesignPresets(signal?: AbortSignal): Promise<Record<string, unknown>> {
    const response = await fetch(`${API_BASE}/api/design/presets`, { signal });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Presets backend returned ${response.status}: ${errorText}`);
    }

    return response.json() as Promise<Record<string, unknown>>;
  },

  /**
   * Calls POST /api/design/spec to generate parametric architectural plan specification.
   */
  async getSpec(
    zone: string,
    design?: string | Record<string, unknown>,
    plot?: { w?: number; l?: number; width?: number; length?: number; bedrooms?: number },
    signal?: AbortSignal
  ): Promise<DesignSpecResponse> {
    const plotWidth = plot?.w ?? plot?.width ?? 14.0;
    const plotLength = plot?.l ?? plot?.length ?? 16.0;
    const bedrooms = plot?.bedrooms ?? 2;

    const response = await fetch(`${API_BASE}/api/design/spec`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zone,
        design,
        plot_width: plotWidth,
        plot_length: plotLength,
        bedrooms,
      }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Design spec backend returned ${response.status}: ${errorText}`);
    }

    return response.json() as Promise<DesignSpecResponse>;
  },

  /**
   * Calls POST /api/design/spec (backwards compatibility wrapper).
   */
  async getDesignSpec(
    zone: string,
    params?: {
      plot_width?: number;
      plot_length?: number;
      bedrooms?: number;
      design?: string | Record<string, unknown>;
    },
    signal?: AbortSignal
  ): Promise<DesignSpecResponse> {
    return this.getSpec(
      zone,
      params?.design,
      {
        w: params?.plot_width,
        l: params?.plot_length,
        bedrooms: params?.bedrooms,
      },
      signal
    );
  },

  /**
   * Calls POST /api/recommend/ml to get ML-predicted vernacular design recommendations.
   * Falls back gracefully — callers should catch and use static zone data on failure.
   */
  async getMLRecommendations(
    latitude: number,
    longitude: number,
    topN: number = 3,
    signal?: AbortSignal
  ): Promise<MLRecommendResponse> {
    const response = await fetch(`${API_BASE}/api/recommend/ml`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude, top_n: topN }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`ML recommender returned ${response.status}: ${errorText}`);
    }

    return response.json() as Promise<MLRecommendResponse>;
  },

  /**
   * Calls POST /api/designs/recommend for multi-target ML design recommendations.
   */
  async recommendDesigns(
    latitude: number,
    longitude: number,
    weights?: Partial<MLDesignScores>,
    topN: number = 3,
    signal?: AbortSignal
  ): Promise<MLDesignRecommendResponse> {
    const response = await fetch(`${API_BASE}/api/designs/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude,
        longitude,
        weights: weights
          ? {
              comfort: weights.comfort ?? 25,
              cost: weights.cost ?? 25,
              safety: weights.safety ?? 25,
              sustainability: weights.sustainability ?? 25,
            }
          : undefined,
        top_n: topN,
      }),
      signal,
    });

    if (!response.ok) {
      let message = `Server error (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson?.detail?.message) {
          message = errorJson.detail.message;
        } else if (typeof errorJson?.detail === "string") {
          message = errorJson.detail;
        }
      } catch {
        const errorText = await response.text().catch(() => "");
        if (errorText) message = errorText;
      }
      throw new Error(message);
    }

    return response.json() as Promise<MLDesignRecommendResponse>;
  },

  /**
   * Calls POST /api/report to generate and download a comprehensive architectural assessment PDF.
   */
  async downloadReport(
    params: {
      latitude: number;
      longitude: number;
      weights?: Record<string, number>;
      plot_size?: { width?: number; length?: number; w?: number; l?: number };
    },
    signal?: AbortSignal
  ): Promise<Blob> {
    const response = await fetch(`${API_BASE}/api/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Report generation failed (${response.status}): ${errorText}`);
    }

    return response.blob();
  },
};



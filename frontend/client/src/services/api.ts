/**
 * api.ts
 * ------
 * Typed HTTP client wrapper for EcoShelter backend endpoints using VITE_API_URL.
 * Provides standalone typed functions:
 *   - getClimate(lat, lon)
 *   - getZone(lat, lon)
 *   - getRisk(lat, lon)
 *   - getRequirements(zone, alerts)
 *   - rankDesigns(zone, weights, topN)
 *   - getSpec(zone, design, plot)
 */

import {
  analyzeService,
  type ClimateApiResponse,
  type MonthlyClimateSummaryItem,
  type ZoneApiResponse,
  type ZoneDiagnosticValues,
  type ThermalRiskResponse,
  type ThermalStressDetail,
  type AnalysisResponse,
  type StrategyItem,
  type WeatherTipItem,
  type RequirementsApiResponse,
  type DesignScores,
  type DesignModel,
  type DesignRankResponse,
  type DesignSpecResponse,
} from "./analyzeService";

export type {
  ClimateApiResponse,
  MonthlyClimateSummaryItem,
  ZoneApiResponse,
  ZoneDiagnosticValues,
  ThermalRiskResponse,
  ThermalStressDetail,
  AnalysisResponse,
  StrategyItem,
  WeatherTipItem,
  RequirementsApiResponse,
  DesignScores,
  DesignModel,
  DesignRankResponse,
  DesignSpecResponse,
};

/**
 * Fetch multi-year historical climate analytics and monthly summaries for coordinates.
 */
export async function getClimate(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<ClimateApiResponse> {
  return analyzeService.getClimate(latitude, longitude, signal);
}

/**
 * Fetch 5-zone bioclimatic classification and quantitative diagnostic values for coordinates.
 */
export async function getZone(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<ZoneApiResponse> {
  return analyzeService.getZone(latitude, longitude, signal);
}

/**
 * Fetch rule-based and ML thermal risk evaluation for coordinates.
 */
export async function getRisk(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<ThermalRiskResponse> {
  return analyzeService.getRisk(latitude, longitude, signal);
}

/**
 * Fetch passive architectural design strategies and emergency weather tips.
 */
export async function getRequirements(
  zone: string,
  alerts?: string[],
  signal?: AbortSignal
): Promise<RequirementsApiResponse> {
  return analyzeService.getRequirements(zone, alerts, signal);
}

/**
 * Evaluate and rank design combinations using MCDM weighted sum.
 */
export async function rankDesigns(
  zone: string,
  weights?: DesignScores,
  topN: number = 3,
  signal?: AbortSignal
): Promise<DesignRankResponse> {
  return analyzeService.rankDesigns(zone, weights, topN, signal);
}

/**
 * Generate 2D/3D parametric architectural layout specification.
 */
export async function getSpec(
  zone: string,
  design?: string | Record<string, unknown>,
  plot?: { w?: number; l?: number; width?: number; length?: number; bedrooms?: number },
  signal?: AbortSignal
): Promise<DesignSpecResponse> {
  return analyzeService.getSpec(zone, design, plot, signal);
}

/**
 * Generate and download bioclimatic architectural assessment PDF report.
 */
export async function downloadReport(
  params: {
    latitude: number;
    longitude: number;
    weights?: Record<string, number>;
    plot_size?: { width?: number; length?: number; w?: number; l?: number };
  },
  signal?: AbortSignal
): Promise<Blob> {
  return analyzeService.downloadReport(params, signal);
}

export { analyzeService };

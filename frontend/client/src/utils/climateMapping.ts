/**
 * climateMapping.ts
 * -----------------
 * Maps FastAPI backend classification and 5-zone outputs to:
 * 1. Vernacular Library climate zones ("HOT DRY", "WARM HUMID", "COMPOSITE", "TEMPERATE", "COLD")
 * 2. ClimateThemeProvider zones ("HOT_DRY", "WARM_HUMID", "COMPOSITE", "TEMPERATE", "COLD", "NEUTRAL")
 *
 * Supports:
 * - New 5-Zone model outputs: HOT_DRY, WARM_HUMID, COLD, COMPOSITE, TEMPERATE
 * - Legacy backend classifications: Cold, Cold-Humid, Moderate, Hot-Dry, Hot-Humid, Variable
 * - Case-insensitive and separator-agnostic (hyphens, spaces, underscores)
 */

import type { ClimateZone } from "../data/vernacularDesigns";
import type { ZoneOrNeutral } from "../types";

export function mapBackendClassificationToZone(
  classification?: string | null
): ClimateZone | null {
  if (!classification) return null;

  const normalized = classification.trim().toUpperCase().replace(/[- ]/g, "_");

  // Hot & Dry
  if (normalized === "HOT_DRY" || normalized === "HOTDRY") {
    return "HOT DRY";
  }

  // Hot & Humid / Warm & Humid
  if (
    normalized === "WARM_HUMID" ||
    normalized === "HOT_HUMID" ||
    normalized === "WARMHUMID" ||
    normalized === "HOTHUMID"
  ) {
    return "WARM HUMID";
  }

  // Cold / Cold-Humid
  if (
    normalized === "COLD" ||
    normalized === "COLD_HUMID" ||
    normalized === "COLDHUMID"
  ) {
    return "COLD";
  }

  // Moderate / Temperate
  if (normalized === "TEMPERATE" || normalized === "MODERATE") {
    return "TEMPERATE";
  }

  // Composite / Variable
  if (normalized === "COMPOSITE" || normalized === "VARIABLE") {
    return "COMPOSITE";
  }

  // Insufficient Data or unknown
  return null;
}

export function mapToThemeZone(
  classification?: string | null
): ZoneOrNeutral {
  if (!classification) return "NEUTRAL";

  const normalized = classification.trim().toUpperCase().replace(/[- ]/g, "_");

  if (normalized === "HOT_DRY" || normalized === "HOTDRY") {
    return "HOT_DRY";
  }
  if (
    normalized === "WARM_HUMID" ||
    normalized === "HOT_HUMID" ||
    normalized === "WARMHUMID" ||
    normalized === "HOTHUMID"
  ) {
    return "WARM_HUMID";
  }
  if (
    normalized === "COLD" ||
    normalized === "COLD_HUMID" ||
    normalized === "COLDHUMID"
  ) {
    return "COLD";
  }
  if (normalized === "TEMPERATE" || normalized === "MODERATE") {
    return "TEMPERATE";
  }
  if (normalized === "COMPOSITE" || normalized === "VARIABLE") {
    return "COMPOSITE";
  }

  return "NEUTRAL";
}

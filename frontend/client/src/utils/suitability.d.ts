import { VernacularDesign } from "../data/vernacularDesigns";

export type SuitabilityStatus =
  | "Suitable"
  | "Partially suitable"
  | "Not suitable"
  | "Not yet evaluated"
  | "Not evaluated";

export interface SuitabilityResult {
  status: SuitabilityStatus;
  score: number;
  reasons: string[];
  limitations: string[];
  summary: string;
}

export declare function normalizeZone(zone?: string | null): string | null;

export declare function evaluateSuitability(
  house: any,
  targetZone?: string | null,
  locationName?: string
): SuitabilityResult;

export declare function rankDesignsBySuitability<T extends VernacularDesign>(
  designs: T[],
  targetZone?: string | null,
  locationName?: string
): Array<T & { suitability: SuitabilityResult }>;

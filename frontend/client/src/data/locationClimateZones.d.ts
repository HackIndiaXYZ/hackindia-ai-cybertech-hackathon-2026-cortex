export interface VerifiedLocation {
  id: string;
  name: string;
  district: string;
  state: string;
  zone: string;
  lat: number;
  lon: number;
  aliases?: string[];
  source: string;
  distanceKm?: number;
}

export interface ClimateLookupResult {
  id?: string;
  name?: string;
  district?: string;
  state?: string;
  zone: string | null;
  source: string | null;
  nearestCity: string | null;
  distanceKm?: number;
  isFallback: boolean;
  unclassified: boolean;
  fallbackText?: string;
  message?: string;
}

export interface SearchableLocation {
  id: string;
  name: string;
  cityName: string;
  district: string;
  state: string;
  zone: string | null;
  lat: number;
  lon: number;
  source: string | null;
  isVerified: boolean;
}

export declare const CLIMATE_ZONES: Record<string, string>;
export declare const VERIFIED_CLIMATE_ZONES: VerifiedLocation[];
export declare const UNLISTED_SAMPLE_DISTRICTS: Array<{
  id: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lon: number;
}>;

export declare function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number;

export declare function findNearestVerifiedCity(
  lat: number,
  lon: number
): (VerifiedLocation & { distanceKm: number }) | null;

export declare function resolveLocationClimate(
  queryOrObj: any
): ClimateLookupResult;

export declare function getAllSearchableLocations(): SearchableLocation[];

export type ClimateZone =
  | "HOT_DRY"
  | "WARM_HUMID"
  | "COMPOSITE"
  | "TEMPERATE"
  | "COLD";

export type ZoneOrNeutral = ClimateZone | "NEUTRAL";

export interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  zone: ClimateZone | null;
}

export interface ShelterDesign {
  id: string;
  name: string;
  zone: ClimateZone;
  description: string;
  features: string[];
  materials: string[];
  imageAlt: string;
}

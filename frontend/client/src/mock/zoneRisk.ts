export interface ZoneRiskData {
  zone: string;
  confidence: number; // 0-100
  heatStress: number; // 0-100
  coldStress: number; // 0-100
  whyNumbers: {
    avgSummerTemp: number;
    avgWinterTemp: number;
    annualRainfall: number;
  };
  explanation: string;
  ruleBasedZone: string;
  mlZone: string;
}

export const mockZoneRisk: ZoneRiskData = {
  zone: "HOT_DRY",
  confidence: 92,
  heatStress: 85,
  coldStress: 15,
  whyNumbers: {
    avgSummerTemp: 38,
    avgWinterTemp: 12,
    annualRainfall: 350, // mm
  },
  explanation: "High summer temperatures coupled with low annual rainfall strongly indicate a Hot & Dry climate. Nighttime temperatures drop significantly in winter.",
  ruleBasedZone: "HOT_DRY",
  mlZone: "COMPOSITE", // differing to show the note
};

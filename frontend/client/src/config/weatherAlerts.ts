/** ----------------------------------------------------------------
 *  Weather Alert Thresholds – config file (not inside components)
 * ---------------------------------------------------------------- */

export interface AlertThresholds {
  /** °C – temperature AT or ABOVE this triggers a heatwave banner */
  heatwaveTemp: number;
  /** °C – temperature AT or BELOW this triggers a cold-wave banner */
  coldwaveTemp: number;
  /** mm  – rain volume AT or ABOVE this triggers a heavy-rain banner */
  heavyRainMm: number;
  /** Tip text for each alert type */
  tips: {
    heat: string;
    cold: string;
    rain: string;
  };
}

export const alertThresholds: AlertThresholds = {
  heatwaveTemp: 35,
  coldwaveTemp: 5,
  heavyRainMm: 20,
  tips: {
    heat: "Stay hydrated, seek shade between 11 AM–4 PM, and check on elderly neighbours.",
    cold: "Layer up, keep indoor heating on, and watch for ice on roads and footpaths.",
    rain: "Avoid low-lying areas, secure loose objects outside, and keep emergency contacts handy.",
  },
};

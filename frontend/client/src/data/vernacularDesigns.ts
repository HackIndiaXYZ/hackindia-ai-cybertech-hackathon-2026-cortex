/**
 * vernacularDesigns.ts
 * --------------------
 * Shared architectural vernacular designs data used by:
 * - Vernacular Library page (/library)
 * - Dashboard page (/dashboard Recommended Vernacular Designs)
 */

export type ClimateZone = "HOT DRY" | "WARM HUMID" | "COMPOSITE" | "TEMPERATE" | "COLD";

export interface PassiveFeatures {
  insulation: boolean | null;
  externalShading: boolean | null;
  eastWestGainControl: boolean | null;
  crossVentilation: boolean | null;
  monsoonRainProtection: boolean | null;
  thermalMass: boolean | null;
}

export interface VernacularDesign {
  id: string;
  name: string;
  climateZone: ClimateZone;
  originClimateZone: ClimateZone;
  image: string;
  shortDescription: string;
  description: string;
  keyPassiveFeatures: string[];
  whyItWorks: string;
  passiveFeatures: PassiveFeatures;
}

export const VERNACULAR_DESIGNS: VernacularDesign[] = [
  {
    id: "earthship-biotecture",
    name: "Earthship Biotecture",
    climateZone: "HOT DRY",
    originClimateZone: "HOT DRY",
    image: "/images/library/earthship.jpg",
    shortDescription: "Radically sustainable passive solar earth shelter with thick rammed-earth tyre walls and solar glass façade.",
    description: "Developed in the high desert of Taos, New Mexico, Earthships utilize dense recycled earth-filled tyre berms and large south-facing greenhouses to maintain thermal equilibrium without grid heating or cooling.",
    keyPassiveFeatures: [
      "Thick Rammed-Earth Tyre Berms (Thermal Mass)",
      "Passive Solar South-Facing Glazing",
      "Thermal Chimney & Earth Tubes for Cooling",
      "Integrated Rainwater Catchment Cisterns"
    ],
    whyItWorks: "In arid regions with extreme day-night temperature swings, the massive earth berm absorbs scorching daytime heat and slowly radiates it inward during cold desert nights, stabilizing indoor comfort completely passively.",
    passiveFeatures: {
      insulation: true,
      externalShading: null,
      eastWestGainControl: null,
      crossVentilation: true,
      monsoonRainProtection: true,
      thermalMass: true,
    },
  },
  {
    id: "courtyard-haveli",
    name: "Courtyard Haveli",
    climateZone: "HOT DRY",
    originClimateZone: "HOT DRY",
    image: "/images/library/courtyard-haveli.jpg",
    shortDescription: "Traditional desert residence featuring thick sandstone walls and an enclosed central cooling courtyard.",
    description: "Refined over centuries across Rajasthan and northern India, the haveli typology uses high thermal mass sandstone walls and a central open court (aangan) surrounded by shaded colonnades.",
    keyPassiveFeatures: [
      "Central Shaded Courtyard (Aangan)",
      "Carved Jharokhas & Jaali Stone Screens",
      "Thick Golden Sandstone Thermal Mass",
      "Nocturnal Convective Stack Ventilation"
    ],
    whyItWorks: "The enclosed courtyard functions as a microclimate generator. Cool desert night air sinks into the court and is preserved during the day by high surrounding walls, while jaalis compress incoming breezes via the Venturi effect.",
    passiveFeatures: {
      insulation: null,
      externalShading: true,
      eastWestGainControl: true,
      crossVentilation: true,
      monsoonRainProtection: null,
      thermalMass: true,
    },
  },
  {
    id: "malay-kampung",
    name: "Malay Kampung House",
    climateZone: "WARM HUMID",
    originClimateZone: "WARM HUMID",
    image: "/images/library/malay-kampung.jpg",
    shortDescription: "Elevated timber house raised on stilts with porous slatted walls to maximize breeze in hot, humid climates.",
    description: "The traditional Malay vernacular dwelling is constructed entirely on timber stilts with lightweight slatted floors, high vaulted ceilings, and deep thatch eaves to survive intense monsoons and high humidity.",
    keyPassiveFeatures: [
      "Elevated Timber Stilt Foundation",
      "Deep Overhanging Eaves for Shading & Rain",
      "Slatted Bamboo & Perforated Wooden Screens",
      "Gable Ventilation Grilles (Tebing Layar)"
    ],
    whyItWorks: "In humid tropical regions where sweat evaporation is critical for comfort, elevating the house catches faster air currents above ground vegetation, isolates against surface moisture, and provides shaded cross-ventilation.",
    passiveFeatures: {
      insulation: null,
      externalShading: true,
      eastWestGainControl: null,
      crossVentilation: true,
      monsoonRainProtection: true,
      thermalMass: false,
    },
  },
  {
    id: "bamboo-longhouse",
    name: "Bamboo Longhouse",
    climateZone: "WARM HUMID",
    originClimateZone: "WARM HUMID",
    image: "/images/library/bamboo-longhouse.jpg",
    shortDescription: "Breathable communal shelter built on stilts utilizing woven bamboo for rapid heat dissipation.",
    description: "Indigenous to Southeast Asia and northeastern India, these communal stilt homes use sustainable bamboo framing, woven split-bamboo walls, and elevated bamboo slats to provide continuous natural ventilation.",
    keyPassiveFeatures: [
      "Woven Breathable Bamboo Walls",
      "Elevated Stilt Platform for Flood Resilience",
      "Steep Pitched Rain-Shedding Thatched Roof",
      "Zero-Thermal-Mass Rapid Night Cooling"
    ],
    whyItWorks: "With zero heat retention, lightweight bamboo cools down immediately when the sun sets. The porous woven walls allow humid air to escape while providing generous shade from intense equatorial solar radiation.",
    passiveFeatures: {
      insulation: null,
      externalShading: true,
      eastWestGainControl: null,
      crossVentilation: true,
      monsoonRainProtection: true,
      thermalMass: false,
    },
  },
  {
    id: "composite-courtyard",
    name: "Composite Jaali Haveli",
    climateZone: "COMPOSITE",
    originClimateZone: "COMPOSITE",
    image: "/images/library/composite-courtyard.jpg",
    shortDescription: "Adaptive multi-seasonal mansion with intricate stone jaalis, transitional verandas, and dual-season thermal zoning.",
    description: "Common across northwestern India and composite zones, this design accommodates extreme seasonal shifts—from scorching 45°C summers to monsoon humidity and chilly 5°C winter nights.",
    keyPassiveFeatures: [
      "Venturi-Effect Intricate Stone Jaalis",
      "Seasonal Multi-Tiered Shaded Verandas",
      "Moderate-to-High Masonry Thermal Mass",
      "Dual-Zone Seasonal Living Quarters"
    ],
    whyItWorks: "Stone jaalis compress breezes and cast micro-shadows to cool dry summer air, while thick core walls store winter warmth and open courtyards allow monsoon ventilation.",
    passiveFeatures: {
      insulation: true,
      externalShading: true,
      eastWestGainControl: true,
      crossVentilation: true,
      monsoonRainProtection: true,
      thermalMass: true,
    },
  },
  {
    id: "alpine-chalet",
    name: "Alpine Chalet",
    climateZone: "COLD",
    originClimateZone: "COLD",
    image: "/images/library/alpine-chalet.jpg",
    shortDescription: "Steep-pitched timber shelter engineered to shed heavy snow loads and retain core fireplace heat.",
    description: "Rooted in the European Alps and Himalayan high-altitude valleys, the chalet features heavy interlocked timber logs, stone ground bases, and wide overhanging gabled roofs that use snow as a natural insulating blanket.",
    keyPassiveFeatures: [
      "Steeply Pitched Gabled Roof (Sheds Snow)",
      "Thick Solid Timber Walls (Natural Insulation)",
      "Compact Surface-to-Volume Ratio",
      "Central Hearth & Thermal Core"
    ],
    whyItWorks: "A compact shape minimizes exposed exterior surface area, reducing heat loss. Accumulated rooftop snow acts as an extra thermal blanket while heavy timber walls prevent cold thermal bridging.",
    passiveFeatures: {
      insulation: true,
      externalShading: null,
      eastWestGainControl: null,
      crossVentilation: null,
      monsoonRainProtection: true,
      thermalMass: true,
    },
  },
  {
    id: "new-england-saltbox",
    name: "New England Saltbox",
    climateZone: "TEMPERATE",
    originClimateZone: "TEMPERATE",
    image: "/images/library/new-england-saltbox.jpg",
    shortDescription: "Asymmetrical pitched roof sloping down to deflect northern gales while capturing southern solar warmth.",
    description: "Originating in colonial New England, the saltbox house features a distinct long pitched rear roof (catslide) that slopes down to one single story on the north side, deflecting harsh winter winds.",
    keyPassiveFeatures: [
      "Asymmetrical Catslide Roof Facing North",
      "Central Massive Brick Chimney Heat Battery",
      "South-Oriented Primary Living Windows",
      "Compact Timber-Frame Structural Envelope"
    ],
    whyItWorks: "The aerodynamic northern roof slants down close to the ground, diverting freezing winter winds smoothly over the house with minimal drag and heat loss, while southern windows absorb warmth during temperate days.",
    passiveFeatures: {
      insulation: null,
      externalShading: null,
      eastWestGainControl: null,
      crossVentilation: null,
      monsoonRainProtection: null,
      thermalMass: null,
    },
  }
];

export const ALL_ZONES: ClimateZone[] = ["HOT DRY", "WARM HUMID", "COMPOSITE", "TEMPERATE", "COLD"];

/**
 * Generates an SVG data URL fallback in case an image fails to load.
 */
export function getFallbackSvg(climateZone: ClimateZone, title: string): string {
  const colors: Record<ClimateZone, { bg: string; text: string; badge: string }> = {
    "HOT DRY": { bg: "%23F4D9A8", text: "%23C8553D", badge: "%23C8553D" },
    "WARM HUMID": { bg: "%230D3D3B", text: "%237DD3FC", badge: "%230F766E" },
    "COMPOSITE": { bg: "%23334155", text: "%23F59E0B", badge: "%23F59E0B" },
    "TEMPERATE": { bg: "%23E8EDEC", text: "%23166534", badge: "%2322C55E" },
    "COLD": { bg: "%230B1B33", text: "%2393C5FD", badge: "%233B82F6" },
  };
  const theme = colors[climateZone] || colors["HOT DRY"];
  const safeTitle = encodeURIComponent(title);
  const safeZone = encodeURIComponent(climateZone);

  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="${theme.bg}"/><circle cx="300" cy="180" r="70" fill="${theme.badge}" opacity="0.2"/><path d="M230 220 L300 130 L370 220 Z" fill="none" stroke="${theme.text}" stroke-width="6" stroke-linejoin="round"/><rect x="250" y="220" width="100" height="60" fill="none" stroke="${theme.text}" stroke-width="5"/><rect x="285" y="240" width="30" height="40" fill="${theme.text}" opacity="0.4"/><text x="300" y="325" font-family="sans-serif" font-size="20" font-weight="bold" fill="${theme.text}" text-anchor="middle">${safeTitle}</text><text x="300" y="355" font-family="sans-serif" font-size="14" font-weight="600" fill="${theme.text}" opacity="0.8" text-anchor="middle">${safeZone} VERNACULAR</text></svg>`;
}

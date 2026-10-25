export type ActiveClimateArchetype = "COLD" | "HOT_DRY" | "WARM_HUMID" | "TEMPERATE" | "COMPOSITE";

export interface ClimateFeatureAnnotation {
  id: string;
  position: [number, number, number];
  title: string;
  description: string;
  tag: string;
}

export interface ClimateShelterConfig {
  id: ActiveClimateArchetype;
  name: string;
  subtitle: string;
  badge: string;
  roofType: "steep_gable" | "parapet_courtyard" | "hipped_stilted" | "monopitch_solar" | "hybrid_composite";
  wallColor: string;
  roofColor: string;
  accentColor: string;
  groundColor: string;
  features: ClimateFeatureAnnotation[];
  architecturalStrategies: {
    title: string;
    description: string;
    impact: string;
  }[];
}

export const CLIMATE_SHELTER_CONFIGS: Record<ActiveClimateArchetype, ClimateShelterConfig> = {
  COLD: {
    id: "COLD",
    name: "Alpine Thermal-Envelope Cabin",
    subtitle: "High-Snow-Load Shedding & Passive Solar Heat Storage",
    badge: "Cold Alpine Climate",
    roofType: "steep_gable",
    wallColor: "#5C6B73", // Slate timber & stone
    roofColor: "#2F3E46", // Dark snow-shedding metal
    accentColor: "#3B82F6",
    groundColor: "#E2E8F0", // Snow dusted ground
    features: [
      {
        id: "roof",
        position: [0, 5.8, 0],
        title: "42° Steep Gabled Roof",
        description: "Heavy snow sheds spontaneously, preventing structural collapse under alpine winter loads.",
        tag: "Snow Protection",
      },
      {
        id: "south_glass",
        position: [0, 2.2, 5.1],
        title: "Trombe Wall & South Glazing",
        description: "Large south-facing double glazing traps passive solar heat to warm the interior all day.",
        tag: "Passive Solar",
      },
      {
        id: "chimney",
        position: [2.5, 6.2, -1],
        title: "Central Thermal Core & Flue",
        description: "Stone masonry chimney core retains heat and redistributes warmth to living zones.",
        tag: "Thermal Mass",
      },
      {
        id: "airlock",
        position: [-3.2, 1.2, 5.2],
        title: "Protected Draft Airlock",
        description: "Double-door vestibule prevents icy wind blasts from stripping interior heated air.",
        tag: "Airlock Entry",
      },
    ],
    architecturalStrategies: [
      {
        title: "Steep Gabled Roof (42° Pitch)",
        description: "Sheds deep snow loads naturally and avoids ice damming along eaves.",
        impact: "Zero snow load structural failure risk",
      },
      {
        title: "Thick Insulated Thermal Envelope",
        description: "Exterior walls use high R-value insulation with heavy mountain stone plinth.",
        impact: "Reduces heating requirements by over 45%",
      },
      {
        title: "Maximized South Solar Aperture",
        description: "Oriented within 15° of true South to harvest maximum low-angle winter sunlight.",
        impact: "Passive daytime warmth with high thermal storage",
      },
    ],
  },

  HOT_DRY: {
    id: "HOT_DRY",
    name: "Rammed Earth Courtyard & Windcatcher",
    subtitle: "High Thermal Mass, Convective Microclimate & Natural Air Scoop",
    badge: "Arid Desert Climate",
    roofType: "parapet_courtyard",
    wallColor: "#D4A373", // Warm sandstone / terracotta adobe
    roofColor: "#BC6C25", // Terracotta parapet
    accentColor: "#E76F51",
    groundColor: "#E9D8A6", // Desert sand
    features: [
      {
        id: "windtower",
        position: [3.2, 6.5, -2.5],
        title: "Badgir Windcatcher Tower",
        description: "Rising 6m above ground to capture high-altitude cooler winds and funnel air downwards.",
        tag: "Natural Ventilation",
      },
      {
        id: "courtyard",
        position: [0, 2.8, 0],
        title: "Central Shaded Courtyard",
        description: "Draws in cool night air and provides radiant night-sky cooling for adjacent rooms.",
        tag: "Microclimate",
      },
      {
        id: "parapet",
        position: [0, 4.2, 4.5],
        title: "Deep Roof Parapet & Terrace",
        description: "Reflective roof deck shielded with high parapets for shaded evening living.",
        tag: "Solar Reflection",
      },
      {
        id: "recessed_windows",
        position: [-2.5, 2, 4.6],
        title: "Deep-Set Shaded Jharokhas",
        description: "Small recessed openings eliminate direct solar beam penetration while admitting diffuse light.",
        tag: "Glare & Heat Cut",
      },
    ],
    architecturalStrategies: [
      {
        title: "Badgir Windcatcher Air Scoop",
        description: "Forces fresh desert airflow through living zones without requiring electrical cooling.",
        impact: "Passive indoor temperature reduction of 5–8°C",
      },
      {
        title: "Rammed Earth Thermal Mass (40cm Walls)",
        description: "Dampens extreme 40°C daytime peak and releases stored heat during chilly desert nights.",
        impact: "Diurnal thermal lag of 10 to 12 hours",
      },
      {
        title: "Central Shaded Open-to-Sky Courtyard",
        description: "Creates stack effect ventilation where warm air rises and escapes out.",
        impact: "Continuous diurnal convective cooling",
      },
    ],
  },

  WARM_HUMID: {
    id: "WARM_HUMID",
    name: "Elevated Flood-Resilient Tropical Shelter",
    subtitle: "Heavy Monsoon Deep Eaves, Stilt Foundation & Cross-Ventilation",
    badge: "Warm-Humid & Flood Risk Zone",
    roofType: "hipped_stilted",
    wallColor: "#8D7B68", // Bamboo / treated timber
    roofColor: "#2D6A4F", // Tropical forest green roof
    accentColor: "#10B981",
    groundColor: "#A3B18A", // Wetland lush ground
    features: [
      {
        id: "stilts",
        position: [0, 0.9, 0],
        title: "1.8m Heavy Pilotis (Stilts)",
        description: "Elevates floor well above flash flood runoff and storm surges while catching ground breezes.",
        tag: "Flood Defense",
      },
      {
        id: "deep_eaves",
        position: [0, 5.2, 0],
        title: "1.6m Extended Rain Overhangs",
        description: "Allows windows to remain wide open during torrential monsoon downpours without rain entering.",
        tag: "Monsoon Protection",
      },
      {
        id: "louvers",
        position: [3.5, 2.8, 2.5],
        title: "Operable Timber Louver Walls",
        description: "Breathable wall slats maximize wind permeability and prevent sticky indoor moisture buildup.",
        tag: "Cross-Ventilation",
      },
      {
        id: "veranda",
        position: [0, 1.9, 4.8],
        title: "Perimeter Shaded Veranda",
        description: "Deep exterior shaded deck buffers direct sun and provides sheltered outdoor living.",
        tag: "Shade Buffer",
      },
    ],
    architecturalStrategies: [
      {
        title: "Stilt Foundation Elevation (1.8m)",
        description: "Safeguards structural integrity and residents during regional monsoon flooding.",
        impact: "High flood-risk resilience & insect barrier",
      },
      {
        title: "Wide Rain-Shedding Extended Eaves",
        description: "Directs heavy rain runoff clear of building perimeter to prevent foundation erosion.",
        impact: "Continuous open ventilation even during storms",
      },
      {
        title: "Lightweight High-Permeability Materials",
        description: "Uses treated bamboo and ventilated timber framing with minimal thermal storage.",
        impact: "Cools down immediately at twilight",
      },
    ],
  },

  TEMPERATE: {
    id: "TEMPERATE",
    name: "Bio-Solar Eco-Pavilion",
    subtitle: "Optimal Solar PV Monopitch, Clerestory Lighting & Green Shading",
    badge: "Temperate Moderate Climate",
    roofType: "monopitch_solar",
    wallColor: "#E9ECEF", // Clean light eco-render
    roofColor: "#1E293B", // PV panel slate dark
    accentColor: "#059669",
    groundColor: "#80B9AD", // Grassy meadow
    features: [
      {
        id: "solar_pv",
        position: [0, 5.2, -0.5],
        title: "Integrated Solar Photovoltaic Array",
        description: "Angled south-facing monopitch roof maximizes clean solar electric energy generation.",
        tag: "Solar Energy",
      },
      {
        id: "clerestory",
        position: [0, 4.1, 3.8],
        title: "Clerestory Daylight Vents",
        description: "Upper ribbon windows invite glare-free diffuse daylight deep into the interior floorplan.",
        tag: "Daylighting",
      },
      {
        id: "pergola",
        position: [-3.5, 2.3, 4.2],
        title: "Green Shading Pergola Trellis",
        description: "Deciduous climbing vegetation shades in summer while dropping leaves for winter sun.",
        tag: "Biophilic Shading",
      },
      {
        id: "rainwater",
        position: [4.2, 1.4, -3.8],
        title: "Rainwater Cistern Collection",
        description: "Roof valley channels 100% of rain runoff into a modular ecological filtration tank.",
        tag: "Water Harvest",
      },
    ],
    architecturalStrategies: [
      {
        title: "Monopitch Solar Orientation (24° Tilt)",
        description: "Captures year-round renewable solar power while shedding water towards collection.",
        impact: "Net-zero energy operational potential",
      },
      {
        title: "Cross-Ventilation Clerestory Windows",
        description: "Permits hot stratified air to vent out at roof apex while pulling in garden air.",
        impact: "Passive cooling for moderate spring/summer days",
      },
      {
        title: "Integrated Rainwater Cistern",
        description: "Harvests non-potable household water supply directly from roof drainage.",
        impact: "Reduces municipal water reliance by up to 60%",
      },
    ],
  },

  COMPOSITE: {
    id: "COMPOSITE",
    name: "Climate-Adaptive Hybrid Shelter",
    subtitle: "Dual-Aspect Thermal Control with Shaded Courtyard & Solar Wing",
    badge: "Composite / Variable Zone",
    roofType: "hybrid_composite",
    wallColor: "#D8D2C2",
    roofColor: "#4A403A",
    accentColor: "#F59E0B",
    groundColor: "#C7C8CC",
    features: [
      {
        id: "hybrid_roof",
        position: [0, 5.0, 0],
        title: "Dual Hybrid Roof Wings",
        description: "Combines one sloped wing for seasonal solar angle with a flat shaded summer terrace.",
        tag: "Adaptive Roof",
      },
      {
        id: "brise_soleil",
        position: [3.8, 2.5, 1.5],
        title: "Operable Brise-Soleil Louvers",
        description: "Adjustable exterior fins rotate to block harsh summer sun yet open for mild winter warmth.",
        tag: "Seasonal Control",
      },
      {
        id: "courtyard_core",
        position: [0, 2.2, 0],
        title: "Buffered Central Lightwell",
        description: "Acts as a thermal damper between hot exterior summer air and comfortable interiors.",
        tag: "Thermal Buffer",
      },
    ],
    architecturalStrategies: [
      {
        title: "Dual Seasonal Adaptation",
        description: "Features thermal mass for winter alongside convective vents for humid summer monsoons.",
        impact: "Year-round passive thermal comfort",
      },
      {
        title: "Adjustable Louver Facades",
        description: "Enables residents to adjust shading according to dynamic weather fluctuations.",
        impact: "Cuts cooling energy consumption by 35%",
      },
    ],
  },
};

/** Convert backend API classification string into archetype key */
export function mapClassificationToArchetype(
  classification?: string | null,
  floodRisk?: string | null
): ActiveClimateArchetype {
  // If flood risk is High or Moderate, prioritize elevated stilted shelter
  if (floodRisk === "High" || floodRisk === "Moderate") {
    return "WARM_HUMID";
  }

  if (!classification) return "TEMPERATE";

  const clean = classification.trim().toLowerCase();
  if (clean.includes("cold")) {
    return "COLD";
  }
  if (clean.includes("hot-dry") || clean.includes("arid") || clean.includes("desert")) {
    return "HOT_DRY";
  }
  if (clean.includes("hot-humid") || clean.includes("humid") || clean.includes("warm-humid") || clean.includes("tropical")) {
    return "WARM_HUMID";
  }
  if (clean.includes("moderate") || clean.includes("temperate")) {
    return "TEMPERATE";
  }
  if (clean.includes("variable") || clean.includes("composite")) {
    return "COMPOSITE";
  }

  return "TEMPERATE";
}

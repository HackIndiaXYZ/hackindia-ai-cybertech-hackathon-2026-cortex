export interface Door {
  x: number;
  y: number;
  width: number;
  orientation: "horizontal" | "vertical";
}

export interface Window {
  x: number;
  y: number;
  width: number;
  orientation: "horizontal" | "vertical";
}

export interface Room {
  id: string;
  name: string;
  type: "living" | "bedroom" | "kitchen" | "bathroom" | "courtyard" | "corridor" | "utility";
  x: number;
  y: number;
  w: number;
  l: number; // length (height in 2D)
  doors: Door[];
  windows: Window[];
  details: string; // for tooltip
}

export interface PlanSpec {
  plotSize: { w: number; l: number }; // meters
  orientation: number; // degrees from North (0 = North is UP)
  rooms: Room[];
}

// ---------------------------------------------------------------------------
// HOT_DRY — Compact courtyard plan, thick walls, small windows, internal yard
// Passive principles: shading, thermal mass, night cooling via courtyard
// ---------------------------------------------------------------------------
const HOT_DRY_PLAN: PlanSpec = {
  plotSize: { w: 14, l: 16 },
  orientation: -10,
  rooms: [
    {
      id: "courtyard",
      name: "Central Courtyard",
      type: "courtyard",
      x: 4, y: 5, w: 6, l: 6,
      doors: [],
      windows: [],
      details: "Open-to-sky cooling core. Evaporative cooling at night.",
    },
    {
      id: "living",
      name: "Living Area",
      type: "living",
      x: 1, y: 1, w: 12, l: 4,
      doors: [
        { x: 6.5, y: 1, width: 1.2, orientation: "horizontal" },
        { x: 6.5, y: 5, width: 1.2, orientation: "horizontal" },
      ],
      windows: [
        { x: 2, y: 1, width: 1, orientation: "horizontal" },   // small — heat control
        { x: 11, y: 1, width: 1, orientation: "horizontal" },
      ],
      details: "High thermal mass south wall. Thick mud/brick construction.",
    },
    {
      id: "kitchen",
      name: "Kitchen",
      type: "kitchen",
      x: 1, y: 5, w: 3, l: 6,
      doors: [{ x: 4, y: 7.5, width: 1, orientation: "vertical" }],
      windows: [{ x: 1, y: 8, width: 0.8, orientation: "vertical" }],
      details: "North-facing to reduce solar heat gain. Small ventilation window.",
    },
    {
      id: "bed1",
      name: "Master Bedroom",
      type: "bedroom",
      x: 10, y: 5, w: 3, l: 6,
      doors: [{ x: 10, y: 7.5, width: 1, orientation: "vertical" }],
      windows: [{ x: 13, y: 8, width: 0.8, orientation: "vertical" }],
      details: "East-facing bedroom. Small shaded window avoids western sun.",
    },
    {
      id: "bed2",
      name: "Bedroom 2",
      type: "bedroom",
      x: 1, y: 11, w: 5, l: 4,
      doors: [{ x: 6, y: 12.5, width: 1, orientation: "vertical" }],
      windows: [{ x: 3, y: 15, width: 1, orientation: "horizontal" }],
      details: "Night ventilation via courtyard air flow.",
    },
    {
      id: "bath",
      name: "Bathroom",
      type: "bathroom",
      x: 6, y: 11, w: 3, l: 4,
      doors: [{ x: 6, y: 14, width: 1, orientation: "vertical" }],
      windows: [{ x: 7.5, y: 15, width: 0.8, orientation: "horizontal" }],
      details: "Rainwater harvesting connected.",
    },
    {
      id: "utility",
      name: "Utility / Store",
      type: "utility",
      x: 9, y: 11, w: 4, l: 4,
      doors: [{ x: 9, y: 12.5, width: 1, orientation: "vertical" }],
      windows: [],
      details: "Buffer zone on west side blocks afternoon sun.",
    },
  ],
};

// ---------------------------------------------------------------------------
// WARM_HUMID — Long linear plan, max cross-ventilation, large verandah
// Passive principles: airflow through building, shading, stilts concept
// ---------------------------------------------------------------------------
const WARM_HUMID_PLAN: PlanSpec = {
  plotSize: { w: 16, l: 12 },
  orientation: 0,
  rooms: [
    {
      id: "verandah",
      name: "Verandah",
      type: "corridor",
      x: 1, y: 1, w: 14, l: 2,
      doors: [
        { x: 4, y: 1, width: 1.5, orientation: "horizontal" },
        { x: 10, y: 1, width: 1.5, orientation: "horizontal" },
      ],
      windows: [],
      details: "Full-width verandah. Shades walls from tropical sun and rain.",
    },
    {
      id: "living",
      name: "Living / Dining",
      type: "living",
      x: 1, y: 3, w: 8, l: 4,
      doors: [
        { x: 4, y: 3, width: 1.5, orientation: "horizontal" },
        { x: 9, y: 5, width: 1.2, orientation: "vertical" },
      ],
      windows: [
        { x: 1, y: 4, width: 2, orientation: "vertical" },     // large cross-ventilation
        { x: 5, y: 7, width: 2.5, orientation: "horizontal" }, // rear breeze
      ],
      details: "Open plan for maximum air flow. Large operable windows both sides.",
    },
    {
      id: "kitchen",
      name: "Kitchen",
      type: "kitchen",
      x: 9, y: 3, w: 6, l: 4,
      doors: [{ x: 9, y: 5, width: 1.2, orientation: "vertical" }],
      windows: [
        { x: 15, y: 4.5, width: 1.5, orientation: "vertical" },
        { x: 11, y: 7, width: 1.5, orientation: "horizontal" },
      ],
      details: "Rear cross-ventilation. Open to breeze corridor.",
    },
    {
      id: "bed1",
      name: "Master Bedroom",
      type: "bedroom",
      x: 1, y: 7, w: 6, l: 4,
      doors: [{ x: 4, y: 7, width: 1.2, orientation: "horizontal" }],
      windows: [
        { x: 1, y: 9, width: 2, orientation: "vertical" },
        { x: 4, y: 11, width: 2.5, orientation: "horizontal" },
      ],
      details: "Full cross-ventilation. Operable louvres on both walls.",
    },
    {
      id: "bed2",
      name: "Bedroom 2",
      type: "bedroom",
      x: 7, y: 7, w: 5, l: 4,
      doors: [{ x: 7, y: 8.5, width: 1.2, orientation: "vertical" }],
      windows: [
        { x: 8, y: 11, width: 2, orientation: "horizontal" },
      ],
      details: "Rear garden breeze. Shaded eaves above windows.",
    },
    {
      id: "bath",
      name: "Bathroom",
      type: "bathroom",
      x: 12, y: 7, w: 3, l: 4,
      doors: [{ x: 12, y: 8.5, width: 1, orientation: "vertical" }],
      windows: [{ x: 13.5, y: 11, width: 1, orientation: "horizontal" }],
      details: "Ventilated naturally. Grey water recycling.",
    },
  ],
};

// ---------------------------------------------------------------------------
// COLD — Compact insulated plan, south-facing glazing, entry lobby buffer
// Passive principles: solar gain south, minimise heat loss, lobby airlock
// ---------------------------------------------------------------------------
const COLD_PLAN: PlanSpec = {
  plotSize: { w: 12, l: 14 },
  orientation: 5,
  rooms: [
    {
      id: "lobby",
      name: "Entry Lobby",
      type: "corridor",
      x: 4, y: 1, w: 4, l: 2,
      doors: [
        { x: 6, y: 1, width: 1.2, orientation: "horizontal" },
        { x: 6, y: 3, width: 1.2, orientation: "horizontal" },
      ],
      windows: [],
      details: "Thermal airlock. Prevents heat loss on entry.",
    },
    {
      id: "living",
      name: "Living Area",
      type: "living",
      x: 1, y: 3, w: 10, l: 4,
      doors: [
        { x: 5, y: 3, width: 1.2, orientation: "horizontal" },
        { x: 5, y: 7, width: 1.2, orientation: "horizontal" },
      ],
      windows: [
        { x: 2, y: 7, width: 3.5, orientation: "horizontal" }, // large south glass
        { x: 7, y: 7, width: 3.5, orientation: "horizontal" }, // large south glass
        { x: 1, y: 4.5, width: 0.8, orientation: "vertical" }, // small north window
      ],
      details: "Large south-facing glazing for passive solar gain. Thermal mass floor.",
    },
    {
      id: "kitchen",
      name: "Kitchen",
      type: "kitchen",
      x: 1, y: 7, w: 4, l: 4,
      doors: [{ x: 5, y: 9, width: 1, orientation: "vertical" }],
      windows: [
        { x: 1, y: 10, width: 1.2, orientation: "vertical" },
        { x: 3, y: 11, width: 1, orientation: "horizontal" },  // small south
      ],
      details: "Compact plan minimises exposed surface area.",
    },
    {
      id: "bed1",
      name: "Master Bedroom",
      type: "bedroom",
      x: 5, y: 7, w: 6, l: 4,
      doors: [{ x: 5, y: 8.5, width: 1.2, orientation: "vertical" }],
      windows: [
        { x: 7, y: 11, width: 2, orientation: "horizontal" },  // south-facing
        { x: 11, y: 9, width: 0.8, orientation: "vertical" },  // small east
      ],
      details: "South-facing bedroom benefits from morning sun. Insulated walls.",
    },
    {
      id: "bed2",
      name: "Bedroom 2",
      type: "bedroom",
      x: 1, y: 11, w: 6, l: 2,
      doors: [{ x: 4, y: 11, width: 1, orientation: "horizontal" }],
      windows: [
        { x: 3, y: 13, width: 1.5, orientation: "horizontal" },
      ],
      details: "Compact with minimal north glazing to retain heat.",
    },
    {
      id: "bath",
      name: "Bathroom",
      type: "bathroom",
      x: 7, y: 11, w: 4, l: 2,
      doors: [{ x: 7, y: 11.5, width: 1, orientation: "vertical" }],
      windows: [{ x: 9, y: 13, width: 0.8, orientation: "horizontal" }],
      details: "North/east placement insulated from prevailing cold wind.",
    },
    {
      id: "utility",
      name: "Utility / Store",
      type: "utility",
      x: 1, y: 1, w: 3, l: 2,
      doors: [{ x: 4, y: 2, width: 0.8, orientation: "vertical" }],
      windows: [],
      details: "Buffer zone on north side. Firewood storage.",
    },
  ],
};

// ---------------------------------------------------------------------------
// COMPOSITE — Courtyard + overhang shading, mixed window sizes for seasons
// Passive principles: shading in summer, solar gain in winter, cross-ventilation
// ---------------------------------------------------------------------------
const COMPOSITE_PLAN: PlanSpec = {
  plotSize: { w: 13, l: 15 },
  orientation: -15,
  rooms: [
    {
      id: "courtyard",
      name: "Inner Courtyard",
      type: "courtyard",
      x: 4, y: 5, w: 5, l: 5,
      doors: [],
      windows: [],
      details: "Semi-open courtyard. Summer cooling, winter wind block.",
    },
    {
      id: "living",
      name: "Living Area",
      type: "living",
      x: 1, y: 1, w: 11, l: 4,
      doors: [
        { x: 5.5, y: 1, width: 1.5, orientation: "horizontal" },
        { x: 5.5, y: 5, width: 1.5, orientation: "horizontal" },
      ],
      windows: [
        { x: 2, y: 1, width: 2, orientation: "horizontal" },
        { x: 8, y: 1, width: 2, orientation: "horizontal" },
        { x: 2, y: 5, width: 1.5, orientation: "horizontal" },
      ],
      details: "Mixed glazing. Overhangs shade in summer, let sun in winter.",
    },
    {
      id: "kitchen",
      name: "Kitchen",
      type: "kitchen",
      x: 1, y: 5, w: 3, l: 5,
      doors: [{ x: 4, y: 7.5, width: 1, orientation: "vertical" }],
      windows: [
        { x: 1, y: 6, width: 1.5, orientation: "vertical" },
        { x: 2, y: 10, width: 1.5, orientation: "horizontal" },
      ],
      details: "Cross-ventilation through courtyard. Shaded east window.",
    },
    {
      id: "bed1",
      name: "Master Bedroom",
      type: "bedroom",
      x: 9, y: 5, w: 3, l: 5,
      doors: [{ x: 9, y: 7.5, width: 1, orientation: "vertical" }],
      windows: [
        { x: 12, y: 6, width: 1.5, orientation: "vertical" },
        { x: 10, y: 10, width: 1.5, orientation: "horizontal" },
      ],
      details: "Shaded western window. Cross-ventilated.",
    },
    {
      id: "bed2",
      name: "Bedroom 2",
      type: "bedroom",
      x: 1, y: 10, w: 5, l: 4,
      doors: [{ x: 6, y: 11.5, width: 1, orientation: "vertical" }],
      windows: [
        { x: 3, y: 14, width: 2, orientation: "horizontal" },
      ],
      details: "South-facing for winter sun. Insulated for cold nights.",
    },
    {
      id: "bath",
      name: "Bathroom",
      type: "bathroom",
      x: 6, y: 10, w: 3, l: 4,
      doors: [{ x: 6, y: 13, width: 1, orientation: "vertical" }],
      windows: [{ x: 7.5, y: 14, width: 1.2, orientation: "horizontal" }],
      details: "Central placement minimises plumbing runs.",
    },
    {
      id: "utility",
      name: "Utility",
      type: "utility",
      x: 9, y: 10, w: 3, l: 4,
      doors: [{ x: 9, y: 11.5, width: 1, orientation: "vertical" }],
      windows: [],
      details: "Buffer zone on north-west.",
    },
  ],
};

// ---------------------------------------------------------------------------
// TEMPERATE — Balanced plan, moderate glazing, south orientation
// Passive principles: daylight balance, natural ventilation, moderate mass
// ---------------------------------------------------------------------------
const TEMPERATE_PLAN: PlanSpec = {
  plotSize: { w: 13, l: 14 },
  orientation: 0,
  rooms: [
    {
      id: "living",
      name: "Living / Dining",
      type: "living",
      x: 1, y: 1, w: 11, l: 5,
      doors: [
        { x: 5.5, y: 1, width: 1.5, orientation: "horizontal" },
        { x: 5.5, y: 6, width: 1.5, orientation: "horizontal" },
      ],
      windows: [
        { x: 2, y: 1, width: 2.5, orientation: "horizontal" },
        { x: 8, y: 1, width: 2.5, orientation: "horizontal" },
        { x: 1, y: 3.5, width: 1.5, orientation: "vertical" },
        { x: 12, y: 3.5, width: 1.5, orientation: "vertical" },
        { x: 3, y: 6, width: 3, orientation: "horizontal" },    // south glazing
      ],
      details: "Open plan with balanced glazing for daylight year-round.",
    },
    {
      id: "kitchen",
      name: "Kitchen",
      type: "kitchen",
      x: 1, y: 6, w: 4, l: 4,
      doors: [{ x: 5, y: 7.5, width: 1.2, orientation: "vertical" }],
      windows: [
        { x: 1, y: 7.5, width: 1.5, orientation: "vertical" },
        { x: 2, y: 10, width: 2, orientation: "horizontal" },
      ],
      details: "East-facing kitchen. Morning light for cooking.",
    },
    {
      id: "bed1",
      name: "Master Bedroom",
      type: "bedroom",
      x: 5, y: 6, w: 7, l: 4,
      doors: [{ x: 5, y: 7.5, width: 1.2, orientation: "vertical" }],
      windows: [
        { x: 8, y: 10, width: 2.5, orientation: "horizontal" },
        { x: 12, y: 8, width: 1.5, orientation: "vertical" },
      ],
      details: "South-facing glazing for passive solar in mild winters.",
    },
    {
      id: "bed2",
      name: "Bedroom 2",
      type: "bedroom",
      x: 1, y: 10, w: 5, l: 3,
      doors: [{ x: 3, y: 10, width: 1.2, orientation: "horizontal" }],
      windows: [
        { x: 2, y: 13, width: 2, orientation: "horizontal" },
        { x: 1, y: 11, width: 1, orientation: "vertical" },
      ],
      details: "Balanced natural light. Openable windows for ventilation.",
    },
    {
      id: "bath",
      name: "Bathroom",
      type: "bathroom",
      x: 6, y: 10, w: 3, l: 3,
      doors: [{ x: 6, y: 11.5, width: 1, orientation: "vertical" }],
      windows: [{ x: 7, y: 13, width: 1, orientation: "horizontal" }],
      details: "Naturally lit. Ventilated.",
    },
    {
      id: "utility",
      name: "Utility",
      type: "utility",
      x: 9, y: 10, w: 3, l: 3,
      doors: [{ x: 9, y: 11.5, width: 1, orientation: "vertical" }],
      windows: [{ x: 10, y: 13, width: 1, orientation: "horizontal" }],
      details: "Rear utility room. Laundry and storage.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Fallback (default for NEUTRAL / unknown)
// ---------------------------------------------------------------------------
export const mockPlanSpec: PlanSpec = COMPOSITE_PLAN;

// ---------------------------------------------------------------------------
// Zone key type (matches ClimateZone in vernacularDesigns.ts)
// ---------------------------------------------------------------------------
export type PlanZoneKey =
  | "HOT_DRY"
  | "WARM_HUMID"
  | "COLD"
  | "COMPOSITE"
  | "TEMPERATE"
  | "NEUTRAL";

const ZONE_PLANS: Record<PlanZoneKey, PlanSpec> = {
  HOT_DRY:    HOT_DRY_PLAN,
  WARM_HUMID: WARM_HUMID_PLAN,
  COLD:       COLD_PLAN,
  COMPOSITE:  COMPOSITE_PLAN,
  TEMPERATE:  TEMPERATE_PLAN,
  NEUTRAL:    COMPOSITE_PLAN, // sensible fallback
};

/**
 * Returns the zone-specific PlanSpec.
 * Safe: always returns a valid plan, never undefined.
 */
export function getPlanForZone(zone: string | null | undefined): PlanSpec {
  if (!zone) return COMPOSITE_PLAN;
  const key = zone.toUpperCase().replace(/[- ]/g, "_") as PlanZoneKey;
  return ZONE_PLANS[key] ?? COMPOSITE_PLAN;
}

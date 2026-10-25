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

export const mockPlanSpec: PlanSpec = {
  plotSize: { w: 12, l: 15 },
  orientation: -15, // 15 degrees west of north
  rooms: [
    {
      id: "courtyard",
      name: "Central Courtyard",
      type: "courtyard",
      x: 4, y: 5, w: 4, l: 5,
      doors: [],
      windows: [],
      details: "Passive cooling core, open to sky.",
    },
    {
      id: "living",
      name: "Living Area",
      type: "living",
      x: 1, y: 1, w: 10, l: 4,
      doors: [
        { x: 5.5, y: 1, width: 1.5, orientation: "horizontal" }, // Main entrance
        { x: 5.5, y: 5, width: 1.5, orientation: "horizontal" }  // To courtyard
      ],
      windows: [
        { x: 2, y: 1, width: 2, orientation: "horizontal" },
        { x: 8, y: 1, width: 2, orientation: "horizontal" }
      ],
      details: "High thermal mass walls on South.",
    },
    {
      id: "kitchen",
      name: "Kitchen",
      type: "kitchen",
      x: 1, y: 5, w: 3, l: 5,
      doors: [{ x: 4, y: 7, width: 1, orientation: "vertical" }],
      windows: [{ x: 1, y: 7, width: 1.5, orientation: "vertical" }],
      details: "Cross ventilation with courtyard.",
    },
    {
      id: "bed1",
      name: "Master Bedroom",
      type: "bedroom",
      x: 8, y: 5, w: 3, l: 5,
      doors: [{ x: 8, y: 7, width: 1, orientation: "vertical" }],
      windows: [{ x: 11, y: 7, width: 1.5, orientation: "vertical" }],
      details: "Shaded Eastern windows.",
    },
    {
      id: "bed2",
      name: "Bedroom 2",
      type: "bedroom",
      x: 1, y: 10, w: 5, l: 4,
      doors: [{ x: 6, y: 11.5, width: 1, orientation: "vertical" }],
      windows: [{ x: 3, y: 14, width: 2, orientation: "horizontal" }],
      details: "Cooling breezes from the North.",
    },
    {
      id: "bath",
      name: "Bathroom",
      type: "bathroom",
      x: 6, y: 10, w: 5, l: 4,
      doors: [{ x: 6, y: 13, width: 1, orientation: "vertical" }],
      windows: [{ x: 8, y: 14, width: 1.5, orientation: "horizontal" }],
      details: "Water recycling system connected.",
    }
  ]
};

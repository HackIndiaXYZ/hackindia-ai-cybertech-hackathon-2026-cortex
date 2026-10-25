export interface Requirement {
  id: string;
  title: string;
  recommendation: string;
  reason: string;
  iconType: "layout" | "walls" | "roof" | "windows" | "shading" | "ventilation" | "orientation" | "landscape";
}

export const mockRequirements: Requirement[] = [
  {
    id: "req-orientation",
    title: "Orientation",
    recommendation: "Align longer walls along the East-West axis.",
    reason: "Minimizes direct solar heat gain on the long facades during summer, reducing cooling loads significantly while allowing for controlled daylight.",
    iconType: "orientation",
  },
  {
    id: "req-layout",
    title: "Building Layout",
    recommendation: "Adopt a compact form with a central courtyard.",
    reason: "A courtyard induces micro-climate cooling through shading and allows cross-ventilation, while a compact form minimizes the surface-to-volume ratio exposed to outside heat.",
    iconType: "layout",
  },
  {
    id: "req-walls",
    title: "Wall Construction",
    recommendation: "Use high thermal mass materials like stone or rammed earth.",
    reason: "High thermal mass absorbs heat during the hot day and slowly releases it at night when temperatures drop, keeping the interior cooler during peak hours.",
    iconType: "walls",
  },
  {
    id: "req-roof",
    title: "Roof Design",
    recommendation: "Install a reflective or green roof with heavy insulation.",
    reason: "The roof receives the most direct solar radiation. Reflective surfaces bounce heat away, while insulation prevents the remaining heat from transferring into the living space.",
    iconType: "roof",
  },
  {
    id: "req-windows",
    title: "Windows & Glazing",
    recommendation: "Limit window size on East and West; use double glazing.",
    reason: "East and West windows receive low-angle, intense sun that is hard to shade. Double glazing prevents conductive heat transfer while allowing light.",
    iconType: "windows",
  },
  {
    id: "req-shading",
    title: "Shading Devices",
    recommendation: "Provide deep overhangs and external louvres on South windows.",
    reason: "South-facing windows receive high-angle sun in summer, which can be easily blocked by horizontal overhangs, preventing direct sunlight from entering the building.",
    iconType: "shading",
  },
  {
    id: "req-ventilation",
    title: "Ventilation Strategy",
    recommendation: "Design for night-time flush ventilation.",
    reason: "Since daytime air is too hot, closing the building during the day and opening high and low vents at night allows cool air to flush out the stored heat.",
    iconType: "ventilation",
  },
  {
    id: "req-landscape",
    title: "Landscaping",
    recommendation: "Plant deciduous trees on the South and West sides.",
    reason: "Deciduous trees provide dense shade during the hot summer months, but drop their leaves in winter to allow welcome solar gain when it is cold.",
    iconType: "landscape",
  },
];

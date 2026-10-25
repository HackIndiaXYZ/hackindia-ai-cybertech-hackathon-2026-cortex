import type { ShelterDesign } from "../types";
export { mockWeather } from "./weather";
export { mockClimateData } from "./climate";
export { mockZoneRisk } from "./zoneRisk";



export const mockShelterDesigns: ShelterDesign[] = [
  {
    id: "sd-001",
    name: "Earthen Vault House",
    zone: "HOT_DRY",
    description:
      "A thick-walled adobe structure with a barrel-vaulted roof that exploits thermal mass to keep interiors cool during the day and warm at night.",
    features: [
      "Thick earthen walls (450 mm)",
      "Barrel-vaulted roof for rain-water collection",
      "North-facing courtyard with water feature",
      "Deep-set windows with mashrabiya screens",
    ],
    materials: ["Adobe bricks", "Lime plaster", "Terracotta tiles", "Timber"],
    imageAlt: "Cross-section of an earthen vault house in a desert landscape",
  },
  {
    id: "sd-002",
    name: "Elevated Breeze Pavilion",
    zone: "WARM_HUMID",
    description:
      "A stilted, open-plan pavilion with a wide overhanging roof designed for maximum cross-ventilation in tropical coastal climates.",
    features: [
      "Raised floor (600 mm above ground)",
      "Wide eaves (1.2 m overhang)",
      "Louvred wall panels for ventilation control",
      "Green roof for insulation and rain attenuation",
    ],
    materials: [
      "Bamboo",
      "Sustainably sourced timber",
      "Recycled galvanised steel",
    ],
    imageAlt: "Elevated bamboo pavilion surrounded by tropical vegetation",
  },
  {
    id: "sd-003",
    name: "Passive Solar Courtyard",
    zone: "COMPOSITE",
    description:
      "A central-courtyard dwelling that harvests winter sun while shading summer heat, adaptable to wide seasonal temperature swings.",
    features: [
      "South-facing glazing for winter solar gain",
      "Adjustable external louvres",
      "Thermal mass concrete floors",
      "Night-flush ventilation via central courtyard stack",
    ],
    materials: ["Concrete", "Double-glazed glass", "Timber frame", "Brick"],
    imageAlt: "Courtyard house with adjustable solar louvres",
  },
  {
    id: "sd-004",
    name: "Timber Frame Eco-Cottage",
    zone: "TEMPERATE",
    description:
      "A compact, well-insulated timber-frame cottage optimised for temperate climates with generous daylighting.",
    features: [
      "Structural insulated panels (SIP)",
      "Triple-glazed windows",
      "Rainwater harvesting tank",
      "Heat-recovery ventilation (MVHR)",
    ],
    materials: ["Engineered timber", "SIP panels", "Sheep-wool insulation"],
    imageAlt: "Timber-frame cottage in a temperate garden setting",
  },
  {
    id: "sd-005",
    name: "Earth-Bermed Snow Shelter",
    zone: "COLD",
    description:
      "A semi-subterranean earth-bermed home that uses the ground as insulation and minimises exposure to harsh cold-climate winds.",
    features: [
      "Earth berms on three sides",
      "South-facing triple-glazed wall",
      "Turf roof for thermal buffering",
      "Airlock entrance vestibule",
    ],
    materials: [
      "Reinforced concrete",
      "Rigid foam insulation (300 mm)",
      "Turf",
      "Timber",
    ],
    imageAlt:
      "Earth-bermed house partially buried in a snowy alpine landscape",
  },
];



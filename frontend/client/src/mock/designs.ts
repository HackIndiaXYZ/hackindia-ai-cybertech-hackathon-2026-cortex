export interface DesignScores {
  comfort: number;
  cost: number;
  safety: number;
  sustainability: number;
}

export interface DesignModel {
  id: string;
  name: string;
  scores: DesignScores;
  description: string;
  reasons: string[];
}

export const mockDesigns: DesignModel[] = [
  {
    id: "design-a",
    name: "Rammed Earth Courtyard",
    scores: {
      comfort: 85,
      cost: 50,
      safety: 90,
      sustainability: 95,
    },
    description: "Traditional high-mass walls with passive courtyard ventilation.",
    reasons: [
      "Excellent thermal mass",
      "Very low embodied carbon",
      "Slower construction time"
    ]
  },
  {
    id: "design-b",
    name: "Lightweight Stilt Home",
    scores: {
      comfort: 70,
      cost: 95,
      safety: 75,
      sustainability: 65,
    },
    description: "Timber and corrugated steel elevated to capture breezes.",
    reasons: [
      "Extremely cost effective",
      "Great for humid zones",
      "Lower cyclonic resilience"
    ]
  },
  {
    id: "design-c",
    name: "Hybrid Masonry Pod",
    scores: {
      comfort: 95,
      cost: 40,
      safety: 85,
      sustainability: 80,
    },
    description: "Insulated masonry with advanced shading structures.",
    reasons: [
      "Maximum comfort control",
      "High upfront cost",
      "Durable against storms"
    ]
  },
  {
    id: "design-d",
    name: "Bamboo A-Frame",
    scores: {
      comfort: 60,
      cost: 90,
      safety: 60,
      sustainability: 90,
    },
    description: "Fast-deploy bamboo structure focusing on renewable materials.",
    reasons: [
      "Rapid to build",
      "Highly renewable material",
      "High maintenance needs"
    ]
  }
];

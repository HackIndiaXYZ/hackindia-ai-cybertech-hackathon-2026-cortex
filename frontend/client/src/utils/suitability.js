/**
 * suitability.js
 * ------------------------------------------------------------------
 * Location-aware & Climate-accurate Vernacular Suitability Engine
 *
 * Suitability is NOT a trivial climate-label match. It computes performance
 * from the physical passive features required by the target NBC/ECBC climate zone:
 *
 *  - Composite:
 *      * roof and wall insulation (20%)
 *      * external shading & reduced east/west gain (25%)
 *      * cross-ventilation when outdoor conditions allow (20%)
 *      * rainwater drainage and monsoon protection (15%)
 *      * thermal mass where appropriate (20%)
 *
 *  - Hot-Dry:
 *      * high thermal mass (30%)
 *      * external shading & solar control (30%)
 *      * envelope insulation (20%)
 *      * nocturnal / convective ventilation (20%)
 *
 *  - Warm-Humid:
 *      * continuous cross-ventilation (35%)
 *      * monsoon and flood protection / stilts / steep overhangs (25%)
 *      * external shading (25%)
 *      * low thermal mass / lightweight materials (15%)
 *
 *  - Cold:
 *      * envelope insulation (35%)
 *      * thermal mass / hearth storage (25%)
 *      * steep snow/precipitation shedding (25%)
 *      * solar access / reduced shading (15%)
 *
 *  - Temperate:
 *      * cross-ventilation (30%)
 *      * moderate shading (25%)
 *      * insulation (25%)
 *      * moderate thermal mass (20%)
 *
 * Output contract:
 *   {
 *     status: "Suitable" | "Partially suitable" | "Not suitable" | "Not yet evaluated",
 *     score: number (0 - 100),
 *     reasons: string[],
 *     limitations: string[],
 *     summary: string
 *   }
 *
 * Rule: If a house has too many `null` features (>= 4 nulls out of 6),
 * return status "Not yet evaluated" with message:
 * "Not yet evaluated for <location> until its features are assessed."
 * ------------------------------------------------------------------
 */

/**
 * Normalizes input zone strings to standard format:
 * "Composite", "Hot-Dry", "Warm-Humid", "Temperate", "Cold"
 */
export function normalizeZone(zone) {
  if (!zone || typeof zone !== "string") return null;
  const clean = zone.trim().toLowerCase().replace(/[\s_-]+/g, " ");

  if (clean.includes("composite") || clean.includes("variable")) {
    return "Composite";
  }
  if (clean.includes("hot") && clean.includes("dry")) {
    return "Hot-Dry";
  }
  if (clean.includes("humid")) {
    return "Warm-Humid";
  }
  if (clean.includes("cold")) {
    return "Cold";
  }
  if (clean.includes("temperate") || clean.includes("moderate")) {
    return "Temperate";
  }
  return null;
}

/**
 * Computes suitability of a house design for a target climate zone.
 *
 * @param {Object} house - Design object with passiveFeatures
 * @param {string} targetZone - Target climate zone (e.g. "Composite", "Hot-Dry", etc.)
 * @param {string} [locationName] - Optional name of the city/district (e.g. "Kanpur")
 */
export function evaluateSuitability(house, targetZone, locationName = "") {
  const normZone = normalizeZone(targetZone);
  const locLabel = locationName ? locationName.trim() : "";

  if (!normZone) {
    return {
      status: "Not evaluated",
      score: 0,
      reasons: ["Select an Indian city or district to evaluate climate suitability."],
      limitations: [],
      summary: "No location selected",
    };
  }

  const features = house?.passiveFeatures || {};
  const featureKeys = [
    "insulation",
    "externalShading",
    "eastWestGainControl",
    "crossVentilation",
    "monsoonRainProtection",
    "thermalMass",
  ];

  // Count null / unknown features
  let nullCount = 0;
  for (const k of featureKeys) {
    if (features[k] === null || features[k] === undefined) {
      nullCount++;
    }
  }

  // If too many features are unknown (>= 4 out of 6, i.e. more than half), assessment is incomplete
  if (nullCount >= 4) {
    const unevaluatedText = locLabel
      ? `Not yet evaluated for ${locLabel}`
      : "Not yet evaluated";
    return {
      status: "Not yet evaluated",
      score: 0,
      reasons: [
        locLabel
          ? `Not yet evaluated for ${locLabel} until its features are assessed.`
          : "Not yet evaluated until its features are assessed.",
      ],
      limitations: [
        "Passive feature dataset is incomplete; empirical field verification required.",
      ],
      summary: unevaluatedText,
    };
  }

  const reasons = [];
  const limitations = [];
  let score = 0;

  switch (normZone) {
    case "Composite": {
      // 1. Roof and wall insulation (20 pts)
      if (features.insulation === true) {
        score += 20;
        reasons.push(
          "Envelope insulation mitigates severe summer heat peaks and retains indoor warmth during winter nights."
        );
      } else if (features.insulation === false) {
        limitations.push(
          "Lacks envelope insulation, risking heavy radiant heat ingress in summer and winter heat loss."
        );
      } else {
        limitations.push("Insulation performance rating is unverified.");
      }

      // 2. External shading & reduced east/west gain (25 pts total)
      let shadingScore = 0;
      if (features.externalShading === true) shadingScore += 15;
      if (features.eastWestGainControl === true) shadingScore += 10;

      if (shadingScore === 25) {
        score += 25;
        reasons.push(
          "External shading and east/west heat-gain control prevent intense low-angle summer solar radiation."
        );
      } else if (shadingScore > 0) {
        score += shadingScore;
        reasons.push(
          "Includes partial shading features that reduce peak daytime solar heating."
        );
        if (features.eastWestGainControl === false) {
          limitations.push("Unprotected east/west facades admit intense morning and late afternoon sun.");
        }
      } else {
        limitations.push(
          "Absence of external shading exposes building envelope to scorching summer heat."
        );
      }

      // 3. Cross-ventilation when outdoor conditions allow (20 pts)
      if (features.crossVentilation === true) {
        score += 20;
        reasons.push(
          "Effective cross-ventilation promotes cooling airflow during humid monsoon spells."
        );
      } else if (features.crossVentilation === false) {
        limitations.push(
          "Insufficient cross-ventilation causes severe stuffiness during humid monsoon periods."
        );
      } else {
        limitations.push("Ventilation permeability unassessed.");
      }

      // 4. Rainwater drainage and monsoon protection (15 pts)
      if (features.monsoonRainProtection === true) {
        score += 15;
        reasons.push(
          "Robust monsoon protection and rainwater runoff channels prevent dampness and water accumulation."
        );
      } else if (features.monsoonRainProtection === false) {
        limitations.push(
          "Vulnerable to water seepage and pooling during intense monsoon downpours."
        );
      } else {
        limitations.push("Monsoon resilience unverified.");
      }

      // 5. Thermal mass where appropriate (20 pts)
      if (features.thermalMass === true) {
        score += 20;
        reasons.push(
          "High thermal mass dampens wide diurnal temperature swings typical of composite seasons."
        );
      } else if (features.thermalMass === false) {
        // Severe penalty in composite climates due to extreme seasonal swings (45°C summer, 5°C winter)
        score = Math.max(0, score - 15);
        limitations.push(
          "Lightweight zero-mass construction cannot buffer composite seasonal extremes (45°C summer heatwaves and chilly 5°C winter nights)."
        );
      } else {
        limitations.push("Thermal mass characteristics unassessed.");
      }
      break;
    }

    case "Hot-Dry": {
      // 1. High Thermal mass (30 pts)
      if (features.thermalMass === true) {
        score += 30;
        reasons.push("Dense thermal mass buffers extreme arid day-night temperature swings.");
      } else if (features.thermalMass === false) {
        limitations.push("Low thermal mass fails to insulate interior from desert heat extremes.");
      }

      // 2. External shading & solar control (30 pts)
      let shadingPts = 0;
      if (features.externalShading === true) shadingPts += 15;
      if (features.eastWestGainControl === true) shadingPts += 15;
      if (shadingPts > 0) {
        score += shadingPts;
        reasons.push("Shading devices and small apertures deflect fierce desert radiation.");
      } else {
        limitations.push("Lacks external shading against direct desert solar glare.");
      }

      // 3. Envelope insulation (20 pts)
      if (features.insulation === true) {
        score += 20;
        reasons.push("Envelope insulation resists conductive heat transfer from hot ambient air.");
      }

      // 4. Convective / Stack ventilation (20 pts)
      if (features.crossVentilation === true) {
        score += 20;
        reasons.push("Stack ventilation purges stored internal heat during cooler night hours.");
      }
      break;
    }

    case "Warm-Humid": {
      // 1. Continuous cross-ventilation (35 pts)
      if (features.crossVentilation === true) {
        score += 35;
        reasons.push("Continuous cross-ventilation facilitates skin evaporation in humid conditions.");
      } else {
        limitations.push("Inadequate natural ventilation traps moisture and warm air.");
      }

      // 2. Monsoon & rainwater protection (25 pts)
      if (features.monsoonRainProtection === true) {
        score += 25;
        reasons.push("Steep runoff roofs and raised platforms prevent ground moisture and flood risk.");
      } else {
        limitations.push("Susceptible to ground moisture and tropical downpours.");
      }

      // 3. External shading (25 pts)
      if (features.externalShading === true) {
        score += 25;
        reasons.push("Generous roof overhangs shade openings while remaining porous to breezes.");
      } else {
        limitations.push("Direct solar exposure raises indoor humidity discomfort.");
      }

      // 4. Low thermal mass preferred (15 pts)
      if (features.thermalMass === false) {
        score += 15;
        reasons.push("Lightweight envelope cools quickly at sunset without re-radiating stored heat.");
      } else if (features.thermalMass === true) {
        limitations.push("Heavy thermal mass retains heat into warm, humid tropical nights.");
      }
      break;
    }

    case "Cold": {
      // 1. Envelope insulation (35 pts)
      if (features.insulation === true) {
        score += 35;
        reasons.push("Heavy insulation layer minimises conductive heat loss in freezing conditions.");
      } else {
        limitations.push("Insufficient insulation causes dangerous cold bridging and heat loss.");
      }

      // 2. Thermal mass / core heat storage (25 pts)
      if (features.thermalMass === true) {
        score += 25;
        reasons.push("Thermal core and masonry mass store heat from hearth and passive solar gain.");
      }

      // 3. Snow / precipitation shedding (25 pts)
      if (features.monsoonRainProtection === true) {
        score += 25;
        reasons.push("Steep pitch prevents structural overload from heavy winter snow and freezing rain.");
      } else {
        limitations.push("Inadequate roof pitch poses risk of snow and ice accumulation.");
      }

      // 4. Solar capture without over-shading (15 pts)
      if (features.externalShading === false || features.externalShading === null) {
        score += 15;
        reasons.push("Unimpeded solar access allows beneficial low-angle winter sunlight warming.");
      } else {
        limitations.push("Excessive external shading obstructs crucial winter solar radiation.");
      }

      // Excess cross-ventilation penalty in sub-zero climates
      if (features.crossVentilation === true) {
        score = Math.max(0, score - 15);
        limitations.push("High ventilation porosity risks freezing cold air infiltration.");
      }
      break;
    }

    case "Temperate": {
      // Moderate balance
      if (features.crossVentilation === true) {
        score += 30;
        reasons.push("Good airflow maintains indoor comfort during mild afternoon hours.");
      }
      if (features.externalShading === true) {
        score += 25;
        reasons.push("Solar shading prevents seasonal overheating during warmer months.");
      }
      if (features.insulation === true) {
        score += 25;
        reasons.push("Envelope insulation preserves stable ambient indoor temperatures.");
      }
      if (features.thermalMass === true) {
        score += 20;
        reasons.push("Moderate thermal mass maintains steady indoor temperatures.");
      }
      break;
    }
  }

  // Derive status from score
  let status = "Not suitable";
  if (score >= 70) {
    status = "Suitable";
  } else if (score >= 40) {
    status = "Partially suitable";
  }

  const summary = `${status} (${score}%)`;

  return {
    status,
    score,
    reasons,
    limitations,
    summary,
  };
}

/**
 * Ranks an array of vernacular house designs according to their computed suitability
 * for the selected climate zone.
 *
 * Ranking hierarchy:
 *  1. "Suitable" (highest score first)
 *  2. "Partially suitable" (highest score first)
 *  3. "Not yet evaluated" (original order preserved)
 *  4. "Not suitable" (sorted by score descending)
 */
export function rankDesignsBySuitability(designs, targetZone, locationName = "") {
  if (!targetZone) {
    return designs.map((d) => ({
      ...d,
      suitability: evaluateSuitability(d, null, locationName),
    }));
  }

  const evaluated = designs.map((d) => ({
    ...d,
    suitability: evaluateSuitability(d, targetZone, locationName),
  }));

  const statusPriority = {
    "Suitable": 1,
    "Partially suitable": 2,
    "Not yet evaluated": 3,
    "Not suitable": 4,
    "Not evaluated": 5,
  };

  return evaluated.sort((a, b) => {
    const priorityA = statusPriority[a.suitability.status] || 99;
    const priorityB = statusPriority[b.suitability.status] || 99;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    // Secondary sort by score
    return b.suitability.score - a.suitability.score;
  });
}

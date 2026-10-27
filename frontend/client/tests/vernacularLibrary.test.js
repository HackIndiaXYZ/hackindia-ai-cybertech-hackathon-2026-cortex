import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  resolveLocationClimate,
  findNearestVerifiedCity,
  getAllSearchableLocations,
} from "../src/data/locationClimateZones.js";

import {
  VERNACULAR_DESIGNS,
} from "../src/data/vernacularDesigns.ts";

import {
  evaluateSuitability,
  rankDesignsBySuitability,
  normalizeZone,
} from "../src/utils/suitability.js";

describe("1. Location Climate Zone Lookup (NBC 2016 / ECBC)", () => {
  test("Kanpur gives Composite", () => {
    const resFromCity = resolveLocationClimate("Kanpur");
    assert.equal(resFromCity.zone, "Composite");
    assert.equal(resFromCity.unclassified, false);

    const resFromDistrict = resolveLocationClimate("Kanpur Nagar");
    assert.equal(resFromDistrict.zone, "Composite");
    assert.match(resFromDistrict.source, /NBC 2016/);
  });

  test("Jaipur gives Hot-Dry", () => {
    const res = resolveLocationClimate("Jaipur");
    assert.equal(res.zone, "Hot-Dry");
    assert.equal(res.unclassified, false);
    assert.match(res.source, /NBC 2016/);
  });

  test("Chennai gives Warm-Humid", () => {
    const res = resolveLocationClimate("Chennai");
    assert.equal(res.zone, "Warm-Humid");
    assert.equal(res.unclassified, false);
    assert.match(res.source, /NBC 2016/);
  });

  test("Shimla gives Cold", () => {
    const res = resolveLocationClimate("Shimla");
    assert.equal(res.zone, "Cold");
    assert.equal(res.unclassified, false);
    assert.match(res.source, /NBC 2016/);
  });

  test("Fallback to nearest listed city: Unnao falls back to Kanpur Nagar", () => {
    // Unnao is ~18km from Kanpur Nagar
    const res = resolveLocationClimate("Unnao");
    assert.equal(res.isFallback, true);
    assert.equal(res.nearestCity, "Kanpur Nagar");
    assert.equal(res.zone, "Composite");
    assert.equal(res.fallbackText, "Nearest listed city: Kanpur Nagar");
  });

  test("Unclassified location returns 'Climate zone not classified' and skips ranking", () => {
    const res = resolveLocationClimate("Atlantis Unknown Realm");
    assert.equal(res.zone, null);
    assert.equal(res.unclassified, true);
    assert.equal(res.message, "Climate zone not classified");
  });
});

describe("2. House Data Integrity & Passive Features", () => {
  test("Saltbox origin is unchanged and keeps original classification", () => {
    const saltbox = VERNACULAR_DESIGNS.find((d) => d.id === "new-england-saltbox");
    assert.ok(saltbox, "Saltbox must exist in catalogue");
    assert.equal(saltbox.climateZone, "TEMPERATE");
    assert.equal(saltbox.originClimateZone, "TEMPERATE");
  });

  test("Houses contain verifiable passiveFeatures with nulls for unknown attributes", () => {
    const saltbox = VERNACULAR_DESIGNS.find((d) => d.id === "new-england-saltbox");
    assert.ok(saltbox.passiveFeatures);
    assert.equal(saltbox.passiveFeatures.insulation, null);
    assert.equal(saltbox.passiveFeatures.externalShading, null);
    assert.equal(saltbox.passiveFeatures.crossVentilation, null);
    assert.equal(saltbox.passiveFeatures.thermalMass, null);

    const haveli = VERNACULAR_DESIGNS.find((d) => d.id === "courtyard-haveli");
    assert.equal(haveli.passiveFeatures.thermalMass, true);
    assert.equal(haveli.passiveFeatures.externalShading, true);
    assert.equal(haveli.passiveFeatures.insulation, null); // unknown from data, not false
  });

  test("New England Saltbox shows 'Not yet evaluated for Kanpur'", () => {
    const saltbox = VERNACULAR_DESIGNS.find((d) => d.id === "new-england-saltbox");
    const result = evaluateSuitability(saltbox, "Composite", "Kanpur");
    assert.equal(result.status, "Not yet evaluated");
    assert.equal(result.summary, "Not yet evaluated for Kanpur");
    assert.ok(
      result.reasons[0].includes("Not yet evaluated for Kanpur until its features are assessed.")
    );
  });
});

describe("3. Climate-Accurate Suitability Engine", () => {
  test("Composite Jaali Haveli is Suitable for Composite zone (Kanpur)", () => {
    const haveli = VERNACULAR_DESIGNS.find((d) => d.id === "composite-courtyard");
    const result = evaluateSuitability(haveli, "Composite", "Kanpur");
    assert.equal(result.status, "Suitable");
    assert.ok(result.score >= 70);
    assert.ok(result.reasons.length > 0);
  });

  test("Malay Kampung House is Not Suitable for Composite climate extremes", () => {
    const kampung = VERNACULAR_DESIGNS.find((d) => d.id === "malay-kampung");
    const result = evaluateSuitability(kampung, "Composite", "Kanpur");
    assert.equal(result.status, "Not suitable");
    assert.ok(result.score < 40);
  });

  test("Malay Kampung House is Suitable for Warm-Humid (Chennai)", () => {
    const kampung = VERNACULAR_DESIGNS.find((d) => d.id === "malay-kampung");
    const result = evaluateSuitability(kampung, "Warm-Humid", "Chennai");
    assert.equal(result.status, "Suitable");
    assert.ok(result.score >= 70);
  });

  test("Alpine Chalet is Suitable for Cold (Shimla)", () => {
    const chalet = VERNACULAR_DESIGNS.find((d) => d.id === "alpine-chalet");
    const result = evaluateSuitability(chalet, "Cold", "Shimla");
    assert.equal(result.status, "Suitable");
    assert.ok(result.score >= 70);
  });
});

describe("4. Dynamic Ranking & 'All' Filter Behavior", () => {
  test("The 'All' filter shows every house (all 7 designs)", () => {
    assert.equal(VERNACULAR_DESIGNS.length, 7);
    const ranked = rankDesignsBySuitability(VERNACULAR_DESIGNS, "Composite", "Kanpur");
    assert.equal(ranked.length, 7);
  });

  test("Changing location re-ranks the list dynamically", () => {
    // Under Kanpur (Composite), Composite Jaali Haveli should rank top
    const kanpurRanked = rankDesignsBySuitability(VERNACULAR_DESIGNS, "Composite", "Kanpur");
    assert.equal(kanpurRanked[0].id, "composite-courtyard");

    // Under Chennai (Warm-Humid), Malay Kampung or Bamboo Longhouse should rank top
    const chennaiRanked = rankDesignsBySuitability(VERNACULAR_DESIGNS, "Warm-Humid", "Chennai");
    assert.ok(
      chennaiRanked[0].id === "malay-kampung" || chennaiRanked[0].id === "bamboo-longhouse"
    );

    // Verify order changed between Kanpur and Chennai
    assert.notEqual(kanpurRanked[0].id, chennaiRanked[0].id);

    // Under Shimla (Cold), Alpine Chalet should rank top
    const shimlaRanked = rankDesignsBySuitability(VERNACULAR_DESIGNS, "Cold", "Shimla");
    assert.equal(shimlaRanked[0].id, "alpine-chalet");
  });
});

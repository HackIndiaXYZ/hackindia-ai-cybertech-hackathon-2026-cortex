import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { analyzeService } from "../src/services/analyzeService.ts";

describe("recommendDesigns Service API Client Tests", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("1. Success: sends coordinates and weights, parses recommendation response", async () => {
    const mockPayload = {
      location: {
        latitude: 28.6139,
        longitude: 77.209,
        name: "New Delhi",
        country: "India",
      },
      features_used: {
        latitude: 28.6139,
        hottest_month_max: 40.2,
        coldest_month_min: 7.8,
        coldest_month_mean: 14.2,
        hot_season_humidity: 45.0,
        annual_rain: 780.0,
        wind_mean: 12.5,
        solar_mean: 22.0,
        days_above_40: 35,
        days_below_5: 0,
      },
      designs: [
        {
          id: "haveli_courtyard",
          name: "Haveli Courtyard House",
          plan_archetype: "COURTYARD",
          scores: { comfort: 88, cost: 72, safety: 85, sustainability: 90 },
          total: 83.75,
          reasons: ["Courtyard promotes nocturnal convective cooling."],
          rank: 1,
        },
      ],
      weights_used: { comfort: 0.25, cost: 0.25, safety: 0.25, sustainability: 0.25 },
      model_info: {
        name: "GradientBoostingRegressor (MultiOutput)",
        version: "v1.0.0",
        source: "backend/app/models/design_model_v1.joblib",
      },
    };

    let capturedUrl = "";
    let capturedOptions = null;

    globalThis.fetch = async (url, options) => {
      capturedUrl = String(url);
      capturedOptions = options;
      return {
        ok: true,
        status: 200,
        json: async () => mockPayload,
      };
    };

    const result = await analyzeService.recommendDesigns(
      28.6139,
      77.209,
      { comfort: 30, cost: 30, safety: 20, sustainability: 20 },
      3
    );

    assert.match(capturedUrl, /\/api\/designs\/recommend$/);
    assert.equal(capturedOptions.method, "POST");
    assert.equal(capturedOptions.headers["Content-Type"], "application/json");

    const sentBody = JSON.parse(capturedOptions.body);
    assert.equal(sentBody.latitude, 28.6139);
    assert.equal(sentBody.longitude, 77.209);
    assert.deepEqual(sentBody.weights, {
      comfort: 30,
      cost: 30,
      safety: 20,
      sustainability: 20,
    });
    assert.equal(sentBody.top_n, 3);

    assert.equal(result.designs.length, 1);
    assert.equal(result.designs[0].id, "haveli_courtyard");
    assert.equal(result.designs[0].rank, 1);
    assert.equal(result.model_info.name, "GradientBoostingRegressor (MultiOutput)");
  });

  test("2. 503 Model Unavailable: extracts error message from backend detail object", async () => {
    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 503,
        json: async () => ({
          detail: {
            code: "MODEL_NOT_AVAILABLE",
            message: "Design recommendation ML model is not available. Please ensure design_model_v1.joblib is deployed.",
          },
        }),
      };
    };

    await assert.rejects(
      async () => {
        await analyzeService.recommendDesigns(28.6139, 77.209);
      },
      (err) => {
        assert(err instanceof Error);
        assert.match(err.message, /Design recommendation ML model is not available/);
        return true;
      }
    );
  });

  test("3. Network Error: handles dropped connection or fetch rejection gracefully", async () => {
    globalThis.fetch = async () => {
      throw new TypeError("Failed to fetch (Network connection error)");
    };

    await assert.rejects(
      async () => {
        await analyzeService.recommendDesigns(28.6139, 77.209);
      },
      (err) => {
        assert(err instanceof TypeError);
        assert.match(err.message, /Failed to fetch/);
        return true;
      }
    );
  });

  test("4. Non-JSON Server Error: handles raw text 500 error gracefully", async () => {
    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 500,
        json: async () => {
          throw new SyntaxError("Unexpected token < in JSON at position 0");
        },
        text: async () => "Internal Server Error Gateway Timeout",
      };
    };

    await assert.rejects(
      async () => {
        await analyzeService.recommendDesigns(28.6139, 77.209);
      },
      (err) => {
        assert(err instanceof Error);
        assert.match(err.message, /Internal Server Error Gateway Timeout/);
        return true;
      }
    );
  });
});

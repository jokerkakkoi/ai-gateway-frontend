import { describe, expect, it } from "vitest";
import {
  createApiKeyRecord,
  calculateMonthlySpend,
  calculateQuotaUsagePercent,
  estimateTokenCost,
  flagKeyRisks,
  maskApiKeySecret,
  projectBudgetBurn
} from "./finops";

describe("AI gateway FinOps calculations", () => {
  it("estimates input/output token cost by model price per million tokens", () => {
    const cost = estimateTokenCost({
      inputTokens: 40000,
      outputTokens: 8000,
      inputPricePerMTok: 5,
      outputPricePerMTok: 15
    });

    expect(cost).toBeCloseTo(0.32, 5);
  });

  it("aggregates monthly spend from usage rows and model prices", () => {
    const total = calculateMonthlySpend(
      [
        { model: "gpt-4.1", inputTokens: 1200000, outputTokens: 340000 },
        { model: "claude-3.7", inputTokens: 800000, outputTokens: 120000 }
      ],
      {
        "gpt-4.1": { inputPricePerMTok: 5, outputPricePerMTok: 15 },
        "claude-3.7": { inputPricePerMTok: 3, outputPricePerMTok: 15 }
      }
    );

    expect(total).toBeCloseTo(15.3, 5);
  });

  it("projects budget burn using elapsed month ratio", () => {
    const burn = projectBudgetBurn({
      spendToDate: 8421,
      monthlyBudget: 12000,
      elapsedDays: 18,
      daysInMonth: 30
    });

    expect(burn.usedRatio).toBeCloseTo(0.70175, 5);
    expect(burn.projectedSpend).toBeCloseTo(14035, 5);
    expect(burn.projectedRatio).toBeCloseTo(1.16958, 5);
    expect(burn.status).toBe("overrun");
  });

  it("calculates quota usage percent from spend and quota limit", () => {
    expect(calculateQuotaUsagePercent({ spend: 2100, quotaUsd: 3300 })).toBe(64);
    expect(calculateQuotaUsagePercent({ spend: 120, quotaUsd: 0 })).toBe(0);
    expect(calculateQuotaUsagePercent({ spend: 1400, quotaUsd: 1000 })).toBe(100);
  });

  it("flags risky API keys by quota usage and unusual spend velocity", () => {
    const risks = flagKeyRisks([
      { name: "prod-agent", quotaUsedRatio: 0.86, dailySpendDeltaRatio: 0.18 },
      { name: "batch-sum", quotaUsedRatio: 0.48, dailySpendDeltaRatio: 0.44 },
      { name: "sandbox", quotaUsedRatio: 0.36, dailySpendDeltaRatio: 0.08 }
    ]);

    expect(risks).toEqual([
      { name: "prod-agent", reasons: ["quota"] },
      { name: "batch-sum", reasons: ["velocity"] }
    ]);
  });

  it("masks API key secrets while preserving recognizable prefix and suffix", () => {
    expect(maskApiKeySecret("sk-45ce0abcdefghijklmnopqrstuvwxyza781")).toBe("sk-45ce0********************a781");
  });

  it("creates API key records from a name and generated secret", () => {
    const record = createApiKeyRecord({
      name: "  Laptop OpenCode  ",
      secret: "sk-11b97abcdefghijklmnop9008",
      createdAt: "2026-06-08",
      id: "key-1"
    });

    expect(record).toEqual({
      id: "key-1",
      name: "Laptop OpenCode",
      secret: "sk-11b97abcdefghijklmnop9008",
      maskedKey: "sk-11b97********************9008",
      createdAt: "2026-06-08",
      lastUsedAt: "从未使用"
    });
  });

  it("rejects empty API key names", () => {
    expect(() =>
      createApiKeyRecord({
        name: "   ",
        secret: "sk-11b97abcdefghijklmnop9008",
        createdAt: "2026-06-08",
        id: "key-1"
      })
    ).toThrow("API key name is required");
  });
});

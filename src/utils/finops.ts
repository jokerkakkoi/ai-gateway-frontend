export type Price = {
  inputPricePerMTok: number;
  outputPricePerMTok: number;
};

export type UsageRow = {
  model: string;
  inputTokens: number;
  outputTokens: number;
};

export type BudgetProjectionInput = {
  spendToDate: number;
  monthlyBudget: number;
  elapsedDays: number;
  daysInMonth: number;
};

export type BudgetProjection = {
  usedRatio: number;
  projectedSpend: number;
  projectedRatio: number;
  status: "healthy" | "watch" | "overrun";
};

export type ApiKeyHealth = {
  name: string;
  quotaUsedRatio: number;
  dailySpendDeltaRatio: number;
};

export type ApiKeyRisk = {
  name: string;
  reasons: Array<"quota" | "velocity">;
};

export type ManagedApiKey = {
  id: string;
  name: string;
  secret: string;
  maskedKey: string;
  createdAt: string;
  lastUsedAt: string;
};

export function calculateQuotaUsagePercent({ spend, quotaUsd }: { spend: number; quotaUsd: number }): number {
  if (quotaUsd <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((spend / quotaUsd) * 100));
}

export function estimateTokenCost({
  inputTokens,
  outputTokens,
  inputPricePerMTok,
  outputPricePerMTok
}: {
  inputTokens: number;
  outputTokens: number;
  inputPricePerMTok: number;
  outputPricePerMTok: number;
}): number {
  return (inputTokens / 1_000_000) * inputPricePerMTok + (outputTokens / 1_000_000) * outputPricePerMTok;
}

export function calculateMonthlySpend(rows: UsageRow[], prices: Record<string, Price>): number {
  return rows.reduce((total, row) => {
    const price = prices[row.model];
    if (!price) {
      return total;
    }

    return total + estimateTokenCost({ ...price, inputTokens: row.inputTokens, outputTokens: row.outputTokens });
  }, 0);
}

export function projectBudgetBurn({
  spendToDate,
  monthlyBudget,
  elapsedDays,
  daysInMonth
}: BudgetProjectionInput): BudgetProjection {
  const usedRatio = monthlyBudget <= 0 ? 0 : spendToDate / monthlyBudget;
  const elapsedRatio = daysInMonth <= 0 ? 1 : Math.min(1, Math.max(0.01, elapsedDays / daysInMonth));
  const projectedSpend = spendToDate / elapsedRatio;
  const projectedRatio = monthlyBudget <= 0 ? 0 : projectedSpend / monthlyBudget;
  const status = projectedRatio >= 1 ? "overrun" : projectedRatio >= 0.85 ? "watch" : "healthy";

  return {
    usedRatio,
    projectedSpend,
    projectedRatio,
    status
  };
}

export function flagKeyRisks(keys: ApiKeyHealth[]): ApiKeyRisk[] {
  return keys.flatMap((key) => {
    const reasons: ApiKeyRisk["reasons"] = [];

    if (key.quotaUsedRatio >= 0.8) {
      reasons.push("quota");
    }

    if (key.dailySpendDeltaRatio >= 0.35) {
      reasons.push("velocity");
    }

    return reasons.length > 0 ? [{ name: key.name, reasons }] : [];
  });
}

export function maskApiKeySecret(secret: string): string {
  if (secret.length <= 12) {
    return secret;
  }

  return `${secret.slice(0, 8)}${"*".repeat(20)}${secret.slice(-4)}`;
}

export function createApiKeyRecord({
  id,
  name,
  secret,
  createdAt,
  lastUsedAt = "从未使用"
}: {
  id: string;
  name: string;
  secret: string;
  createdAt: string;
  lastUsedAt?: string;
}): ManagedApiKey {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("API key name is required");
  }

  return {
    id,
    name: trimmedName,
    secret,
    maskedKey: maskApiKeySecret(secret),
    createdAt,
    lastUsedAt
  };
}

export function generateApiKeySecret() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(28);

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  const body = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `sk-${body}`;
}

export { formatCompactNumber, formatCurrency } from "./format";

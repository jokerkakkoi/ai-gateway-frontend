import { calculateQuotaUsagePercent, createApiKeyRecord, type ManagedApiKey, type Price, type UsageRow } from "../utils/finops";
import type { BillingQueueItem, FinOpsDashboardSnapshot, GovernanceRule, QuotaMember, QuotaMemberStatus } from "../store/finOpsTypes";

export const mockModelPrices: Record<string, Price> = {
  "GPT-4.1": { inputPricePerMTok: 5, outputPricePerMTok: 15 },
  "Claude 3.7": { inputPricePerMTok: 3, outputPricePerMTok: 15 },
  "Gemini 2.5": { inputPricePerMTok: 1.25, outputPricePerMTok: 10 },
  "DeepSeek R1": { inputPricePerMTok: 0.55, outputPricePerMTok: 2.19 }
};

export const mockUsageRows: UsageRow[] = [
  { model: "GPT-4.1", inputTokens: 514_000_000, outputTokens: 143_000_000 },
  { model: "Claude 3.7", inputTokens: 304_000_000, outputTokens: 91_000_000 },
  { model: "Gemini 2.5", inputTokens: 426_000_000, outputTokens: 62_000_000 },
  { model: "DeepSeek R1", inputTokens: 790_000_000, outputTokens: 168_000_000 }
];

export const mockGovernanceRules: GovernanceRule[] = [
  { name: "生产 Key 达到 80% 额度自动预警", target: "prod-*", status: "enabled", budget: "$8,000", owner: "平台组" },
  { name: "高价模型调用需要审批", target: "GPT-4.1 / Claude", status: "draft", budget: "$1,200", owner: "财务运营" },
  { name: "个人免费池每月 30 美元", target: "个人模式", status: "enabled", budget: "$30 / 人", owner: "所有团队" },
  { name: "异常日增幅超过 35% 自动冻结", target: "全部 Key", status: "enabled", budget: "动态", owner: "安全组" }
];

export const mockBillingQueue: BillingQueueItem[] = [
  { id: "INV-0620", team: "研发平台", amount: 3270, status: "待归因", cycle: "2026-06" },
  { id: "INV-0618", team: "数据应用", amount: 1190, status: "待审批", cycle: "2026-06" },
  { id: "CR-042", team: "增长团队", amount: -284, status: "节省入账", cycle: "2026-06" }
];

export const mockTrend = [42, 58, 49, 71, 64, 83, 76, 91, 88, 69, 97, 82, 74, 93];

export function createMockDashboardSnapshot(): FinOpsDashboardSnapshot {
  return {
    modelPrices: { ...mockModelPrices },
    usageRows: mockUsageRows.map((row) => ({ ...row })),
    governanceRules: mockGovernanceRules.map((rule) => ({ ...rule })),
    billingQueue: mockBillingQueue.map((item) => ({ ...item })),
    trend: [...mockTrend],
    managedKeys: createInitialApiKeys(),
    members: createInitialMembers()
  };
}

export function createQuotaMember({
  id,
  name,
  role,
  team,
  quotaUsd,
  spend,
  requests,
  tokenShare
}: Omit<QuotaMember, "quotaPercent" | "status">): QuotaMember {
  const quotaPercent = calculateQuotaUsagePercent({ spend, quotaUsd });

  return {
    id,
    name,
    role,
    team,
    quotaUsd,
    spend,
    requests,
    tokenShare,
    quotaPercent,
    status: quotaStatusFromPercent(quotaPercent)
  };
}

export function quotaStatusFromPercent(quotaPercent: number): QuotaMemberStatus {
  if (quotaPercent >= 100) return "超限";
  if (quotaPercent >= 80) return "关注";
  return "正常";
}

function createInitialApiKeys(): ManagedApiKey[] {
  return [
    createApiKeyRecord({
      id: "key-laptop",
      name: "Laptop",
      secret: "sk-45ce0abcdefghijklmnopqrstuvwxyza781",
      createdAt: "2026-04-29",
      lastUsedAt: "2026-05-11"
    }),
    createApiKeyRecord({
      id: "key-laptop-opencode",
      name: "Laptop OpenCode",
      secret: "sk-11b97abcdefghijklmnop9008",
      createdAt: "2026-05-27",
      lastUsedAt: "2026-06-04"
    }),
    createApiKeyRecord({
      id: "key-pchome-opencode",
      name: "PCHome OpenCode",
      secret: "sk-831b7abcdefghijklmnopqrst8ff8",
      createdAt: "2026-05-27",
      lastUsedAt: "2026-05-27"
    })
  ];
}

function createInitialMembers(): QuotaMember[] {
  return [
    createQuotaMember({ id: "member-lin", name: "林舒", role: "Owner", team: "研发平台", quotaUsd: 2700, spend: 2480, requests: 18600, tokenShare: 38 }),
    createQuotaMember({ id: "member-ada", name: "Ada Chen", role: "Admin", team: "数据应用", quotaUsd: 3150, spend: 2100, requests: 14280, tokenShare: 27 }),
    createQuotaMember({ id: "member-zhou", name: "周遥", role: "Member", team: "增长", quotaUsd: 1850, spend: 820, requests: 6930, tokenShare: 21 }),
    createQuotaMember({ id: "member-mika", name: "Mika", role: "Member", team: "个人池", quotaUsd: 620, spend: 112, requests: 1080, tokenShare: 5 })
  ];
}

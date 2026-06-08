import { create } from "zustand";
import { calculateQuotaUsagePercent, createApiKeyRecord, formatCurrency, type ManagedApiKey, type Price } from "./finops";

export type Section = "overview" | "usage" | "keys" | "billing" | "models" | "routing" | "approvals" | "settings";
export type ViewMode = "team" | "personal";
export type KeyDialog = { mode: "create" } | { mode: "edit"; keyId: string };

export type GovernanceRule = {
  name: string;
  target: string;
  status: "enabled" | "draft";
  budget: string;
  owner: string;
};

export type QuotaMember = {
  id: string;
  name: string;
  role: string;
  team: string;
  quotaPercent: number;
  quotaUsd: number;
  spend: number;
  requests: number;
  tokenShare: number;
  status: "正常" | "关注" | "超限";
};

export type BillingQueueItem = {
  id: string;
  team: string;
  amount: number;
  status: string;
  cycle: string;
};

type FinOpsStore = {
  viewMode: ViewMode;
  period: string;
  selectedModel: string;
  inputTokens: number;
  outputTokens: number;
  requests: number;
  searchQuery: string;
  managedKeys: ManagedApiKey[];
  keyDialog: KeyDialog | null;
  keyName: string;
  createdSecret: string | null;
  deleteTarget: ManagedApiKey | null;
  enabledRules: Set<string>;
  drawer: string | null;
  toast: string;
  sidebarOpen: boolean;
  members: QuotaMember[];
  setViewMode: (viewMode: ViewMode) => void;
  setPeriod: (period: string) => void;
  setSelectedModel: (model: string) => void;
  setInputTokens: (value: number) => void;
  setOutputTokens: (value: number) => void;
  setRequests: (value: number) => void;
  setSearchQuery: (query: string) => void;
  setDrawer: (drawer: string | null) => void;
  setToast: (toast: string) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleRule: (ruleName: string) => void;
  openCreateKeyDialog: () => void;
  openEditKeyDialog: (key: ManagedApiKey) => void;
  setKeyDialog: (dialog: KeyDialog | null) => void;
  setKeyName: (name: string) => void;
  submitKeyDialog: () => void;
  setDeleteTarget: (key: ManagedApiKey | null) => void;
  deleteKey: () => void;
  increaseMemberQuota: (memberId: string) => void;
};

export const modelPrices: Record<string, Price> = {
  "GPT-4.1": { inputPricePerMTok: 5, outputPricePerMTok: 15 },
  "Claude 3.7": { inputPricePerMTok: 3, outputPricePerMTok: 15 },
  "Gemini 2.5": { inputPricePerMTok: 1.25, outputPricePerMTok: 10 },
  "DeepSeek R1": { inputPricePerMTok: 0.55, outputPricePerMTok: 2.19 }
};

export const usageRows = [
  { model: "GPT-4.1", inputTokens: 514_000_000, outputTokens: 143_000_000 },
  { model: "Claude 3.7", inputTokens: 304_000_000, outputTokens: 91_000_000 },
  { model: "Gemini 2.5", inputTokens: 426_000_000, outputTokens: 62_000_000 },
  { model: "DeepSeek R1", inputTokens: 790_000_000, outputTokens: 168_000_000 }
];

export const governanceRules: GovernanceRule[] = [
  { name: "生产 Key 达到 80% 额度自动预警", target: "prod-*", status: "enabled", budget: "$8,000", owner: "平台组" },
  { name: "高价模型调用需要审批", target: "GPT-4.1 / Claude", status: "draft", budget: "$1,200", owner: "财务运营" },
  { name: "个人免费池每月 30 美元", target: "个人模式", status: "enabled", budget: "$30 / 人", owner: "所有团队" },
  { name: "异常日增幅超过 35% 自动冻结", target: "全部 Key", status: "enabled", budget: "动态", owner: "安全组" }
];

export const billingQueue: BillingQueueItem[] = [
  { id: "INV-0620", team: "研发平台", amount: 3270, status: "待归因", cycle: "2026-06" },
  { id: "INV-0618", team: "数据应用", amount: 1190, status: "待审批", cycle: "2026-06" },
  { id: "CR-042", team: "增长团队", amount: -284, status: "节省入账", cycle: "2026-06" }
];

export const trend = [42, 58, 49, 71, 64, 83, 76, 91, 88, 69, 97, 82, 74, 93];

const initialApiKeys: ManagedApiKey[] = [
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

const initialMembers: QuotaMember[] = [
  createQuotaMember({ id: "member-lin", name: "林舟", role: "Owner", team: "研发平台", quotaUsd: 2700, spend: 2480, requests: 18600, tokenShare: 38 }),
  createQuotaMember({ id: "member-ada", name: "Ada Chen", role: "Admin", team: "数据应用", quotaUsd: 3150, spend: 2100, requests: 14280, tokenShare: 27 }),
  createQuotaMember({ id: "member-zhou", name: "周遥", role: "Member", team: "增长", quotaUsd: 1850, spend: 820, requests: 6930, tokenShare: 21 }),
  createQuotaMember({ id: "member-mika", name: "Mika", role: "Member", team: "个人池", quotaUsd: 620, spend: 112, requests: 1080, tokenShare: 5 })
];

const initialEnabledRuleNames = new Set(["生产 Key 达到 80% 额度自动预警", "个人免费池每月 30 美元", "异常日增幅超过 35% 自动冻结"]);

function createInitialState() {
  return {
    viewMode: "team" as const,
    period: "2026-06",
    selectedModel: "GPT-4.1",
    inputTokens: 40_000,
    outputTokens: 8_000,
    requests: 120,
    searchQuery: "",
    managedKeys: [...initialApiKeys],
    keyDialog: null,
    keyName: "",
    createdSecret: null,
    deleteTarget: null,
    enabledRules: new Set(initialEnabledRuleNames),
    drawer: null,
    toast: "团队治理台已加载",
    sidebarOpen: false,
    members: [...initialMembers]
  };
}

export const useFinOpsStore = create<FinOpsStore>((set, get) => ({
  ...createInitialState(),
  setViewMode: (viewMode) => set({ viewMode }),
  setPeriod: (period) => set({ period }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setInputTokens: (inputTokens) => set({ inputTokens }),
  setOutputTokens: (outputTokens) => set({ outputTokens }),
  setRequests: (requests) => set({ requests }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setDrawer: (drawer) => set({ drawer }),
  setToast: (toast) => set({ toast }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleRule: (ruleName) =>
    set((state) => {
      const enabledRules = new Set(state.enabledRules);
      const enabled = enabledRules.has(ruleName);

      if (enabled) {
        enabledRules.delete(ruleName);
      } else {
        enabledRules.add(ruleName);
      }

      return {
        enabledRules,
        toast: enabled ? `已暂停规则：${ruleName}` : `已启用规则：${ruleName}`
      };
    }),
  openCreateKeyDialog: () => set({ keyName: "", createdSecret: null, keyDialog: { mode: "create" } }),
  openEditKeyDialog: (key) => set({ keyName: key.name, createdSecret: null, keyDialog: { mode: "edit", keyId: key.id } }),
  setKeyDialog: (keyDialog) => set({ keyDialog }),
  setKeyName: (keyName) => set({ keyName }),
  submitKeyDialog: () => {
    const { keyDialog, keyName } = get();
    const trimmedName = keyName.trim();

    if (!trimmedName) {
      set({ toast: "请输入 API Key 名称" });
      return;
    }

    if (keyDialog?.mode === "edit") {
      set((state) => ({
        managedKeys: state.managedKeys.map((key) => (key.id === keyDialog.keyId ? { ...key, name: trimmedName } : key)),
        toast: "API Key 名称已更新",
        keyDialog: null
      }));
      return;
    }

    const secret = generateApiKeySecret();
    const record = createApiKeyRecord({
      id: `key-${Date.now()}`,
      name: trimmedName,
      secret,
      createdAt: new Date().toISOString().slice(0, 10)
    });

    set((state) => ({
      managedKeys: [record, ...state.managedKeys],
      createdSecret: secret,
      keyName: record.name,
      toast: "API Key 已创建，请立即复制保存"
    }));
  },
  setDeleteTarget: (deleteTarget) => set({ deleteTarget }),
  deleteKey: () => {
    const { deleteTarget } = get();

    if (!deleteTarget) return;

    set((state) => ({
      managedKeys: state.managedKeys.filter((key) => key.id !== deleteTarget.id),
      toast: `${deleteTarget.name} 已删除`,
      deleteTarget: null
    }));
  },
  increaseMemberQuota: (memberId) =>
    set((state) => {
      let toast = state.toast;
      const members = state.members.map((member) => {
        if (member.id !== memberId) {
          return member;
        }

        const quotaUsd = member.quotaUsd + 150;
        const quotaPercent = calculateQuotaUsagePercent({ spend: member.spend, quotaUsd });
        toast = `${member.name} 额度已提升到 ${formatCurrency(quotaUsd)}，使用率更新为 ${quotaPercent}%`;

        return {
          ...member,
          quotaPercent,
          quotaUsd,
          status: quotaStatusFromPercent(quotaPercent)
        };
      });

      return { members, toast };
    })
}));

function generateApiKeySecret() {
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

function createQuotaMember({
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

function quotaStatusFromPercent(quotaPercent: number): QuotaMember["status"] {
  if (quotaPercent >= 100) return "超限";
  if (quotaPercent >= 80) return "关注";
  return "正常";
}

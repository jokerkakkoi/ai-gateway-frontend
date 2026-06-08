import type { ManagedApiKey, Price, UsageRow } from "../utils/finops";

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

export type QuotaMemberStatus = "正常" | "关注" | "超限";

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
  status: QuotaMemberStatus;
};

export type BillingQueueItem = {
  id: string;
  team: string;
  amount: number;
  status: string;
  cycle: string;
};

export type FinOpsDashboardSnapshot = {
  modelPrices: Record<string, Price>;
  usageRows: UsageRow[];
  governanceRules: GovernanceRule[];
  billingQueue: BillingQueueItem[];
  trend: number[];
  managedKeys: ManagedApiKey[];
  members: QuotaMember[];
};

export type FinOpsStore = FinOpsDashboardSnapshot & {
  viewMode: ViewMode;
  period: string;
  selectedModel: string;
  inputTokens: number;
  outputTokens: number;
  requests: number;
  searchQuery: string;
  keyDialog: KeyDialog | null;
  keyName: string;
  createdSecret: string | null;
  deleteTarget: ManagedApiKey | null;
  enabledRules: Set<string>;
  drawer: string | null;
  toast: string;
  sidebarOpen: boolean;
  loadDashboard: () => Promise<void>;
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
  submitKeyDialog: () => Promise<void>;
  setDeleteTarget: (key: ManagedApiKey | null) => void;
  deleteKey: () => Promise<void>;
  increaseMemberQuota: (memberId: string) => Promise<void>;
};

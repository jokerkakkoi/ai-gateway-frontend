import { create } from "zustand";
import type { ManagedApiKey } from "../utils/finops";
import { finOpsApi } from "../services/api";
import { createMockDashboardSnapshot } from "../services/mockData";
import type { FinOpsDashboardSnapshot, FinOpsStore } from "./finOpsTypes";

function enabledRuleNamesFromSnapshot(snapshot: FinOpsDashboardSnapshot) {
  return new Set(snapshot.governanceRules.filter((rule) => rule.status === "enabled").map((rule) => rule.name));
}

function createInitialState() {
  const dashboard = createMockDashboardSnapshot();

  return {
    ...dashboard,
    viewMode: "team" as const,
    period: "2026-06",
    selectedModel: "GPT-4.1",
    inputTokens: 40_000,
    outputTokens: 8_000,
    requests: 120,
    searchQuery: "",
    keyDialog: null,
    keyName: "",
    createdSecret: null,
    deleteTarget: null,
    enabledRules: enabledRuleNamesFromSnapshot(dashboard),
    drawer: null,
    toast: "团队治理台已加载",
    sidebarOpen: false
  };
}

export const useFinOpsStore = create<FinOpsStore>((set, get) => ({
  ...createInitialState(),
  loadDashboard: async () => {
    const dashboard = await finOpsApi.fetchDashboard();
    set({
      ...dashboard,
      enabledRules: enabledRuleNamesFromSnapshot(dashboard),
      toast: "团队治理台已加载"
    });
  },
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
  openEditKeyDialog: (key: ManagedApiKey) => set({ keyName: key.name, createdSecret: null, keyDialog: { mode: "edit", keyId: key.id } }),
  setKeyDialog: (keyDialog) => set({ keyDialog }),
  setKeyName: (keyName) => set({ keyName }),
  submitKeyDialog: async () => {
    const { keyDialog, keyName } = get();
    const trimmedName = keyName.trim();

    if (!trimmedName) {
      set({ toast: "请输入 API Key 名称" });
      return;
    }

    if (keyDialog?.mode === "edit") {
      const managedKeys = await finOpsApi.renameApiKey(get().managedKeys, { keyId: keyDialog.keyId, name: trimmedName });
      set({
        managedKeys,
        toast: "API Key 名称已更新",
        keyDialog: null
      });
      return;
    }

    const { record, secret } = await finOpsApi.createApiKey({ name: trimmedName });

    set((state) => ({
      managedKeys: [record, ...state.managedKeys],
      createdSecret: secret,
      keyName: record.name,
      toast: "API Key 已创建，请立即复制保存"
    }));
  },
  setDeleteTarget: (deleteTarget) => set({ deleteTarget }),
  deleteKey: async () => {
    const { deleteTarget } = get();

    if (!deleteTarget) return;

    const managedKeys = await finOpsApi.deleteApiKey(get().managedKeys, deleteTarget.id);

    set({
      managedKeys,
      toast: `${deleteTarget.name} 已删除`,
      deleteTarget: null
    });
  },
  increaseMemberQuota: async (memberId) => {
    const result = await finOpsApi.increaseMemberQuota(get().members, memberId);

    set({
      members: result.members,
      toast: result.toast
    });
  }
}));

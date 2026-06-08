import { beforeEach, describe, expect, it } from "vitest";
import { useFinOpsStore } from "./useFinOpsStore";

beforeEach(() => {
  useFinOpsStore.setState(useFinOpsStore.getInitialState(), true);
});

describe("FinOps Zustand store", () => {
  it("keeps dashboard controls and quota adjustments in shared state", async () => {
    const store = useFinOpsStore.getState();

    store.setViewMode("personal");
    store.setPeriod("2026-05");
    store.setSearchQuery("Ada");
    await store.increaseMemberQuota("member-ada");

    const updated = useFinOpsStore.getState();

    expect(updated.viewMode).toBe("personal");
    expect(updated.period).toBe("2026-05");
    expect(updated.searchQuery).toBe("Ada");
    expect(updated.members.find((member) => member.id === "member-ada")?.quotaPercent).toBe(64);
    expect(updated.toast).toBe("Ada Chen 额度已提升到 $3,300，使用率更新为 64%");
  });

  it("creates, renames, and deletes managed API keys through store actions", async () => {
    let store = useFinOpsStore.getState();

    store.openCreateKeyDialog();
    store.setKeyName("Notebook Agent");
    await store.submitKeyDialog();

    store = useFinOpsStore.getState();
    const created = store.managedKeys[0];

    expect(created.name).toBe("Notebook Agent");
    expect(created.secret).toMatch(/^sk-/);
    expect(store.createdSecret).toBe(created.secret);

    store.openEditKeyDialog(created);
    store.setKeyName("Notebook Worker");
    await useFinOpsStore.getState().submitKeyDialog();

    store = useFinOpsStore.getState();
    expect(store.managedKeys[0].name).toBe("Notebook Worker");

    store.setDeleteTarget(store.managedKeys[0]);
    await useFinOpsStore.getState().deleteKey();

    expect(useFinOpsStore.getState().managedKeys.some((key) => key.name === "Notebook Worker")).toBe(false);
  });
});

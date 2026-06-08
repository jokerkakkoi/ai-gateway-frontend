import { describe, expect, it } from "vitest";
import { finOpsApi } from "./api";

describe("mock FinOps API", () => {
  it("returns isolated dashboard snapshots", async () => {
    const first = await finOpsApi.fetchDashboard();
    const second = await finOpsApi.fetchDashboard();

    first.members[0].quotaUsd = 1;
    first.managedKeys[0].name = "mutated";

    expect(second.members[0].quotaUsd).toBe(2700);
    expect(second.managedKeys[0].name).toBe("Laptop");
  });

  it("creates API keys through a fake backend response with one-time secret", async () => {
    const created = await finOpsApi.createApiKey({ name: " Notebook Agent " });

    expect(created.record.name).toBe("Notebook Agent");
    expect(created.secret).toMatch(/^sk-/);
    expect(created.record.secret).toBe(created.secret);
    expect(created.record.maskedKey).not.toBe(created.secret);
    expect(created.record.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

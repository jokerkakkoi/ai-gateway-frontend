import type { ManagedApiKey } from "../utils/finops";
import { calculateQuotaUsagePercent, createApiKeyRecord, formatCurrency, generateApiKeySecret } from "../utils/finops";
import type { FinOpsDashboardSnapshot, QuotaMember } from "../store/finOpsTypes";
import { createMockDashboardSnapshot, quotaStatusFromPercent } from "./mockData";

type CreateApiKeyInput = {
  name: string;
};

type RenameApiKeyInput = {
  keyId: string;
  name: string;
};

function clonePlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function mockRequest<T>(value: T): Promise<T> {
  return Promise.resolve(clonePlain(value));
}

export const finOpsApi = {
  async fetchDashboard(): Promise<FinOpsDashboardSnapshot> {
    return mockRequest(createMockDashboardSnapshot());
  },

  async createApiKey({ name }: CreateApiKeyInput): Promise<{ record: ManagedApiKey; secret: string }> {
    const secret = generateApiKeySecret();
    const record = createApiKeyRecord({
      id: `key-${Date.now()}`,
      name,
      secret,
      createdAt: new Date().toISOString().slice(0, 10)
    });

    return mockRequest({ record, secret });
  },

  async renameApiKey(keys: ManagedApiKey[], { keyId, name }: RenameApiKeyInput): Promise<ManagedApiKey[]> {
    return mockRequest(keys.map((key) => (key.id === keyId ? { ...key, name: name.trim() } : key)));
  },

  async deleteApiKey(keys: ManagedApiKey[], keyId: string): Promise<ManagedApiKey[]> {
    return mockRequest(keys.filter((key) => key.id !== keyId));
  },

  async increaseMemberQuota(members: QuotaMember[], memberId: string): Promise<{ members: QuotaMember[]; toast: string }> {
    let toast = "";
    const updatedMembers = members.map((member) => {
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

    return mockRequest({ members: updatedMembers, toast });
  }
};

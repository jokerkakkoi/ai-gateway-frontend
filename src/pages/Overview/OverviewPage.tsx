import { Gauge, KeyRound, Sparkles, WalletCards } from "lucide-react";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { ApiKeyTable } from "../../components/ApiKeyTable";
import { BillingQueue } from "../../components/BillingQueue";
import { BudgetPanel } from "../../components/BudgetPanel";
import { GovernanceRules } from "../../components/GovernanceRules";
import { MembersPanel } from "../../components/MembersPanel";
import { MetricCard } from "../../components/MetricCard";
import { TokenCalculator } from "../../components/TokenCalculator";
import { useBudgetProjection } from "../../hooks/useBudgetProjection";
import { useClipboardToast } from "../../hooks/useClipboardToast";
import { useFilteredFinOpsData } from "../../hooks/useFilteredFinOpsData";
import { useFinOpsStore } from "../../store";
import { calculateMonthlySpend, estimateTokenCost } from "../../utils/finops";
import { formatCompactNumber, formatCurrency } from "../../utils/format";

export function OverviewPage() {
  const copyValue = useClipboardToast();
  const budget = useBudgetProjection();
  const { filteredKeys } = useFilteredFinOpsData();
  const {
    viewMode,
    modelPrices,
    usageRows,
    selectedModel,
    inputTokens,
    outputTokens,
    requests,
    managedKeys,
    enabledRules,
    governanceRules,
    billingQueue,
    trend,
    members,
    setSelectedModel,
    setInputTokens,
    setOutputTokens,
    setRequests,
    setDrawer,
    setToast,
    toggleRule,
    openCreateKeyDialog,
    openEditKeyDialog,
    setDeleteTarget
  } = useFinOpsStore(
    useShallow((state) => ({
      viewMode: state.viewMode,
      modelPrices: state.modelPrices,
      usageRows: state.usageRows,
      selectedModel: state.selectedModel,
      inputTokens: state.inputTokens,
      outputTokens: state.outputTokens,
      requests: state.requests,
      managedKeys: state.managedKeys,
      enabledRules: state.enabledRules,
      governanceRules: state.governanceRules,
      billingQueue: state.billingQueue,
      trend: state.trend,
      members: state.members,
      setSelectedModel: state.setSelectedModel,
      setInputTokens: state.setInputTokens,
      setOutputTokens: state.setOutputTokens,
      setRequests: state.setRequests,
      setDrawer: state.setDrawer,
      setToast: state.setToast,
      toggleRule: state.toggleRule,
      openCreateKeyDialog: state.openCreateKeyDialog,
      openEditKeyDialog: state.openEditKeyDialog,
      setDeleteTarget: state.setDeleteTarget
    }))
  );

  const monthlySpend = useMemo(() => calculateMonthlySpend(usageRows, modelPrices), [modelPrices, usageRows]);
  const tokenCost = estimateTokenCost({ ...modelPrices[selectedModel], inputTokens, outputTokens });
  const batchCost = tokenCost * requests;

  return (
    <>
      <section className="summary-grid">
        <MetricCard icon={WalletCards} label="本月成本" value={formatCurrency(8421)} detail={`模型计费 ${formatCurrency(monthlySpend, 1)}`} tone="rose" />
        <MetricCard icon={Gauge} label="预算投影" value={`${Math.round(budget.projectedRatio * 100)}%`} detail={budget.status === "overrun" ? "预计超预算" : "预算健康"} tone="green" />
        <MetricCard icon={Sparkles} label="Token 总量" value={formatCompactNumber(2_034_000_000)} detail="输入 78% / 输出 22%" tone="teal" />
        <MetricCard icon={KeyRound} label="API Keys" value={`${managedKeys.length}`} detail={`${filteredKeys.length} 条匹配当前搜索`} tone="amber" />
      </section>

      <section className="content-layout">
        <div className="primary-stack">
          <BudgetPanel projection={budget} trend={trend} viewMode={viewMode} />
          <GovernanceRules rules={governanceRules} enabledRules={enabledRules} onToggle={toggleRule} onEdit={setDrawer} />
          <ApiKeyTable
            filteredKeys={filteredKeys}
            onCreate={openCreateKeyDialog}
            onCopy={(key) => copyValue(key.secret, `已复制 ${key.name} 的完整 Key`)}
            onEdit={openEditKeyDialog}
            onDelete={setDeleteTarget}
          />
        </div>

        <aside className="right-rail">
          <TokenCalculator
            modelPrices={modelPrices}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            inputTokens={inputTokens}
            setInputTokens={setInputTokens}
            outputTokens={outputTokens}
            setOutputTokens={setOutputTokens}
            requests={requests}
            setRequests={setRequests}
            tokenCost={tokenCost}
            batchCost={batchCost}
          />
          <BillingQueue items={billingQueue} acknowledge={setToast} />
          <MembersPanel members={members} />
        </aside>
      </section>
    </>
  );
}

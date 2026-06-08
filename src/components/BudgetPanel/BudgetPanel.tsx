import { ArrowDownUp } from "lucide-react";
import type { CSSProperties } from "react";
import type { BudgetProjection } from "../../utils/finops";
import { formatCurrency } from "../../utils/format";
import type { ViewMode } from "../../store";

type BudgetPanelProps = {
  projection: BudgetProjection;
  trend: number[];
  viewMode: ViewMode;
};

export function BudgetPanel({ projection, trend, viewMode }: BudgetPanelProps) {
  return (
    <section className="panel budget-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">{viewMode === "team" ? "团队预算" : "个人预算"}</p>
          <h2>预算燃尽与 Token 趋势</h2>
        </div>
        <button className="ghost-button">
          <ArrowDownUp size={16} />
          分摊规则
        </button>
      </div>
      <div className="budget-grid">
        <div className="burn-card">
          <div className="ring" style={{ "--value": `${Math.min(projection.projectedRatio * 100, 100)}` } as CSSProperties}>
            <span>{Math.round(projection.projectedRatio * 100)}%</span>
          </div>
          <div>
            <h3>{formatCurrency(projection.projectedSpend)} 预计月末成本</h3>
            <p>当前已使用 {Math.round(projection.usedRatio * 100)}% 预算。按当前速率，月末会超过安全线，需要审批或路由降本。</p>
          </div>
        </div>
        <div className="trend-card">
          <div className="chart-bars" aria-label="Token 趋势图">
            {trend.map((height, index) => (
              <span key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="legend-row">
            <span>
              <i className="dot rose-dot" />
              输出 Token
            </span>
            <span>
              <i className="dot green-dot" />
              输入 Token
            </span>
            <span>
              <i className="dot teal-dot" />
              路由节省
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

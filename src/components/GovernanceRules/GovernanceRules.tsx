import { Clock3, MoreHorizontal, ShieldCheck, SlidersHorizontal } from "lucide-react";
import type { GovernanceRule } from "../../store";

type GovernanceRulesProps = {
  rules: GovernanceRule[];
  enabledRules: Set<string>;
  onToggle: (name: string) => void;
  onEdit: (name: string) => void;
};

export function GovernanceRules({ rules, enabledRules, onToggle, onEdit }: GovernanceRulesProps) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Policy Guard</p>
          <h2>限额规则</h2>
        </div>
        <button className="primary-button" onClick={() => onEdit("新建限额规则")}>
          <SlidersHorizontal size={16} />
          新建规则
        </button>
      </div>
      <div className="rule-list">
        {rules.map((rule) => {
          const enabled = enabledRules.has(rule.name);
          return (
            <div className="rule-row" key={rule.name}>
              <div className={`rule-status ${enabled ? "enabled" : "draft"}`}>
                {enabled ? <ShieldCheck size={18} /> : <Clock3 size={18} />}
              </div>
              <div>
                <strong>{rule.name}</strong>
                <span>
                  {rule.target} / {rule.owner}
                </span>
              </div>
              <span className="budget-pill">{rule.budget}</span>
              <button className={`toggle ${enabled ? "on" : ""}`} onClick={() => onToggle(rule.name)} aria-label={`切换 ${rule.name}`}>
                <span />
              </button>
              <button className="icon-button" onClick={() => onEdit(rule.name)} title="编辑规则" aria-label="编辑规则">
                <MoreHorizontal size={18} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

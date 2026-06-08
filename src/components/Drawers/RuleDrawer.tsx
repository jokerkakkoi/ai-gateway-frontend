import { Check, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useFinOpsStore } from "../../store";

export function RuleDrawer() {
  const { drawer, setDrawer, setToast } = useFinOpsStore(
    useShallow((state) => ({
      drawer: state.drawer,
      setDrawer: state.setDrawer,
      setToast: state.setToast
    }))
  );

  if (!drawer) return null;

  return (
    <div className="drawer-backdrop" role="presentation" onClick={() => setDrawer(null)}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="编辑限额规则" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <p className="eyebrow">限额规则</p>
            <h2>{drawer}</h2>
          </div>
          <button className="icon-button" onClick={() => setDrawer(null)} title="关闭" aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <label>
          月度预算
          <input value="$1,200" readOnly />
        </label>
        <label>
          触发条件
          <select defaultValue="80">
            <option value="80">额度使用达到 80%</option>
            <option value="35">日成本增长超过 35%</option>
            <option value="approval">高价模型审批</option>
          </select>
        </label>
        <label>
          处理动作
          <select defaultValue="notify">
            <option value="notify">通知 Owner 并创建审批</option>
            <option value="pause">暂停 Key</option>
            <option value="route">切换到成本优先路由</option>
          </select>
        </label>
        <button
          className="primary-button"
          onClick={() => {
            setToast("限额规则已保存");
            setDrawer(null);
          }}
        >
          <Check size={16} />
          保存规则
        </button>
      </aside>
    </div>
  );
}

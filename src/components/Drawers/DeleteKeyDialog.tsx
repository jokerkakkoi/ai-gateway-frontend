import { Trash2, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useFinOpsStore } from "../../store";

export function DeleteKeyDialog() {
  const { deleteTarget, setDeleteTarget, deleteKey } = useFinOpsStore(
    useShallow((state) => ({
      deleteTarget: state.deleteTarget,
      setDeleteTarget: state.setDeleteTarget,
      deleteKey: state.deleteKey
    }))
  );

  if (!deleteTarget) return null;

  return (
    <div className="drawer-backdrop" role="presentation" onClick={() => setDeleteTarget(null)}>
      <aside className="drawer confirm-drawer" role="dialog" aria-modal="true" aria-label="删除 API Key" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <p className="eyebrow">危险操作</p>
            <h2>删除 {deleteTarget.name}</h2>
          </div>
          <button className="icon-button" onClick={() => setDeleteTarget(null)} title="关闭" aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <p className="confirm-copy">删除后调用方将不能继续使用这个 API Key。这个操作不会影响其他 Key。</p>
        <div className="confirm-actions">
          <button className="ghost-button" onClick={() => setDeleteTarget(null)}>
            取消
          </button>
          <button className="primary-button danger-button" onClick={() => void deleteKey()}>
            <Trash2 size={16} />
            确认删除
          </button>
        </div>
      </aside>
    </div>
  );
}

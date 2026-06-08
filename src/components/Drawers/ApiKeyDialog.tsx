import { Check, Copy, Plus, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useClipboardToast } from "../../hooks/useClipboardToast";
import { useFinOpsStore } from "../../store";

export function ApiKeyDialog() {
  const copyValue = useClipboardToast();
  const { keyDialog, keyName, createdSecret, setKeyDialog, setKeyName, submitKeyDialog } = useFinOpsStore(
    useShallow((state) => ({
      keyDialog: state.keyDialog,
      keyName: state.keyName,
      createdSecret: state.createdSecret,
      setKeyDialog: state.setKeyDialog,
      setKeyName: state.setKeyName,
      submitKeyDialog: state.submitKeyDialog
    }))
  );

  if (!keyDialog) return null;

  return (
    <div className="drawer-backdrop" role="presentation" onClick={() => setKeyDialog(null)}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={keyDialog.mode === "create" ? "创建 API Key" : "编辑 API Key"} onClick={(event) => event.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <p className="eyebrow">API Key</p>
            <h2>{keyDialog.mode === "create" ? "创建 API Key" : "编辑 API Key"}</h2>
          </div>
          <button className="icon-button" onClick={() => setKeyDialog(null)} title="关闭" aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <label>
          API Key 名称
          <input value={keyName} onChange={(event) => setKeyName(event.target.value)} autoFocus />
        </label>
        {createdSecret && (
          <div className="one-time-key" role="status">
            <span>仅显示一次，请立即复制保存。</span>
            <code>{createdSecret}</code>
            <button className="ghost-button" onClick={() => copyValue(createdSecret, "完整 API Key 已复制")}>
              <Copy size={16} />
              复制完整 Key
            </button>
          </div>
        )}
        <button className="primary-button" onClick={() => void submitKeyDialog()}>
          {keyDialog.mode === "create" ? <Plus size={16} /> : <Check size={16} />}
          {keyDialog.mode === "create" ? "创建并显示 Key" : "保存名称"}
        </button>
      </aside>
    </div>
  );
}

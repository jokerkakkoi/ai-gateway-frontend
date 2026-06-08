import { Copy, KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import type { ManagedApiKey } from "../../utils/finops";

type ApiKeyTableProps = {
  filteredKeys: ManagedApiKey[];
  onCreate: () => void;
  onCopy: (key: ManagedApiKey) => void;
  onEdit: (key: ManagedApiKey) => void;
  onDelete: (key: ManagedApiKey) => void;
};

export function ApiKeyTable({ filteredKeys, onCreate, onCopy, onEdit, onDelete }: ApiKeyTableProps) {
  return (
    <section className="panel api-key-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Key Management</p>
          <h2>API Keys</h2>
        </div>
        <button className="primary-button" onClick={onCreate}>
          <Plus size={16} />
          创建 API Key
        </button>
      </div>
      <p className="api-key-note">
        列表内是你的全部 API Key。API Key 仅在创建时可见，请妥善保存，不要与他人共享或暴露在浏览器、客户端代码中。为保护账户安全，疑似公开泄露的 API Key 可能会被自动禁用。
      </p>
      <div className="data-table api-key-table">
        <div className="table-head">
          <span>名称</span>
          <span>Key</span>
          <span>创建日期</span>
          <span>最新使用日期</span>
          <span>操作</span>
        </div>
        {filteredKeys.map((key) => (
          <div className="table-row api-key-row" key={key.id}>
            <div className="key-cell">
              <div className="key-icon">
                <KeyRound size={16} />
              </div>
              <div>
                <strong>{key.name}</strong>
                <span>本地管理 Key</span>
              </div>
            </div>
            <div className="key-value">
              <code className="masked-key">{key.maskedKey}</code>
              <button className="icon-button" title="复制完整 Key" aria-label={`复制 ${key.name} 完整 Key`} onClick={() => onCopy(key)}>
                <Copy size={16} />
              </button>
            </div>
            <span>{key.createdAt}</span>
            <span>{key.lastUsedAt}</span>
            <div className="row-actions">
              <button className="icon-button" title="编辑名称" aria-label={`编辑 ${key.name}`} onClick={() => onEdit(key)}>
                <Pencil size={16} />
              </button>
              <button className="icon-button danger" title="删除 Key" aria-label={`删除 ${key.name}`} onClick={() => onDelete(key)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {filteredKeys.length === 0 && (
          <div className="empty-state">
            <KeyRound size={18} />
            <strong>没有匹配的 API Key</strong>
            <span>调整搜索词，或创建新的 API Key。</span>
          </div>
        )}
      </div>
    </section>
  );
}

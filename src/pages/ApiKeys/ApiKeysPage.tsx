import { ApiKeyTable } from "../../components/ApiKeyTable";
import { useClipboardToast } from "../../hooks/useClipboardToast";
import { useFilteredFinOpsData } from "../../hooks/useFilteredFinOpsData";
import { useFinOpsStore } from "../../store";

export function ApiKeysPage() {
  const copyValue = useClipboardToast();
  const { filteredKeys } = useFilteredFinOpsData();
  const openCreateKeyDialog = useFinOpsStore((state) => state.openCreateKeyDialog);
  const openEditKeyDialog = useFinOpsStore((state) => state.openEditKeyDialog);
  const setDeleteTarget = useFinOpsStore((state) => state.setDeleteTarget);

  return (
    <section className="single-page-layout">
      <ApiKeyTable
        filteredKeys={filteredKeys}
        onCreate={openCreateKeyDialog}
        onCopy={(key) => copyValue(key.secret, `已复制 ${key.name} 的完整 Key`)}
        onEdit={openEditKeyDialog}
        onDelete={setDeleteTarget}
      />
    </section>
  );
}

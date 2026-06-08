import { useFinOpsStore } from "../../store";
import { ApiKeyDialog } from "./ApiKeyDialog";
import { DeleteKeyDialog } from "./DeleteKeyDialog";
import { RuleDrawer } from "./RuleDrawer";

export function GlobalOverlays() {
  const toast = useFinOpsStore((state) => state.toast);

  return (
    <>
      <RuleDrawer />
      <ApiKeyDialog />
      <DeleteKeyDialog />
      <div className="toast" role="status">
        {toast}
      </div>
    </>
  );
}

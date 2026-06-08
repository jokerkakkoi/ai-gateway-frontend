import { useFinOpsStore } from "../store";

export function useClipboardToast() {
  const setToast = useFinOpsStore((state) => state.setToast);

  return (value: string, message: string) => {
    void navigator.clipboard?.writeText(value);
    setToast(message);
  };
}

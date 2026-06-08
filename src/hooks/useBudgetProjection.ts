import { useMemo } from "react";
import { useFinOpsStore } from "../store";
import { projectBudgetBurn } from "../utils/finops";

export function useBudgetProjection() {
  const viewMode = useFinOpsStore((state) => state.viewMode);

  return useMemo(
    () =>
      projectBudgetBurn({
        spendToDate: 8421,
        monthlyBudget: viewMode === "team" ? 12000 : 900,
        elapsedDays: 18,
        daysInMonth: 30
      }),
    [viewMode]
  );
}

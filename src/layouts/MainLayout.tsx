import { Outlet, useLocation } from "react-router";
import { useShallow } from "zustand/react/shallow";
import { Sidebar, Topbar } from "../components/AppNavigation";
import { GlobalOverlays } from "../components/Drawers";
import { useBudgetProjection } from "../hooks/useBudgetProjection";
import { sectionFromPath } from "../router/routes";
import { useFinOpsStore } from "../store";

export function MainLayout() {
  const location = useLocation();
  const section = sectionFromPath(location.pathname) ?? "overview";
  const budget = useBudgetProjection();
  const { sidebarOpen, setSidebarOpen } = useFinOpsStore(
    useShallow((state) => ({
      sidebarOpen: state.sidebarOpen,
      setSidebarOpen: state.setSidebarOpen
    }))
  );

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} projectedRatio={budget.projectedRatio} onSelect={() => setSidebarOpen(false)} />
      <main className="workspace">
        <Topbar section={section} />
        <Outlet />
      </main>
      <GlobalOverlays />
    </div>
  );
}

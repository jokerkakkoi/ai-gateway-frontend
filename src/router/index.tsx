import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { MainLayout } from "../layouts/MainLayout";
import { ApiKeysPage } from "../pages/ApiKeys";
import { OverviewPage } from "../pages/Overview";
import { PlaceholderPage } from "../pages/Placeholder";
import { UsagePage } from "../pages/Usage";
import { placeholderSections } from "./routes";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="usage" element={<UsagePage />} />
          <Route path="keys" element={<ApiKeysPage />} />
          {placeholderSections.map((section) => (
            <Route key={section} path={section} element={<PlaceholderPage section={section} />} />
          ))}
        </Route>
        <Route path="/teams" element={<Navigate to="/usage" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

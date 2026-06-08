import { Bell, Download, Search, SlidersHorizontal } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import type { Section } from "../../store";
import { useFinOpsStore } from "../../store";
import { sectionLabel } from "../../router/routes";

type TopbarProps = {
  section: Section;
};

export function Topbar({ section }: TopbarProps) {
  const {
    viewMode,
    period,
    searchQuery,
    sidebarOpen,
    setViewMode,
    setPeriod,
    setSearchQuery,
    setSidebarOpen,
    setToast
  } = useFinOpsStore(
    useShallow((state) => ({
      viewMode: state.viewMode,
      period: state.period,
      searchQuery: state.searchQuery,
      sidebarOpen: state.sidebarOpen,
      setViewMode: state.setViewMode,
      setPeriod: state.setPeriod,
      setSearchQuery: state.setSearchQuery,
      setSidebarOpen: state.setSidebarOpen,
      setToast: state.setToast
    }))
  );

  return (
    <header className="topbar">
      <button className="icon-button mobile-only" onClick={() => setSidebarOpen(!sidebarOpen)} title="打开导航" aria-label="打开导航">
        <SlidersHorizontal size={18} />
      </button>
      <div>
        <p className="eyebrow">团队治理台 / {sectionLabel(section)}</p>
        <h1>大模型 API 网关 FinOps</h1>
      </div>
      <div className="top-actions">
        <label className="search-box">
          <Search size={16} />
          <input aria-label="搜索 API Key 或团队" placeholder="搜索 Key、团队、模型" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
        </label>
        <select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="计费周期">
          <option value="2026-06">2026 年 6 月</option>
          <option value="2026-05">2026 年 5 月</option>
          <option value="2026-Q2">2026 Q2</option>
        </select>
        <div className="segmented" aria-label="个人或团队视图">
          <button className={viewMode === "team" ? "selected" : ""} onClick={() => setViewMode("team")}>
            团队
          </button>
          <button className={viewMode === "personal" ? "selected" : ""} onClick={() => setViewMode("personal")}>
            个人
          </button>
        </div>
        <button className="icon-button" title="通知" aria-label="通知" onClick={() => setToast("近 3 条预算与 Key 风险通知")}>
          <Bell size={18} />
        </button>
        <button className="ghost-button" onClick={() => setToast("已导出当前计费周期报表")}>
          <Download size={16} />
          导出
        </button>
      </div>
    </header>
  );
}

import { NavLink } from "react-router";
import { navItems } from "../../router/routes";

type SidebarProps = {
  open: boolean;
  projectedRatio: number;
  onSelect: () => void;
};

export function Sidebar({ open, projectedRatio, onSelect }: SidebarProps) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-mark">F</div>
        <div>
          <strong>FinOps Gateway</strong>
          <span>LLM API 控制台</span>
        </div>
      </div>
      <nav className="nav-list" aria-label="主导航">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.id} to={item.path} end={item.id === "overview"} className={({ isActive }) => (isActive ? "active" : "")} onClick={onSelect} title={item.label}>
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <span>预算守卫</span>
        <strong>{Math.round(projectedRatio * 100)}%</strong>
        <div className="progress slim">
          <span style={{ width: `${Math.min(projectedRatio * 100, 100)}%` }} />
        </div>
      </div>
    </aside>
  );
}

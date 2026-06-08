import {
  BarChart3,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  Route as RouteIcon,
  Settings,
  ShieldCheck,
  UsersRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Section } from "../store";

export type NavItem = {
  id: Section;
  label: string;
  path: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { id: "overview", label: "总览", path: "/", icon: LayoutDashboard },
  { id: "usage", label: "额度", path: "/usage", icon: UsersRound },
  { id: "keys", label: "API Key", path: "/keys", icon: KeyRound },
  { id: "billing", label: "账单", path: "/billing", icon: CreditCard },
  { id: "models", label: "模型价格", path: "/models", icon: BarChart3 },
  { id: "routing", label: "路由策略", path: "/routing", icon: RouteIcon },
  { id: "approvals", label: "审批", path: "/approvals", icon: ShieldCheck },
  { id: "settings", label: "设置", path: "/settings", icon: Settings }
];

export const placeholderSections: Section[] = ["billing", "models", "routing", "approvals", "settings"];

export function sectionFromPath(pathname: string): Section | null {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  return navItems.find((item) => item.path === normalizedPath)?.id ?? null;
}

export function sectionLabel(section: Section) {
  return navItems.find((item) => item.id === section)?.label ?? "总览";
}

import {
  AlertTriangle,
  ArrowDownUp,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Copy,
  CreditCard,
  Download,
  Gauge,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  MoreHorizontal,
  Pause,
  Pencil,
  Plug,
  Plus,
  RefreshCw,
  Route as RouteIcon,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserRoundCog,
  UsersRound,
  WalletCards,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { BrowserRouter, Navigate, NavLink, useLocation } from "react-router";
import {
  calculateMonthlySpend,
  createApiKeyRecord,
  estimateTokenCost,
  formatCompactNumber,
  formatCurrency,
  projectBudgetBurn,
  type ManagedApiKey,
  type Price
} from "./finops";

type Section = "overview" | "teams" | "keys" | "billing" | "models" | "routing" | "approvals" | "settings";
type ViewMode = "team" | "personal";
type KeyDialog = { mode: "create" } | { mode: "edit"; keyId: string };

const modelPrices: Record<string, Price> = {
  "GPT-4.1": { inputPricePerMTok: 5, outputPricePerMTok: 15 },
  "Claude 3.7": { inputPricePerMTok: 3, outputPricePerMTok: 15 },
  "Gemini 2.5": { inputPricePerMTok: 1.25, outputPricePerMTok: 10 },
  "DeepSeek R1": { inputPricePerMTok: 0.55, outputPricePerMTok: 2.19 }
};

const usageRows = [
  { model: "GPT-4.1", inputTokens: 514_000_000, outputTokens: 143_000_000 },
  { model: "Claude 3.7", inputTokens: 304_000_000, outputTokens: 91_000_000 },
  { model: "Gemini 2.5", inputTokens: 426_000_000, outputTokens: 62_000_000 },
  { model: "DeepSeek R1", inputTokens: 790_000_000, outputTokens: 168_000_000 }
];

const initialApiKeys: ManagedApiKey[] = [
  createApiKeyRecord({
    id: "key-laptop",
    name: "Laptop",
    secret: "sk-45ce0abcdefghijklmnopqrstuvwxyza781",
    createdAt: "2026-04-29",
    lastUsedAt: "2026-05-11"
  }),
  createApiKeyRecord({
    id: "key-laptop-opencode",
    name: "Laptop OpenCode",
    secret: "sk-11b97abcdefghijklmnop9008",
    createdAt: "2026-05-27",
    lastUsedAt: "2026-06-04"
  }),
  createApiKeyRecord({
    id: "key-pchome-opencode",
    name: "PCHome OpenCode",
    secret: "sk-831b7abcdefghijklmnopqrst8ff8",
    createdAt: "2026-05-27",
    lastUsedAt: "2026-05-27"
  })
];

const rules = [
  { name: "生产 Key 达到 80% 额度自动预警", target: "prod-*", status: "enabled", budget: "$8,000", owner: "平台组" },
  { name: "高价模型调用需要审批", target: "GPT-4.1 / Claude", status: "draft", budget: "$1,200", owner: "财务运营" },
  { name: "个人免费池每月 30 美元", target: "个人模式", status: "enabled", budget: "$30 / 人", owner: "所有团队" },
  { name: "异常日增幅超过 35% 自动冻结", target: "全部 Key", status: "enabled", budget: "动态", owner: "安全组" }
];

const members = [
  { name: "林舟", role: "Owner", team: "研发平台", quota: 92, spend: 2480 },
  { name: "Ada Chen", role: "Admin", team: "数据应用", quota: 63, spend: 1730 },
  { name: "周遥", role: "Member", team: "增长", quota: 44, spend: 820 },
  { name: "Mika", role: "Member", team: "个人池", quota: 18, spend: 112 }
];

const billingQueue = [
  { id: "INV-0620", team: "研发平台", amount: 3270, status: "待归因", cycle: "2026-06" },
  { id: "INV-0618", team: "数据应用", amount: 1190, status: "待审批", cycle: "2026-06" },
  { id: "CR-042", team: "增长团队", amount: -284, status: "节省入账", cycle: "2026-06" }
];

const trend = [42, 58, 49, 71, 64, 83, 76, 91, 88, 69, 97, 82, 74, 93];
const navItems: Array<{ id: Section; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "总览", icon: LayoutDashboard },
  { id: "teams", label: "团队额度", icon: UsersRound },
  { id: "keys", label: "API Key", icon: KeyRound },
  { id: "billing", label: "账单", icon: CreditCard },
  { id: "models", label: "模型价格", icon: BarChart3 },
  { id: "routing", label: "路由策略", icon: RouteIcon },
  { id: "approvals", label: "审批", icon: ShieldCheck },
  { id: "settings", label: "设置", icon: Settings }
];

function App() {
  return (
    <BrowserRouter>
      <FinOpsConsole />
    </BrowserRouter>
  );
}

const sectionPaths: Record<Section, string> = {
  overview: "/",
  teams: "/teams",
  keys: "/keys",
  billing: "/billing",
  models: "/models",
  routing: "/routing",
  approvals: "/approvals",
  settings: "/settings"
};

const pathToSection = Object.fromEntries(Object.entries(sectionPaths).map(([section, path]) => [path, section])) as Partial<Record<string, Section>>;

function sectionFromPath(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  return pathToSection[normalizedPath] ?? null;
}

function FinOpsConsole() {
  const location = useLocation();
  const section = sectionFromPath(location.pathname);
  const [viewMode, setViewMode] = useState<ViewMode>("team");
  const [period, setPeriod] = useState("2026-06");
  const [selectedModel, setSelectedModel] = useState("GPT-4.1");
  const [inputTokens, setInputTokens] = useState(40_000);
  const [outputTokens, setOutputTokens] = useState(8_000);
  const [requests, setRequests] = useState(120);
  const [searchQuery, setSearchQuery] = useState("");
  const [managedKeys, setManagedKeys] = useState<ManagedApiKey[]>(initialApiKeys);
  const [keyDialog, setKeyDialog] = useState<KeyDialog | null>(null);
  const [keyName, setKeyName] = useState("");
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedApiKey | null>(null);
  const [enabledRules, setEnabledRules] = useState(() => new Set(["生产 Key 达到 80% 额度自动预警", "个人免费池每月 30 美元", "异常日增幅超过 35% 自动冻结"]));
  const [drawer, setDrawer] = useState<string | null>(null);
  const [toast, setToast] = useState("团队治理台已加载");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const monthlySpend = useMemo(() => calculateMonthlySpend(usageRows, modelPrices), []);
  const budget = projectBudgetBurn({ spendToDate: 8421, monthlyBudget: viewMode === "team" ? 12000 : 900, elapsedDays: 18, daysInMonth: 30 });
  const tokenCost = estimateTokenCost({ ...modelPrices[selectedModel], inputTokens, outputTokens });
  const batchCost = tokenCost * requests;

  const filteredKeys = managedKeys.filter((key) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return key.name.toLowerCase().includes(query) || key.maskedKey.toLowerCase().includes(query);
  });

  if (!section) {
    return <Navigate to="/" replace />;
  }

  function toggleRule(ruleName: string) {
    setEnabledRules((previous) => {
      const next = new Set(previous);
      if (next.has(ruleName)) {
        next.delete(ruleName);
        setToast(`已暂停规则：${ruleName}`);
      } else {
        next.add(ruleName);
        setToast(`已启用规则：${ruleName}`);
      }
      return next;
    });
  }

  function acknowledge(action: string) {
    setToast(action);
  }

  function openCreateKeyDialog() {
    setKeyName("");
    setCreatedSecret(null);
    setKeyDialog({ mode: "create" });
  }

  function openEditKeyDialog(key: ManagedApiKey) {
    setKeyName(key.name);
    setCreatedSecret(null);
    setKeyDialog({ mode: "edit", keyId: key.id });
  }

  function submitKeyDialog() {
    const trimmedName = keyName.trim();

    if (!trimmedName) {
      acknowledge("请输入 API Key 名称");
      return;
    }

    if (keyDialog?.mode === "edit") {
      setManagedKeys((keys) => keys.map((key) => (key.id === keyDialog.keyId ? { ...key, name: trimmedName } : key)));
      acknowledge("API Key 名称已更新");
      setKeyDialog(null);
      return;
    }

    const secret = generateApiKeySecret();
    const record = createApiKeyRecord({
      id: `key-${Date.now()}`,
      name: trimmedName,
      secret,
      createdAt: new Date().toISOString().slice(0, 10)
    });

    setManagedKeys((keys) => [record, ...keys]);
    setCreatedSecret(secret);
    setKeyName(record.name);
    acknowledge("API Key 已创建，请立即复制保存");
  }

  function deleteKey() {
    if (!deleteTarget) return;

    setManagedKeys((keys) => keys.filter((key) => key.id !== deleteTarget.id));
    acknowledge(`${deleteTarget.name} 已删除`);
    setDeleteTarget(null);
  }

  function copyValue(value: string, message: string) {
    void navigator.clipboard?.writeText(value);
    acknowledge(message);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
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
              <NavLink
                key={item.id}
                to={sectionPaths[item.id]}
                end={item.id === "overview"}
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={() => setSidebarOpen(false)}
                title={item.label}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <span>预算守卫</span>
          <strong>{Math.round(budget.projectedRatio * 100)}%</strong>
          <div className="progress slim">
            <span style={{ width: `${Math.min(budget.projectedRatio * 100, 100)}%` }} />
          </div>
        </div>
      </aside>

      <main className="workspace">
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
              <input
                aria-label="搜索 API Key 或团队"
                placeholder="搜索 Key、团队、模型"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
            <select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="计费周期">
              <option value="2026-06">2026 年 6 月</option>
              <option value="2026-05">2026 年 5 月</option>
              <option value="2026-Q2">2026 Q2</option>
            </select>
            <div className="segmented" aria-label="个人或团队视图">
              <button className={viewMode === "team" ? "selected" : ""} onClick={() => setViewMode("team")}>团队</button>
              <button className={viewMode === "personal" ? "selected" : ""} onClick={() => setViewMode("personal")}>个人</button>
            </div>
            <button className="icon-button" title="通知" aria-label="通知" onClick={() => acknowledge("有 3 条预算与 Key 风险通知")}>
              <Bell size={18} />
            </button>
            <button className="ghost-button" onClick={() => acknowledge("已导出当前计费周期报表")}>
              <Download size={16} />
              导出
            </button>
          </div>
        </header>

        {section === "overview" && (
          <>
            <section className="summary-grid">
              <MetricCard icon={WalletCards} label="本月成本" value={formatCurrency(8421)} detail={`模型计费 ${formatCurrency(monthlySpend, 1)}`} tone="rose" />
              <MetricCard icon={Gauge} label="预算投影" value={`${Math.round(budget.projectedRatio * 100)}%`} detail={budget.status === "overrun" ? "预计超预算" : "预算健康"} tone="green" />
              <MetricCard icon={Sparkles} label="Token 总量" value={formatCompactNumber(2_034_000_000)} detail="输入 78% / 输出 22%" tone="teal" />
              <MetricCard icon={KeyRound} label="API Keys" value={`${managedKeys.length}`} detail={`${filteredKeys.length} 条匹配当前搜索`} tone="amber" />
            </section>

            <section className="content-layout">
              <div className="primary-stack">
                <BudgetPanel projection={budget} viewMode={viewMode} />
                <GovernanceRules enabledRules={enabledRules} onToggle={toggleRule} onEdit={setDrawer} />
                <ApiKeyTable
                  filteredKeys={filteredKeys}
                  onCreate={openCreateKeyDialog}
                  onCopy={(key) => copyValue(key.secret, `已复制 ${key.name} 的完整 Key`)}
                  onEdit={openEditKeyDialog}
                  onDelete={setDeleteTarget}
                />
              </div>

              <aside className="right-rail">
                <TokenCalculator
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  inputTokens={inputTokens}
                  setInputTokens={setInputTokens}
                  outputTokens={outputTokens}
                  setOutputTokens={setOutputTokens}
                  requests={requests}
                  setRequests={setRequests}
                  tokenCost={tokenCost}
                  batchCost={batchCost}
                />
                <BillingQueue acknowledge={acknowledge} />
                <MembersPanel />
              </aside>
            </section>
          </>
        )}

        {section === "keys" && (
          <section className="single-page-layout">
            <ApiKeyTable
              filteredKeys={filteredKeys}
              onCreate={openCreateKeyDialog}
              onCopy={(key) => copyValue(key.secret, `已复制 ${key.name} 的完整 Key`)}
              onEdit={openEditKeyDialog}
              onDelete={setDeleteTarget}
            />
          </section>
        )}

        {section !== "overview" && section !== "keys" && <SectionPlaceholder section={section} />}
      </main>

      {drawer && (
        <div className="drawer-backdrop" role="presentation" onClick={() => setDrawer(null)}>
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="编辑限额规则" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <p className="eyebrow">限额规则</p>
                <h2>{drawer}</h2>
              </div>
              <button className="icon-button" onClick={() => setDrawer(null)} title="关闭" aria-label="关闭">
                <X size={18} />
              </button>
            </div>
            <label>
              月度预算
              <input value="$1,200" readOnly />
            </label>
            <label>
              触发条件
              <select defaultValue="80">
                <option value="80">额度使用达到 80%</option>
                <option value="35">日成本增长超过 35%</option>
                <option value="approval">高价模型审批</option>
              </select>
            </label>
            <label>
              处理动作
              <select defaultValue="notify">
                <option value="notify">通知 Owner 并创建审批</option>
                <option value="pause">暂停 Key</option>
                <option value="route">切换到成本优先路由</option>
              </select>
            </label>
            <button className="primary-button" onClick={() => { acknowledge("限额规则已保存"); setDrawer(null); }}>
              <Check size={16} />
              保存规则
            </button>
          </aside>
        </div>
      )}

      {keyDialog && (
        <div className="drawer-backdrop" role="presentation" onClick={() => setKeyDialog(null)}>
          <aside className="drawer" role="dialog" aria-modal="true" aria-label={keyDialog.mode === "create" ? "创建 API Key" : "编辑 API Key"} onClick={(event) => event.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <p className="eyebrow">API Key</p>
                <h2>{keyDialog.mode === "create" ? "创建 API Key" : "编辑 API Key"}</h2>
              </div>
              <button className="icon-button" onClick={() => setKeyDialog(null)} title="关闭" aria-label="关闭">
                <X size={18} />
              </button>
            </div>
            <label>
              API Key 名称
              <input value={keyName} onChange={(event) => setKeyName(event.target.value)} autoFocus />
            </label>
            {createdSecret && (
              <div className="one-time-key" role="status">
                <span>只显示一次，请立即复制保存。</span>
                <code>{createdSecret}</code>
                <button className="ghost-button" onClick={() => copyValue(createdSecret, "完整 API Key 已复制")}>
                  <Copy size={16} />
                  复制完整 Key
                </button>
              </div>
            )}
            <button className="primary-button" onClick={submitKeyDialog}>
              {keyDialog.mode === "create" ? <Plus size={16} /> : <Check size={16} />}
              {keyDialog.mode === "create" ? "创建并显示 Key" : "保存名称"}
            </button>
          </aside>
        </div>
      )}

      {deleteTarget && (
        <div className="drawer-backdrop" role="presentation" onClick={() => setDeleteTarget(null)}>
          <aside className="drawer confirm-drawer" role="dialog" aria-modal="true" aria-label="删除 API Key" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <p className="eyebrow">危险操作</p>
                <h2>删除 {deleteTarget.name}</h2>
              </div>
              <button className="icon-button" onClick={() => setDeleteTarget(null)} title="关闭" aria-label="关闭">
                <X size={18} />
              </button>
            </div>
            <p className="confirm-copy">删除后调用方将不能继续使用这个 API Key。这个操作不会影响其他 Key。</p>
            <div className="confirm-actions">
              <button className="ghost-button" onClick={() => setDeleteTarget(null)}>取消</button>
              <button className="primary-button danger-button" onClick={deleteKey}>
                <Trash2 size={16} />
                确认删除
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="toast" role="status">{toast}</div>
    </div>
  );
}

function sectionLabel(section: Section) {
  const found = navItems.find((item) => item.id === section);
  return found?.label ?? "总览";
}

function generateApiKeySecret() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(28);

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  const body = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `sk-${body}`;
}

function MetricCard({ icon: Icon, label, value, detail, tone }: { icon: typeof WalletCards; label: string; value: string; detail: string; tone: string }) {
  return (
    <article className={`metric ${tone}`}>
      <div className="metric-icon">
        <Icon size={18} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function BudgetPanel({ projection, viewMode }: { projection: ReturnType<typeof projectBudgetBurn>; viewMode: ViewMode }) {
  return (
    <section className="panel budget-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">{viewMode === "team" ? "团队预算" : "个人预算"}</p>
          <h2>预算燃尽与 Token 趋势</h2>
        </div>
        <button className="ghost-button">
          <ArrowDownUp size={16} />
          分摊规则
        </button>
      </div>
      <div className="budget-grid">
        <div className="burn-card">
          <div className="ring" style={{ "--value": `${Math.min(projection.projectedRatio * 100, 100)}` } as React.CSSProperties}>
            <span>{Math.round(projection.projectedRatio * 100)}%</span>
          </div>
          <div>
            <h3>{formatCurrency(projection.projectedSpend)} 预计月末成本</h3>
            <p>当前已使用 {Math.round(projection.usedRatio * 100)}% 预算。按当前速率，月末会超过安全线，需要审批或路由降本。</p>
          </div>
        </div>
        <div className="trend-card">
          <div className="chart-bars" aria-label="Token 趋势图">
            {trend.map((height, index) => (
              <span key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="legend-row">
            <span><i className="dot rose-dot" />输出 Token</span>
            <span><i className="dot green-dot" />输入 Token</span>
            <span><i className="dot teal-dot" />路由节省</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function GovernanceRules({ enabledRules, onToggle, onEdit }: { enabledRules: Set<string>; onToggle: (name: string) => void; onEdit: (name: string) => void }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Policy Guard</p>
          <h2>限额规则</h2>
        </div>
        <button className="primary-button" onClick={() => onEdit("新建限额规则")}>
          <SlidersHorizontal size={16} />
          新建规则
        </button>
      </div>
      <div className="rule-list">
        {rules.map((rule) => {
          const enabled = enabledRules.has(rule.name);
          return (
            <div className="rule-row" key={rule.name}>
              <div className={`rule-status ${enabled ? "enabled" : "draft"}`}>
                {enabled ? <ShieldCheck size={18} /> : <Clock3 size={18} />}
              </div>
              <div>
                <strong>{rule.name}</strong>
                <span>{rule.target} / {rule.owner}</span>
              </div>
              <span className="budget-pill">{rule.budget}</span>
              <button className={`toggle ${enabled ? "on" : ""}`} onClick={() => onToggle(rule.name)} aria-label={`切换 ${rule.name}`}>
                <span />
              </button>
              <button className="icon-button" onClick={() => onEdit(rule.name)} title="编辑规则" aria-label="编辑规则">
                <MoreHorizontal size={18} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ApiKeyTable({
  filteredKeys,
  onCreate,
  onCopy,
  onEdit,
  onDelete
}: {
  filteredKeys: ManagedApiKey[];
  onCreate: () => void;
  onCopy: (key: ManagedApiKey) => void;
  onEdit: (key: ManagedApiKey) => void;
  onDelete: (key: ManagedApiKey) => void;
}) {
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

function SectionPlaceholder({ section }: { section: Section }) {
  return (
    <section className="single-page-layout">
      <div className="panel placeholder-panel">
        <p className="eyebrow">Workspace</p>
        <h2>{sectionLabel(section)}</h2>
        <p>该页面的数据视图待接入。</p>
      </div>
    </section>
  );
}

function TokenCalculator({
  selectedModel,
  setSelectedModel,
  inputTokens,
  setInputTokens,
  outputTokens,
  setOutputTokens,
  requests,
  setRequests,
  tokenCost,
  batchCost
}: {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  inputTokens: number;
  setInputTokens: (value: number) => void;
  outputTokens: number;
  setOutputTokens: (value: number) => void;
  requests: number;
  setRequests: (value: number) => void;
  tokenCost: number;
  batchCost: number;
}) {
  return (
    <section className="panel calc-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Calculator</p>
          <h2>Token 成本计算器</h2>
        </div>
        <CircleDollarSign size={20} />
      </div>
      <label>
        模型
        <select value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)}>
          {Object.keys(modelPrices).map((model) => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </label>
      <Slider label="输入 Token" value={inputTokens} min={1_000} max={200_000} step={1_000} onChange={setInputTokens} />
      <Slider label="输出 Token" value={outputTokens} min={1_000} max={80_000} step={1_000} onChange={setOutputTokens} />
      <Slider label="请求次数" value={requests} min={1} max={2000} step={1} onChange={setRequests} />
      <div className="calc-result">
        <span>单次调用</span>
        <strong>{formatCurrency(tokenCost, 4)}</strong>
        <span>批量预估</span>
        <strong>{formatCurrency(batchCost, 2)}</strong>
      </div>
    </section>
  );
}

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return (
    <label className="slider-field">
      <span>{label}<strong>{value.toLocaleString()}</strong></span>
      <input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function BillingQueue({ acknowledge }: { acknowledge: (message: string) => void }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Billing</p>
          <h2>账单队列</h2>
        </div>
        <WalletCards size={20} />
      </div>
      <div className="queue">
        {billingQueue.map((item) => (
          <div className="queue-item" key={item.id}>
            <div>
              <strong>{item.id}</strong>
              <span>{item.team} / {item.cycle}</span>
            </div>
            <span className={item.amount < 0 ? "credit" : ""}>{formatCurrency(item.amount)}</span>
            <button className="tiny-button" onClick={() => acknowledge(`${item.id} 已处理为：${item.status}`)}>{item.status}</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function MembersPanel() {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Members</p>
          <h2>成员额度</h2>
        </div>
        <UserRoundCog size={20} />
      </div>
      <div className="members">
        {members.map((member) => (
          <div className="member-row" key={member.name}>
            <div>
              <strong>{member.name}</strong>
              <span>{member.team} / {member.role}</span>
            </div>
            <div>
              <div className="progress"><span style={{ width: `${member.quota}%` }} /></div>
              <small>{formatCurrency(member.spend)} / {member.quota}%</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default App;

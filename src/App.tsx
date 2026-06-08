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
  Plug,
  RefreshCw,
  Route,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRoundCog,
  UsersRound,
  WalletCards,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  calculateMonthlySpend,
  estimateTokenCost,
  flagKeyRisks,
  formatCompactNumber,
  formatCurrency,
  projectBudgetBurn,
  type Price
} from "./finops";

type Section = "overview" | "teams" | "keys" | "billing" | "models" | "routing" | "approvals" | "settings";
type ViewMode = "team" | "personal";
type RiskFilter = "all" | "risk" | "healthy";

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

const apiKeys = [
  {
    name: "prod-agent-core",
    owner: "研发平台组",
    scope: "生产",
    provider: "OpenAI / Claude",
    quotaUsedRatio: 0.86,
    dailySpendDeltaRatio: 0.18,
    spend: 3220,
    tokens: 162_000_000,
    lastUsed: "2 分钟前"
  },
  {
    name: "batch-summary",
    owner: "数据应用组",
    scope: "批处理",
    provider: "Gemini / DeepSeek",
    quotaUsedRatio: 0.48,
    dailySpendDeltaRatio: 0.44,
    spend: 940,
    tokens: 288_000_000,
    lastUsed: "18 分钟前"
  },
  {
    name: "sales-copilot",
    owner: "增长团队",
    scope: "内部工具",
    provider: "OpenAI",
    quotaUsedRatio: 0.74,
    dailySpendDeltaRatio: 0.12,
    spend: 1410,
    tokens: 72_000_000,
    lastUsed: "9 分钟前"
  },
  {
    name: "sandbox-lab",
    owner: "个人池",
    scope: "沙箱",
    provider: "DeepSeek",
    quotaUsedRatio: 0.36,
    dailySpendDeltaRatio: 0.08,
    spend: 186,
    tokens: 41_000_000,
    lastUsed: "1 小时前"
  }
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
  { id: "routing", label: "路由策略", icon: Route },
  { id: "approvals", label: "审批", icon: ShieldCheck },
  { id: "settings", label: "设置", icon: Settings }
];

function App() {
  const [section, setSection] = useState<Section>("overview");
  const [viewMode, setViewMode] = useState<ViewMode>("team");
  const [period, setPeriod] = useState("2026-06");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [selectedModel, setSelectedModel] = useState("GPT-4.1");
  const [inputTokens, setInputTokens] = useState(40_000);
  const [outputTokens, setOutputTokens] = useState(8_000);
  const [requests, setRequests] = useState(120);
  const [enabledRules, setEnabledRules] = useState(() => new Set(["生产 Key 达到 80% 额度自动预警", "个人免费池每月 30 美元", "异常日增幅超过 35% 自动冻结"]));
  const [drawer, setDrawer] = useState<string | null>(null);
  const [toast, setToast] = useState("团队治理台已加载");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const riskNames = useMemo(() => new Set(flagKeyRisks(apiKeys).map((risk) => risk.name)), []);
  const monthlySpend = useMemo(() => calculateMonthlySpend(usageRows, modelPrices), []);
  const budget = projectBudgetBurn({ spendToDate: 8421, monthlyBudget: viewMode === "team" ? 12000 : 900, elapsedDays: 18, daysInMonth: 30 });
  const tokenCost = estimateTokenCost({ ...modelPrices[selectedModel], inputTokens, outputTokens });
  const batchCost = tokenCost * requests;

  const filteredKeys = apiKeys.filter((key) => {
    if (riskFilter === "risk") return riskNames.has(key.name);
    if (riskFilter === "healthy") return !riskNames.has(key.name);
    return true;
  });

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
              <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)} title={item.label}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
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
              <input aria-label="搜索 API Key 或团队" placeholder="搜索 Key、团队、模型" />
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

        <section className="summary-grid">
          <MetricCard icon={WalletCards} label="本月成本" value={formatCurrency(8421)} detail={`模型计费 ${formatCurrency(monthlySpend, 1)}`} tone="rose" />
          <MetricCard icon={Gauge} label="预算投影" value={`${Math.round(budget.projectedRatio * 100)}%`} detail={budget.status === "overrun" ? "预计超预算" : "预算健康"} tone="green" />
          <MetricCard icon={Sparkles} label="Token 总量" value={formatCompactNumber(2_034_000_000)} detail="输入 78% / 输出 22%" tone="teal" />
          <MetricCard icon={AlertTriangle} label="Key 风险" value={`${riskNames.size}`} detail="额度或日增幅异常" tone="amber" />
        </section>

        <section className="content-layout">
          <div className="primary-stack">
            <BudgetPanel projection={budget} viewMode={viewMode} />
            <GovernanceRules enabledRules={enabledRules} onToggle={toggleRule} onEdit={setDrawer} />
            <ApiKeyTable filteredKeys={filteredKeys} riskNames={riskNames} riskFilter={riskFilter} setRiskFilter={setRiskFilter} acknowledge={acknowledge} />
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

      <div className="toast" role="status">{toast}</div>
    </div>
  );
}

function sectionLabel(section: Section) {
  const found = navItems.find((item) => item.id === section);
  return found?.label ?? "总览";
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
  riskNames,
  riskFilter,
  setRiskFilter,
  acknowledge
}: {
  filteredKeys: typeof apiKeys;
  riskNames: Set<string>;
  riskFilter: RiskFilter;
  setRiskFilter: (filter: RiskFilter) => void;
  acknowledge: (message: string) => void;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Key Health</p>
          <h2>API Key 风险队列</h2>
        </div>
        <div className="segmented">
          <button className={riskFilter === "all" ? "selected" : ""} onClick={() => setRiskFilter("all")}>全部</button>
          <button className={riskFilter === "risk" ? "selected" : ""} onClick={() => setRiskFilter("risk")}>风险</button>
          <button className={riskFilter === "healthy" ? "selected" : ""} onClick={() => setRiskFilter("healthy")}>健康</button>
        </div>
      </div>
      <div className="data-table">
        <div className="table-head">
          <span>Key / Owner</span>
          <span>额度</span>
          <span>成本</span>
          <span>Token</span>
          <span>操作</span>
        </div>
        {filteredKeys.map((key) => {
          const risky = riskNames.has(key.name);
          return (
            <div className="table-row" key={key.name}>
              <div className="key-cell">
                <div className={`key-icon ${risky ? "risk" : ""}`}>
                  {risky ? <AlertTriangle size={16} /> : <KeyRound size={16} />}
                </div>
                <div>
                  <strong>{key.name}</strong>
                  <span>{key.owner} / {key.scope} / {key.lastUsed}</span>
                </div>
              </div>
              <div>
                <div className="progress"><span style={{ width: `${key.quotaUsedRatio * 100}%` }} /></div>
                <small>{Math.round(key.quotaUsedRatio * 100)}%</small>
              </div>
              <strong>{formatCurrency(key.spend)}</strong>
              <span>{formatCompactNumber(key.tokens)}</span>
              <div className="row-actions">
                <button className="icon-button" title="复制 Key" aria-label="复制 Key" onClick={() => acknowledge(`已复制 ${key.name} 的掩码 Key`)}>
                  <Copy size={16} />
                </button>
                <button className="icon-button" title="轮换 Key" aria-label="轮换 Key" onClick={() => acknowledge(`${key.name} 已加入轮换任务`)}>
                  <RefreshCw size={16} />
                </button>
                <button className="icon-button danger" title="暂停 Key" aria-label="暂停 Key" onClick={() => acknowledge(`${key.name} 已暂停并通知 Owner`)}>
                  <Pause size={16} />
                </button>
              </div>
            </div>
          );
        })}
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

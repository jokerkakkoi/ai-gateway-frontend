import { ArrowDownUp, Gauge, Plus, Sparkles, UserRoundCog, UsersRound, WalletCards } from "lucide-react";
import type { CSSProperties } from "react";
import { useShallow } from "zustand/react/shallow";
import { MetricCard } from "../../components/MetricCard";
import { useFilteredFinOpsData } from "../../hooks/useFilteredFinOpsData";
import { useFinOpsStore, type QuotaMember } from "../../store";
import { formatCurrency } from "../../utils/format";

export function UsagePage() {
  const { filteredMembers } = useFilteredFinOpsData();
  const { members, increaseMemberQuota, setToast } = useFinOpsStore(
    useShallow((state) => ({
      members: state.members,
      increaseMemberQuota: state.increaseMemberQuota,
      setToast: state.setToast
    }))
  );

  const totalQuota = members.reduce((total, member) => total + member.quotaUsd, 0);
  const totalSpend = members.reduce((total, member) => total + member.spend, 0);
  const totalRequests = members.reduce((total, member) => total + member.requests, 0);
  const availableQuota = totalQuota - totalSpend;
  const watchedMembers = members.filter((member) => member.status !== "正常").length;
  const usedRatio = totalQuota > 0 ? Math.round((totalSpend / totalQuota) * 100) : 0;

  return (
    <section className="single-page-layout usage-page">
      <section className="summary-grid usage-summary-grid">
        <MetricCard icon={WalletCards} label="总额度" value={formatCurrency(totalQuota)} detail={`${members.length} 个成员池`} tone="rose" />
        <MetricCard icon={Gauge} label="已用额度" value={`${usedRatio}%`} detail={`${formatCurrency(totalSpend)} 已消耗`} tone="green" />
        <MetricCard icon={Sparkles} label="剩余额度" value={formatCurrency(availableQuota)} detail="可继续分配" tone="teal" />
        <MetricCard icon={UsersRound} label="关注成员" value={`${watchedMembers}`} detail={`${totalRequests.toLocaleString()} 次调用`} tone="amber" />
      </section>

      <section className="panel usage-control-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Usage Control</p>
            <h2>额度</h2>
          </div>
          <button className="primary-button" onClick={() => setToast("新增额度申请已加入审批队列")}>
            <Plus size={16} />
            新增额度
          </button>
        </div>
        <div className="usage-control-grid">
          <div className="quota-overview-card">
            <div className="ring compact-ring" style={{ "--value": `${Math.min(usedRatio, 100)}` } as CSSProperties}>
              <span>{usedRatio}%</span>
            </div>
            <div>
              <h3>额度池健康度</h3>
              <p>研发平台接近安全线，新增模型调用应优先走审批或低成本路由；个人池仍有余量，可以承接低风险实验流量。</p>
            </div>
          </div>
          <div className="quota-policy-list" aria-label="额度策略">
            <div>
              <strong>自动预警</strong>
              <span>成员额度达到 80% 时通知 Owner。</span>
            </div>
            <div>
              <strong>申请审批</strong>
              <span>高价模型或超过 $500 的额度调整进入审批。</span>
            </div>
            <div>
              <strong>路由降本</strong>
              <span>非生产任务优先切到成本优先路由。</span>
            </div>
          </div>
        </div>
      </section>

      <section className="panel usage-table-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Allocation</p>
            <h2>额度分配</h2>
          </div>
          <span className="table-count">
            {filteredMembers.length} / {members.length}
          </span>
        </div>
        <div className="data-table quota-table">
          <div className="table-head">
            <span>成员</span>
            <span>团队</span>
            <span>额度使用</span>
            <span>Token 占比</span>
            <span>操作</span>
          </div>
          {filteredMembers.map((member) => (
            <QuotaRow key={member.id} member={member} onIncreaseMemberQuota={(memberId) => void increaseMemberQuota(memberId)} />
          ))}
          {filteredMembers.length === 0 && (
            <div className="empty-state">
              <UsersRound size={18} />
              <strong>没有匹配的额度成员</strong>
              <span>调整搜索词，或新增额度申请。</span>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

function QuotaRow({ member, onIncreaseMemberQuota }: { member: QuotaMember; onIncreaseMemberQuota: (memberId: string) => void }) {
  return (
    <div className="table-row quota-row">
      <div className="key-cell">
        <div className={`key-icon ${member.status === "关注" ? "risk" : ""}`}>
          <UserRoundCog size={16} />
        </div>
        <div>
          <strong>{member.name}</strong>
          <span>{member.role}</span>
        </div>
      </div>
      <span>{member.team}</span>
      <div className="quota-usage">
        <div className="progress">
          <span style={{ width: `${member.quotaPercent}%` }} />
        </div>
        <small>
          {formatCurrency(member.spend)} / {formatCurrency(member.quotaUsd)}
        </small>
      </div>
      <div className="quota-share">
        <strong>{member.tokenShare}%</strong>
        <span className={`status-pill ${quotaStatusTone(member.status)}`}>{member.status}</span>
      </div>
      <div className="row-actions">
        <button className="ghost-button" onClick={() => onIncreaseMemberQuota(member.id)} aria-label={`提高 ${member.name} 额度`}>
          <ArrowDownUp size={16} />
          提额
        </button>
      </div>
    </div>
  );
}

function quotaStatusTone(status: QuotaMember["status"]) {
  if (status === "超限") return "danger";
  if (status === "关注") return "watch";
  return "healthy";
}

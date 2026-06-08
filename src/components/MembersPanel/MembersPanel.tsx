import { UserRoundCog } from "lucide-react";
import type { QuotaMember } from "../../store";
import { formatCurrency } from "../../utils/format";

type MembersPanelProps = {
  members: QuotaMember[];
};

export function MembersPanel({ members }: MembersPanelProps) {
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
          <div className="member-row" key={member.id}>
            <div>
              <strong>{member.name}</strong>
              <span>
                {member.team} / {member.role}
              </span>
            </div>
            <div>
              <div className="progress">
                <span style={{ width: `${member.quotaPercent}%` }} />
              </div>
              <small>
                {formatCurrency(member.spend)} / {formatCurrency(member.quotaUsd)}
              </small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

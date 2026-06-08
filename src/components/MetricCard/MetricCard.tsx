import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone: "rose" | "green" | "teal" | "amber";
};

export function MetricCard({ icon: Icon, label, value, detail, tone }: MetricCardProps) {
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

import { WalletCards } from "lucide-react";
import type { BillingQueueItem } from "../../store";
import { formatCurrency } from "../../utils/format";

type BillingQueueProps = {
  items: BillingQueueItem[];
  acknowledge: (message: string) => void;
};

export function BillingQueue({ items, acknowledge }: BillingQueueProps) {
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
        {items.map((item) => (
          <div className="queue-item" key={item.id}>
            <div>
              <strong>{item.id}</strong>
              <span>
                {item.team} / {item.cycle}
              </span>
            </div>
            <span className={item.amount < 0 ? "credit" : ""}>{formatCurrency(item.amount)}</span>
            <button className="tiny-button" onClick={() => acknowledge(`${item.id} 已处理为：${item.status}`)}>
              {item.status}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

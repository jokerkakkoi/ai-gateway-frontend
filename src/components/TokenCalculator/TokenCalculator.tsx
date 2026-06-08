import { CircleDollarSign } from "lucide-react";
import type { Price } from "../../utils/finops";
import { formatCurrency } from "../../utils/format";
import { Slider } from "../Slider";

type TokenCalculatorProps = {
  modelPrices: Record<string, Price>;
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
};

export function TokenCalculator({
  modelPrices,
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
}: TokenCalculatorProps) {
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
            <option key={model} value={model}>
              {model}
            </option>
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

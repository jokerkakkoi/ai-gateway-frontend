type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

export function Slider({ label, value, min, max, step, onChange }: SliderProps) {
  return (
    <label className="slider-field">
      <span>
        {label}
        <strong>{value.toLocaleString()}</strong>
      </span>
      <input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
